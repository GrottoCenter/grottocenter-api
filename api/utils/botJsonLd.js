/**
 * JSON-LD of the bot pages, built from the same model as the HTML (see
 * BotPageModelService), never from a database row.
 *
 * `@context` and `@type` come from the mapping models the API already answers
 * with (api/services/mapping/models), so the pages and the API describe a cave
 * in the same terms. Nothing here can emit a position: no `geo`, no
 * `GeoCoordinates`, no latitude or longitude, and no person. The builders name
 * the keys they emit; they never copy an object.
 *
 * Pure: loads without Sails.
 */

const CaveModel = require('../services/mapping/models/CaveModel');
const EntranceModel = require('../services/mapping/models/EntranceModel');
const MassifModel = require('../services/mapping/models/MassifModel');
const OrganizationModel = require('../services/mapping/models/OrganizationModel');

/**
 * Serializes a value for an inline `<script type="application/ld+json">`.
 * Every `<` becomes the escape `\u003c`, which JSON.parse reads back as `<`, so no value
 * can close the element (`</script>`) or open a comment (`<!--`).
 *
 * @param {*} value JSON-serializable
 * @returns {string}
 */
const serializeForScript = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

// Keeps only the keys that hold a value
const defined = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

const describeTexts = (descriptions) =>
  descriptions.map((d) =>
    defined({ title: d.title, body: d.body, language: d.lang })
  );

const forCave = (model) =>
  defined({
    '@context': CaveModel['@context'],
    '@type': CaveModel['@type'],
    '@id': model.url,
    name: model.name,
    depth: model.depth,
    length: model.length,
    descriptions: model.descriptions.length
      ? describeTexts(model.descriptions)
      : null,
    massifs: model.massifs.length
      ? model.massifs.map((massif) =>
          defined({
            '@id': massif.url,
            '@type': MassifModel['@type'],
            name: massif.name,
          })
        )
      : null,
    entrances: model.entrances.length
      ? model.entrances.map((entrance) =>
          defined({
            '@type': EntranceModel['@type'],
            name: entrance.name,
            city: entrance.city,
            county: entrance.county,
            region: entrance.region,
            country: entrance.countryName,
          })
        )
      : null,
  });

const forMassif = (model) =>
  defined({
    '@context': MassifModel['@context'],
    '@type': MassifModel['@type'],
    '@id': model.url,
    name: model.name,
    descriptions: model.descriptions.length
      ? describeTexts(model.descriptions)
      : null,
    caves: model.caves.length
      ? model.caves.map((cave) =>
          defined({
            '@id': cave.url,
            '@type': CaveModel['@type'],
            name: cave.name,
            depth: cave.depth,
            length: cave.length,
          })
        )
      : null,
  });

const forOrganization = (model) =>
  defined({
    '@context': OrganizationModel['@context'],
    '@type': OrganizationModel['@type'],
    '@id': model.url,
    name: model.name,
    city: model.city,
    county: model.county,
    region: model.region,
    country: model.countryName,
    yearBirth: model.yearBirth,
    url: model.website,
  });

// A hub is a page that lists other pages: schema.org's CollectionPage with an
// ItemList of what it links to. It names places by their names only: never a
// position, a bounding box or a polygon.
const hubItems = (model) => {
  const entries = [
    ...model.countries.map((c) => ({ name: c.text, url: c.url })),
    ...model.regions.map((r) => ({ name: r.text, url: r.url })),
    ...model.massifs.map((m) => ({ name: m.text, url: m.url })),
    ...model.caves.map((c) => ({ name: c.name, url: c.url })),
  ];
  return entries.map((entry, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: entry.name,
    url: entry.url,
  }));
};

const forHub = (model) =>
  defined({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': model.url,
    name: model.name,
    inLanguage: model.lang,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: hubItems(model),
    },
  });

const BUILDERS = {
  cave: forCave,
  massif: forMassif,
  organization: forOrganization,
};

/**
 * @param {'cave'|'massif'|'organization'} entityType
 * @param {object} model the page model
 * @returns {object} the JSON-LD document
 */
const buildJsonLd = (entityType, model) => BUILDERS[entityType](model);

/**
 * @param {object} model a hub page model (botHubModel.js)
 * @returns {object} the JSON-LD document
 */
const buildHubJsonLd = (model) => forHub(model);

module.exports = { buildJsonLd, buildHubJsonLd, serializeForScript };
