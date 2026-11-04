/**
 * The page model: everything a bot page shows, computed once from a v_bot_page
 * row. The HTML templates and the JSON-LD both read this object and nothing
 * else, so they cannot disagree and neither can reach a field the whitelist
 * does not name.
 *
 * The row's `page` goes through `botSurfaceWhitelist.project` first: a key the
 * whitelist does not list (a coordinate, a protection flag, anything a future
 * view column adds) is dropped there and never reaches a template. As a second
 * line, an entrance that carries `isSensitive: true` is left out before the
 * projection: the view never produces one, but a caller that handed a raw row
 * to the renderer would otherwise publish its name and locality.
 *
 * Language of a page (decided on #1766): the language of the record's main
 * name (`row.language`); without one, the language of the first description;
 * without one, English. Labels come from the front's UI translations
 * (api/utils/botLabels) in that language, English when the front has none. The
 * names of the countries come from t_country in that language, English when
 * the table has no column for it. City, region and county are shown as stored.
 *
 * Pure: loads without Sails.
 */

const { project } = require('./botSurfaceWhitelist');
const { labelsFor, labelsLanguage } = require('./botLabels');
const botPagePaths = require('./botPagePaths');
const {
  TITLE_MAX,
  DESCRIPTION_MAX,
  langOf,
  truncate,
  buildTitle,
  isKnown,
  positive,
  countryNameOf,
  buildMetaDescription,
  sentence,
  cleanRegionName,
  byName,
  figureLines,
  capitalize,
} = require('./botModelParts');

const DEFAULT_LANGUAGE = 'eng';
const OG_IMAGE_PATH = '/og-image.png';
/**
 * The links to the country and region hubs (#1935). `hubLinks` holds functions
 * that return the SPA address of a hub that is published (for example
 * `https://grottocenter.org/ui/countries/FR/regions/01`) and null for one that
 * is not; a crumb or a list entry is a link only when its function returns an
 * address:
 *
 *   index()                  the countries index
 *   country(iso)             FR
 *   region(iso, regionCode)  FR, FR-01
 *
 * The generator builds them from the published hubs of the run
 * (BotHubService.createHubLinks), and every caller that renders a page passes
 * the same ones. NO_HUB_LINKS is for a caller that has no hubs: no link.
 */
const NO_HUB_LINKS = Object.freeze({
  index: () => null,
  country: () => null,
  region: () => null,
});

// The languages written right to left, among the tags a record can carry: the
// page is laid out right to left, labels and punctuation included
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'yi']);

// The free-text `url` of an organization: only an http(s) address is a link
const safeHttpUrl = (value) => {
  if (typeof value !== 'string') return null;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch (e) {
    return null;
  }
};

const firstDescriptionLanguage = (page) => {
  const lists = [
    page.descriptions || [],
    ...(page.entrances || []).map((entrance) => entrance.descriptions || []),
  ];
  const found = lists
    .flat()
    .find((description) => isKnown(description.language));
  return found ? found.language : null;
};

const yesNo = (labels, value) => (value ? labels.yes : labels.no);

// The page-language texts first, the others after, each group in its order
const buildDescriptions = (descriptions, lang, tag) => {
  const texts = (descriptions || [])
    .filter((d) => isKnown(d.title) || isKnown(d.body))
    .map((d) => {
      const descLang = isKnown(d.language) ? tag(d.language) : null;
      return {
        title: isKnown(d.title) ? d.title : null,
        body: isKnown(d.body) ? d.body : null,
        // null: the text carries no language, it inherits the page's
        lang: descLang,
        inPageLanguage: descLang === null || descLang === lang,
      };
    });
  return [
    ...texts.filter((t) => t.inPageLanguage),
    ...texts.filter((t) => !t.inPageLanguage),
  ];
};

