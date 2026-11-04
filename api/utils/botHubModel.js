/**
 * The model of a hub page (#1935): the countries index, a country, a region.
 * Like botPageModel.js for a record, the templates and the JSON-LD read this
 * object and nothing else.
 *
 * The row is a v_bot_hub row, `{ hub_type, hub_key, language, page }`; its
 * `page` goes through the whitelist first (hubIndex, hubCountry, hubRegion).
 * The figures are not in the row: they are the SPA's own statistics, read by
 * the generator (BotHubService) and handed over as `hubFigures`, a Map keyed
 * `<hub_type>:<hub_key>`, which also gives the number of caves next to each
 * country and region of a list.
 *
 * Language: the row's `language` (the dominant language of the main names of
 * the hub's published caves), else English. The labels are the front's UI
 * translations, in English when the front has none for that language. A hub
 * holds no user-written text.
 *
 * Names: a country is t_country.native_name (countryNames), a region is the
 * cleaned t_iso3166_2.name carried by the row. Lists of regions, massifs and
 * countries are sorted by name here; the caves keep the order of the view
 * (best documented first).
 *
 * Pure: loads without Sails.
 */

const { project } = require('./botSurfaceWhitelist');
const { labelsFor, labelsLanguage } = require('./botLabels');
const botPagePaths = require('./botPagePaths');
const {
  langOf,
  buildTitle,
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
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'yi']);
const PAGE_TYPES = Object.freeze({
  index: 'hubIndex',
  country: 'hubCountry',
  region: 'hubRegion',
});

const figureKey = (hubType, hubKey) => `${hubType}:${hubKey}`;

// "Caves: 12" next to a country or a region of a list
const withCaves = (entry, labels, figures) => ({
  ...entry,
  caves:
    figures && typeof figures.nbCaves === 'number' ? figures.nbCaves : null,
  cavesLabel: labels.cavesCount,
});

/**
 * @param {{hub_type: string, hub_key: string, language: ?string, page: object}} row
 * @param {object} options
 * @param {string} options.baseUrl the SPA's address
 * @param {Map<string,string>} options.languageTags ISO 639-3 -> 639-1
 * @param {Map<string,string>} options.countryNames ISO 3166-1 alpha-2 -> native name
 * @param {Map<string,object>} options.hubFigures `<hub_type>:<hub_key>` -> figures
 * @param {{index: Function, country: Function, region: Function}} options.hubLinks
 * @returns {object} the model
 */
const buildHubModel = (
  row,
  { baseUrl, languageTags, countryNames, hubFigures, hubLinks }
) => {
  const hubType = row.hub_type;
  const pageType = PAGE_TYPES[hubType];
  if (!pageType) throw new RangeError(`Cannot render hub type ${hubType}`);
  const page = project(pageType, 'top', row.page);
  const tag = (language) => langOf(language, languageTags);
  const lang = tag(row.language) || tag(page.language) || tag(DEFAULT_LANGUAGE);
  const labels = labelsFor(lang);
  const figuresOf = (type, key) =>
    project('figures', 'top', hubFigures.get(figureKey(type, key)) || {});
  const link = (type, id) => botPagePaths.toUrl(type, id, baseUrl);

  const model = {
    entityType: 'hub',
    hubType,
    lang,
    dir: RTL_LANGUAGES.has(lang.split('-')[0]) ? 'rtl' : 'ltr',
    labels,
    url: botPagePaths.toHubUrl(hubType, row.hub_key, baseUrl),
    siteUrl: baseUrl,
    ogImage: new URL(OG_IMAGE_PATH, baseUrl).href,
    breadcrumb: [],
    figures: [],
    // The front's "Caves" reads "Réseaux" in French, like "Networks"
    cavesHeading: capitalize(labels.cavesCount),
    countries: [],
    regions: [],
    massifs: [],
    caves: [],
  };

  const listCaves = () =>
    (page.caves || []).map((cave) => ({
      name: cave.name,
      url: link('cave', cave.id),
      depth: positive(cave.depth),
      length: positive(cave.length),
    }));
  const listMassifs = () =>
    (page.massifs || [])
      .map((massif) => ({ text: massif.name, url: link('massif', massif.id) }))
      .sort(byName);
  const indexCrumb = () => ({
    text: labels.countries,
    url: hubLinks.index() || null,
  });

  if (hubType === 'index') {
    model.name = labels.countries;
    // A country is listed, and linked, only when its hub is published
    model.countries = (page.countries || [])
      .map((country) => ({ country, url: hubLinks.country(country.code) }))
      .filter(({ url }) => url)
      .map(({ country, url }) =>
        withCaves(
          {
            code: country.code,
            text: countryNameOf(country.code, countryNames),
            url,
          },
          labels,
          figuresOf('country', country.code)
        )
      )
      .sort(byName);
    model.description = buildMetaDescription([
      sentence(
        `${labels.countries}: ${model.countries.map((c) => c.text).join(', ')}`
      ),
    ]);
  } else if (hubType === 'country') {
    model.name = countryNameOf(page.code, countryNames);
    const figures = figuresOf('country', page.code);
    model.figures = figureLines(figures, labels, labelsLanguage(lang));
    model.breadcrumb = [indexCrumb(), { text: model.name, url: null }];
    // A region is listed, and linked, only when its hub is published
    model.regions = (page.regions || [])
      .map((region) => ({
        region,
        url: hubLinks.region(page.code, region.code),
      }))
      .filter(({ url }) => url)
      .map(({ region, url }) =>
        withCaves(
          {
            code: region.code,
            text: cleanRegionName(region.name) || region.code,
            url,
          },
          labels,
          figuresOf('region', region.code)
        )
      )
      .sort(byName);
    model.massifs = listMassifs();
    model.caves = listCaves();
    model.description = buildMetaDescription([
      sentence(`${labels.country}: ${model.name}`),
      positive(figures.nbCaves) !== null
        ? sentence(`${labels.cavesCount}: ${figures.nbCaves}`)
        : null,
      model.regions.length > 0
        ? sentence(
            `${labels.regions}: ${model.regions.map((r) => r.text).join(', ')}`
          )
        : null,
    ]);
  } else {
    model.name = cleanRegionName(page.name) || page.code;
    const figures = figuresOf('region', page.code);
    model.figures = figureLines(figures, labels, labelsLanguage(lang));
    const countryCode = page.country || page.code.split('-')[0];
    model.breadcrumb = [
      indexCrumb(),
      {
        text: countryNameOf(countryCode, countryNames),
        url: hubLinks.country(countryCode) || null,
      },
      { text: model.name, url: null },
    ];
    model.massifs = listMassifs();
    model.caves = listCaves();
    model.description = buildMetaDescription([
      sentence(`${labels.region}: ${model.name}`),
      sentence(countryNameOf(countryCode, countryNames)),
      positive(figures.nbCaves) !== null
        ? sentence(`${labels.cavesCount}: ${figures.nbCaves}`)
        : null,
    ]);
  }
  model.title = buildTitle(model.name);
  return model;
};

module.exports = { buildHubModel, figureKey };
