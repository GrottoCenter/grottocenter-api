/**
 * BotHubService.js
 *
 * @description :: What the generator (BotPageGeneratorService) needs to publish
 *   the hub pages (#1935) and to link to them: the published hubs, the links,
 *   the SPA's figures. Rendering is BotRenderService.renderHub; this service
 *   only reads.
 *
 * Which hubs are published: the rows of v_bot_hub (sql/9_34), read ONCE per run
 * by loadHubs(), before any page is rendered. The same rows are then
 *   - the keys behind `hubLinks`: a breadcrumb crumb or a list entry links to a
 *     hub exactly when it is in this set, and
 *   - the hubs the run publishes.
 * So a run never links to a hub it does not publish, even if a cave is
 * withdrawn while it goes on (the hub is then published a day late, never
 * dangling), and a cave page's bytes depend only on the set, which a run reads
 * once: they cannot flap inside a run. Between two runs a cave page changes
 * only when a hub it links to appears or disappears.
 *
 * Memory: the hubs are at most about 870 rows (89 countries, 450 regions at
 * stage 1), each with at most 100 caves, a few hundred massifs and a few
 * hundred regions: a few MB, held for the run. Nothing else is held whole.
 *
 * Figures: the SPA's own statistics, through the existing services
 * (StatisticsCountryService, StatisticsRegionService, StatisticsMassifService),
 * so a hub shows the same numbers as the dashboard, records that are not
 * published included. They are read from v_country_info, v_region_info and
 * v_massif_info, refreshed by pg_cron, which is fine for pages generated
 * nightly. The figures are converted exactly as the statistics controllers do
 * (parseInt of the aggregate, null when there is no data).
 */

const botPagePaths = require('../../utils/botPagePaths');
const mapLimit = require('../../utils/mapLimit');
const StatisticsCountryService = require('../StatisticsCountryService');
const StatisticsRegionService = require('../StatisticsRegionService');
const StatisticsMassifService = require('../StatisticsMassifService');

const DEFAULT_BATCH_SIZE = 1000;

const toInt = (value) =>
  value === null || value === undefined ? null : Number.parseInt(value, 10);

// The same conversions as api/controllers/v1/{country,region,massif}/get-statistics.js
const toFigures = ({
  nbMassifs,
  nbCaves,
  nbNetworks,
  nbDiving,
  avg,
  total,
}) => ({
  nbCaves: toInt(nbCaves?.nb_caves),
  nbNetworks: toInt(nbNetworks?.nb_networks),
  nbMassifs: toInt(nbMassifs?.nb_massifs),
  nbDivingCaves: toInt(nbDiving?.nb_diving_cave),
  totalLength: toInt(total?.value),
  avgDepth: toInt(avg?.avg_depth),
  avgLength: toInt(avg?.avg_length),
});

const countryFigures = async (code) => {
  const S = StatisticsCountryService;
  const [nbMassifs, nbCaves, nbNetworks, nbDiving, avg, total] =
    await Promise.all([
      S.getNbMassifsInCountry(code),
      S.getNbCavesInCountry(code),
      S.getNbNetworksInCountry(code),
      S.getNbCavesWhichAreDivingInCountry(code),
      S.getAvgDepthAndLengthInCountry(code),
      S.getTotalLength(code),
    ]);
  return toFigures({ nbMassifs, nbCaves, nbNetworks, nbDiving, avg, total });
};

const regionFigures = async (code) => {
  const S = StatisticsRegionService;
  const [nbMassifs, nbCaves, nbNetworks, nbDiving, avg, total] =
    await Promise.all([
      S.getNbMassifsInRegion(code),
      S.getNbCavesInRegion(code),
      S.getNbNetworksInRegion(code),
      S.getNbCavesWhichAreDivingInRegion(code),
      S.getAvgDepthAndLengthInRegion(code),
      S.getTotalLength(code),
    ]);
  return toFigures({ nbMassifs, nbCaves, nbNetworks, nbDiving, avg, total });
};

// A massif has no count of massifs
const massifFigures = async (id) => {
  const S = StatisticsMassifService;
  const [nbCaves, nbNetworks, nbDiving, avg, total] = await Promise.all([
    S.getNbCavesInMassif(id),
    S.getNbNetworksInMassif(id),
    S.getNbCavesWhichAreDivingInMassif(id),
    S.getAvgDepthAndLengthInMassif(id),
    S.getTotalLength(id),
  ]);
  const { nbMassifs, ...figures } = toFigures({
    nbCaves,
    nbNetworks,
    nbDiving,
    avg,
    total,
  });
  return figures;
};