const buildEntrance = (entrance, { lang, tag, labels, countryNames }) => {
  const countryName = countryNameOf(entrance.country, countryNames);
  const facts = [
    [labels.municipality, entrance.city],
    [labels.county, entrance.county],
    [labels.region, entrance.region],
    [labels.country, countryName],
    [labels.discoveryYear, entrance.discoveryYear],
  ]
    .filter(([, value]) => isKnown(value))
    .map(([label, value]) => ({ label, value: String(value) }));
  const flags = [
    ['dangerCo2', entrance.dangerCo2],
    ['dangerFlooding', entrance.dangerFlooding],
    ['dangerRockfall', entrance.dangerRockfall],
    ['dangerPollution', entrance.dangerPollution],
    ['hasBat', entrance.hasBat],
    ['needCleanGear', entrance.needCleanGear],
    ['needStayOnTrail', entrance.needStayOnTrail],
    ['hasRules', entrance.hasRules],
    ['isTouristic', entrance.isTouristic],
  ]
    .filter(([, value]) => typeof value === 'boolean')
    .map(([id, value]) => ({ label: labels[id], value: yesNo(labels, value) }));
  return {
    name: isKnown(entrance.name) ? entrance.name : null,
    city: entrance.city,
    county: entrance.county,
    region: entrance.region,
    countryName,
    facts: [...facts, ...flags],
    descriptions: buildDescriptions(entrance.descriptions, lang, tag),
  };
};

const buildBreadcrumb = (page, name, { countryNames, hubLinks }) => {
  const entrance = (page.entrances || []).find(
    (e) => isKnown(e.regionCode) && isKnown(e.country)
  );
  if (!entrance) return [];
  const country = String(entrance.country).toUpperCase();
  return [
    {
      text: countryNameOf(country, countryNames),
      url: hubLinks.country(country) || null,
    },
    {
      text:
        (isKnown(entrance.region) && cleanRegionName(entrance.region)) ||
        entrance.regionCode,
      url: hubLinks.region(country, entrance.regionCode) || null,
    },
    { text: name, url: null },
  ];
};

const placeOf = (items) => items.filter(isKnown).join(', ');

/**
 * @param {{entity_type: string, entity_id: number, language: ?string, page: object}} row
 * @param {object} options
 * @param {string} options.baseUrl the SPA's address, `https://grottocenter.org/ui`
 * @param {Map<string,string>} options.languageTags ISO 639-3 -> 639-1
 * @param {Map<string,string>} options.countryNames ISO 3166-1 alpha-2 ->
 *   t_country.native_name (see BotRenderService.loadCountryNames)
 * @param {{index: Function, country: Function, region: Function}} [options.hubLinks] see NO_HUB_LINKS
 * @param {Map<number, object>} [options.massifExtras] by massif id, what the
 *   massif page adds to the view's row: `{ figures, regions }` (see
 *   BotHubService.massifExtras); a massif absent from the map has neither
 * @returns {object} the model
 */
