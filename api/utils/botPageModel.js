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
const { labelsFor } = require('./botLabels');
const botPagePaths = require('./botPagePaths');

const BRAND = 'Grottocenter';
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const DEFAULT_LANGUAGE = 'eng';
const OG_IMAGE_PATH = '/og-image.png';
// The t_country columns that exist, by BCP 47 tag; any other language: English
const COUNTRY_COLUMNS = Object.freeze([
  'en',
  'fr',
  'es',
  'de',
  'it',
  'nl',
  'ca',
  'bg',
]);

/**
 * Hook for the country and region hubs (#1935), which do not exist yet: the
 * breadcrumb names the country and the region but links to neither. Once the
 * hubs are published, pass `hubLinks` to the renderer with functions that
 * return the SPA address of a hub that is published (for example
 * `/ui/countries/FR/regions/01`) and null for one that is not. A crumb is a
 * link only when its function returns an address.
 */
const NO_HUB_LINKS = Object.freeze({
  country: () => null,
  region: () => null,
});

// BCP 47 language tag of a record language, an ISO 639-3 code in the view:
// the ISO 639-1 subtag when the language has one (`fra` -> `fr`), as BCP 47
// requires, else the 3-letter code, which the IANA registry holds for the
// languages without a 2-letter one. `tags` maps a 3-letter code to its 2-letter
// one (t_language.part1, see loadLanguageTags).
const langOf = (language, tags) => {
  if (typeof language !== 'string' || !/^[A-Za-z]{2,3}$/.test(language)) {
    return null;
  }
  const code = language.toLowerCase();
  return tags.get(code) || code;
};

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

// Cuts to `max` characters (code points, never half a surrogate pair)
const truncate = (text, max) => {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars
    .slice(0, max - 1)
    .join('')
    .trimEnd()}…`;
};

/**
 * `<name> - Grottocenter`, at most 60 characters: a longer name is cut and
 * ends with an ellipsis, and the brand suffix is kept.
 */
const buildTitle = (name) => {
  const suffix = ` - ${BRAND}`;
  const trimmed = (name || '').trim();
  if (trimmed === '') return BRAND;
  return `${truncate(trimmed, TITLE_MAX - Array.from(suffix).length)}${suffix}`;
};

const isKnown = (value) =>
  value !== null && value !== undefined && value !== '';
// 0 means unknown for a depth or a length
const positive = (value) =>
  typeof value === 'number' && value > 0 ? value : null;

const countryNameOf = (code, tag, countryNames) => {
  if (!isKnown(code)) return null;
  const names = countryNames.get(String(code).toUpperCase());
  if (!names) return String(code);
  const column = COUNTRY_COLUMNS.includes(tag) ? tag : 'en';
  return names[column] || names.en || String(code);
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
  const countryName = countryNameOf(entrance.country, lang, countryNames);
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

const buildBreadcrumb = (page, name, { lang, countryNames, hubLinks }) => {
  const entrance = (page.entrances || []).find(
    (e) => isKnown(e.regionCode) && isKnown(e.country)
  );
  if (!entrance) return [];
  const country = String(entrance.country).toUpperCase();
  return [
    {
      text: countryNameOf(country, lang, countryNames),
      url: hubLinks.country(country) || null,
    },
    {
      text: isKnown(entrance.region) ? entrance.region : entrance.regionCode,
      url: hubLinks.region(country, entrance.regionCode) || null,
    },
    { text: name, url: null },
  ];
};

const buildMetaDescription = (parts) =>
  truncate(parts.filter(isKnown).join(' '), DESCRIPTION_MAX);

const sentence = (text) => (isKnown(text) ? `${text}.` : null);

const placeOf = (items) => items.filter(isKnown).join(', ');

/**
 * @param {{entity_type: string, entity_id: number, language: ?string, page: object}} row
 * @param {object} options
 * @param {string} options.baseUrl the SPA's address, `https://grottocenter.org/ui`
 * @param {Map<string,string>} options.languageTags ISO 639-3 -> 639-1
 * @param {Map<string,object>} options.countryNames ISO 3166-1 alpha-2 -> names
 *   by language tag (see BotRenderService.loadCountryNames)
 * @param {{country: Function, region: Function}} [options.hubLinks] see NO_HUB_LINKS
 * @returns {object} the model
 */
const buildPageModel = (
  row,
  { baseUrl, languageTags, countryNames, hubLinks = NO_HUB_LINKS }
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
    labels,
    url,
    siteUrl: baseUrl,
    name,
    title: buildTitle(name),
    ogImage: new URL(OG_IMAGE_PATH, baseUrl).href,
    descriptions: buildDescriptions(page.descriptions, lang, tag),
    breadcrumb: [],
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
    const place = entrances.find((e) => e.facts.length > 0);
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
    model.description = buildMetaDescription([
      sentence(`${labels.massif}: ${name}`),
      model.caves.length > 0
        ? sentence(
            `${labels.caves}: ${model.caves.map((c) => c.name).join(', ')}`
          )
        : null,
    ]);
  } else {
    const countryName = countryNameOf(page.country, lang, countryNames);
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