const readHubBatch = async (hubType, afterKey, limit) => {
  const { rows } = await CommonService.query(
    `SELECT hub_type, hub_key, language, lastmod, page
       FROM v_bot_hub
      WHERE hub_type = $1 AND hub_key > $2
      ORDER BY hub_key
      LIMIT $3`,
    [hubType, afterKey, limit]
  );
  return rows;
};

module.exports = {
  /**
   * Reads every published hub, one type at a time, by keyset on hub_key.
   *
   * @param {object} [options]
   * @param {Function} [options.readBatch] (hubType, afterKey, limit) => rows
   *   of v_bot_hub; replaceable for a synthetic source
   * @param {number} [options.batchSize]
   * @returns {Promise<{rows: object[], countries: Set<string>,
   *   regions: Set<string>, hasIndex: boolean,
   *   regionsOfMassif: Map<number, {code: string, name: string}[]>}>}
   *   `rows` is sorted by type (index, country, region), then key
   */
  async loadHubs({
    readBatch = readHubBatch,
    batchSize = DEFAULT_BATCH_SIZE,
  } = {}) {
    const rows = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const hubType of botPagePaths.HUB_TYPES) {
      let cursor = '';
      for (;;) {
        // eslint-disable-next-line no-await-in-loop
        const batch = await readBatch(hubType, cursor, batchSize);
        rows.push(...batch);
        if (batch.length < batchSize) break;
        cursor = batch[batch.length - 1].hub_key;
      }
    }
    const keysOf = (type) =>
      new Set(rows.filter((r) => r.hub_type === type).map((r) => r.hub_key));
    const regionsOfMassif = new Map();
    rows
      .filter((row) => row.hub_type === 'region')
      .forEach((row) => {
        (row.page.massifs || []).forEach((massif) => {
          if (!regionsOfMassif.has(massif.id)) {
            regionsOfMassif.set(massif.id, []);
          }
          regionsOfMassif
            .get(massif.id)
            .push({ code: row.hub_key, name: row.page.name });
        });
      });
    return {
      rows,
      countries: keysOf('country'),
      regions: keysOf('region'),
      hasIndex: rows.some((row) => row.hub_type === 'index'),
      regionsOfMassif,
    };
  },

  /**
   * The links the pages share (`hubLinks` of BotRenderService.render): each
   * returns the SPA address of a hub that is in `hubs`, else null. A region is
   * linked only with the country its code starts with.
   *
   * @param {{countries: Set<string>, regions: Set<string>, hasIndex: boolean}} hubs
   * @param {string} baseUrl the same base URL the pages are rendered with
   */
  createHubLinks(hubs, baseUrl) {
    return Object.freeze({
      index: () =>
        hubs.hasIndex ? botPagePaths.toHubUrl('index', 'ALL', baseUrl) : null,
      country: (iso) =>
        typeof iso === 'string' && hubs.countries.has(iso)
          ? botPagePaths.toHubUrl('country', iso, baseUrl)
          : null,
      region: (iso, regionCode) =>
        typeof iso === 'string' &&
        typeof regionCode === 'string' &&
        regionCode.startsWith(`${iso}-`) &&
        hubs.regions.has(regionCode)
          ? botPagePaths.toHubUrl('region', regionCode, baseUrl)
          : null,
    });
  },

  /**
   * The SPA's figures of every country and region hub (the index has none; it
   * shows the number of caves of each country).
   *
   * @returns {Promise<Map<string, object>>} keyed `<hub_type>:<hub_key>`
   */
  async loadFigures(hubs, { concurrency = 4 } = {}) {
    const figures = new Map();
    await mapLimit(
      hubs.rows.filter((row) => row.hub_type !== 'index'),
      concurrency,
      async (row) => {
        figures.set(
          `${row.hub_type}:${row.hub_key}`,
          row.hub_type === 'country'
            ? await countryFigures(row.hub_key)
            : await regionFigures(row.hub_key)
        );
      }
    );
    return figures;
  },

  /**
   * What a massif page adds to its row: the SPA's figures for the massif and
   * the regions that have a published hub and list the massif.
   *
   * @param {number[]} ids massif ids
   * @returns {Promise<Map<number, {figures: object, regions: object[]}>>}
   */
  async massifExtras(ids, hubs, { concurrency = 4 } = {}) {
    const extras = new Map();
    await mapLimit(ids, concurrency, async (id) => {
      extras.set(id, {
        figures: await massifFigures(id),
        regions: hubs.regionsOfMassif.get(id) || [],
      });
    });
    return extras;
  },

  // Exposed for the tests: the conversion the services' results go through
  countryFigures,
  regionFigures,
  massifFigures,
};