const buildPageModel = (
  row,
  { baseUrl, languageTags, countryNames, hubLinks, massifExtras = new Map() }
) => {
  const entityType = row.entity_type;
  const raw = row.page;
  const publicRaw =
    raw && Array.isArray(raw.entrances)
      ? {
          ...raw,
          entrances: raw.entrances.filter(
            (entrance) => !(entrance && entrance.isSensitive === true)
          ),
        }
      : raw;
  const page = project(entityType, 'top', publicRaw);

  const tag = (language) => langOf(language, languageTags);
  const lang =
    tag(row.language) ||
    tag(page.language) ||
    tag(firstDescriptionLanguage(page)) ||
    tag(DEFAULT_LANGUAGE);
  const labels = labelsFor(lang);
  const context = { lang, tag, labels, countryNames, hubLinks };
  const url = botPagePaths.toUrl(entityType, row.entity_id, baseUrl);
  const name = isKnown(page.name) ? page.name : '';
  const link = (type, id) => botPagePaths.toUrl(type, id, baseUrl);

  const model = {
    entityType,
    lang,
    dir: RTL_LANGUAGES.has(lang.split('-')[0]) ? 'rtl' : 'ltr',
    labels,
    url,
    siteUrl: baseUrl,
    name,
    title: buildTitle(name),
    ogImage: new URL(OG_IMAGE_PATH, baseUrl).href,
    descriptions: buildDescriptions(page.descriptions, lang, tag),
    breadcrumb: [],
    figures: [],
    // The front's "Caves" reads "Réseaux" in French, like "Networks"
    cavesHeading: capitalize(labels.cavesCount),
  };

  if (entityType === 'cave') {
    const entrances = (page.entrances || []).map((entrance) =>
      buildEntrance(entrance, context)
    );
    Object.assign(model, {
      depth: positive(page.depth),
      length: positive(page.length),
      temperature:
        typeof page.temperature === 'number' ? page.temperature : null,
      isDiving: typeof page.isDiving === 'boolean' ? page.isDiving : null,
      massifs: (page.massifs || []).map((massif) => ({
        name: massif.name,
        url: link('massif', massif.id),
      })),
      entrances,
      breadcrumb: buildBreadcrumb(page, name, context),
    });
    model.facts = [
      model.depth !== null && [labels.depth, `${model.depth} m`],
      model.length !== null && [labels.length, `${model.length} m`],
      model.temperature !== null && [
        labels.temperature,
        `${model.temperature} °C`,
      ],
      model.isDiving !== null && [
        labels.divingCave,
        yesNo(labels, model.isDiving),
      ],
    ]
      .filter(Boolean)
      .map(([label, value]) => ({ label, value }));
    // The first entrance that has a location: one with only flags has none
    const place = entrances.find((e) =>
      [e.city, e.region, e.countryName].some(isKnown)
    );
    const where = place
      ? placeOf([place.city, place.region, place.countryName])
      : '';
    model.description = buildMetaDescription([
      sentence(`${labels.cave}: ${name}`),
      model.depth !== null
        ? sentence(`${labels.depth}: ${model.depth} m`)
        : null,
      model.length !== null
        ? sentence(`${labels.length}: ${model.length} m`)
        : null,
      sentence(where),
    ]);
  } else if (entityType === 'massif') {
    model.caves = (page.caves || []).map((cave) => ({
      name: cave.name,
      url: link('cave', cave.id),
      depth: positive(cave.depth),
      length: positive(cave.length),
    }));
    // What the hubs add (#1935): the SPA's figures for the massif, and the
    // published region hubs of the regions its caves are in
    const extras = project(
      'massifExtras',
      'top',
      massifExtras.get(row.entity_id) || {}
    );
    model.figures = figureLines(extras.figures, labels, labelsLanguage(lang));
    model.regions = (extras.regions || [])
      .map((region) => ({
        text: cleanRegionName(region.name) || region.code,
        url: hubLinks.region(region.code.split('-')[0], region.code) || null,
      }))
      .filter((region) => region.url !== null)
      .sort(byName);
    model.description = buildMetaDescription([
      sentence(`${labels.massif}: ${name}`),
      model.caves.length > 0
        ? sentence(
            `${capitalize(labels.cavesCount)}: ${model.caves
              .map((c) => c.name)
              .join(', ')}`
          )
        : null,
    ]);
  } else {
    const countryName = countryNameOf(page.country, countryNames);
    Object.assign(model, {
      city: isKnown(page.city) ? page.city : null,
      county: isKnown(page.county) ? page.county : null,
      region: isKnown(page.region) ? page.region : null,
      countryName,
      website: safeHttpUrl(page.url),
      yearBirth: isKnown(page.yearBirth) ? page.yearBirth : null,
    });
    model.facts = [
      [labels.municipality, model.city],
      [labels.county, model.county],
      [labels.region, model.region],
      [labels.country, countryName],
      [labels.since, model.yearBirth],
    ]
      .filter(([, value]) => isKnown(value))
      .map(([label, value]) => ({ label, value: String(value) }));
    model.description = buildMetaDescription([
      sentence(`${labels.organization}: ${name}`),
      sentence(placeOf([model.city, model.region, countryName])),
      model.yearBirth !== null
        ? sentence(`${labels.since} ${model.yearBirth}`)
        : null,
    ]);
  }
  return model;
};

module.exports = {
  buildPageModel,
  buildTitle,
  langOf,
  truncate,
  NO_HUB_LINKS,
  TITLE_MAX,
  DESCRIPTION_MAX,
};
