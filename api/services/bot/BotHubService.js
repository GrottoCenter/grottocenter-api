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

// Every hub in ONE read. The view's MATERIALIZED CTEs build every published
// cave of v_bot_page before any WHERE on hub_type can prune, so a read per
// type (or per keyset batch) would pay that again; the result is bounded (one
// index, the countries and regions with a published cave: about 870 rows) and
// held in memory by the generator anyway.
const readAllHubs = async () => {
  const { rows } = await CommonService.query(
    `SELECT hub_type, hub_key, language, lastmod, page
       FROM v_bot_hub
      ORDER BY CASE hub_type WHEN 'index' THEN 0 WHEN 'country' THEN 1 ELSE 2 END,
               hub_key COLLATE "C"`
  );
  return rows;
};

const compareKeys = (a, b) => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const CAVE_READ_CHUNK = 200;

const HUB_TYPE_ORDER = new Map(
  botPagePaths.HUB_TYPES.map((type, i) => [type, i])
);

module.exports = {
  /**
   * Reads every published hub, in one read of v_bot_hub (see readAllHubs).
   *
   * @param {object} [options]
   * @param {Function} [options.readAll] () => rows of v_bot_hub; replaceable
   *   for a synthetic source
   * @returns {Promise<{rows: object[], countries: Set<string>,
   *   regions: Set<string>, hasIndex: boolean,
   *   regionsOfMassif: Map<number, {code: string, name: string}[]>}>}
   *   `rows` is sorted by type (index, country, region), then key
   */
  async loadHubs({ readAll = readAllHubs } = {}) {
    // Sorted here too, so the order never depends on the source
    const byKey = (a, b) => {
      if (a.hub_key === b.hub_key) return 0;
      return a.hub_key < b.hub_key ? -1 : 1;
    };
    const rows = [...(await readAll())].sort(
      (a, b) =>
        HUB_TYPE_ORDER.get(a.hub_type) - HUB_TYPE_ORDER.get(b.hub_type) ||
        byKey(a, b)
    );
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
   * The keys of the hubs that are ONLINE, read from the manifest rather than
   * from v_bot_hub, which rebuilds every published cave (far too heavy for the
   * withdrawal worker, #1886). Enough for `createHubLinks`: the worker links a
   * page to the hubs the last nightly run published.
   *
   * @returns {Promise<{countries: Set<string>, regions: Set<string>, hasIndex: boolean}>}
   */
  async loadPublishedHubs() {
    const { rows } = await CommonService.query(
      `SELECT hub_type, hub_key FROM t_bot_page_manifest
        WHERE entity_type = 'hub' AND redirect_to IS NULL`
    );
    const keysOf = (type) =>
      new Set(rows.filter((r) => r.hub_type === type).map((r) => r.hub_key));
    return {
      countries: keysOf('country'),
      regions: keysOf('region'),
      hasIndex: rows.some((row) => row.hub_type === 'index'),
    };
  },

  /**
   * What `hubs.regionsOfMassif` holds for the given massifs, without reading
   * v_bot_hub: a region hub lists a massif when a published cave that lists
   * the massif has a published entrance in that region, so this reads the
   * pages (v_bot_page) of the caves that have an admitted public entrance in
   * the massif's polygon and keeps the regions of `hubs.regions`.
   *
   * @param {number[]} massifIds
   * @param {{regions: Set<string>}} hubs from loadPublishedHubs
   * @returns {Promise<Map<number, {code: string, name: string}[]>>} by massif
   *   id, sorted by code like loadHubs does
   */
  async regionsOfMassifs(massifIds, hubs) {
    const result = new Map(massifIds.map((id) => [id, []]));
    if (massifIds.length === 0 || hubs.regions.size === 0) return result;
    const wanted = new Set(massifIds);
    const { rows: pairs } = await CommonService.query(
      `SELECT DISTINCT e.id_cave AS cave_id
         FROM t_massif m
         JOIN t_entrance e ON e.point_geom && m.geog_polygon::geometry
           AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
         JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
        WHERE m.id = ANY($1::int[])
          AND e.is_deleted = false AND e.redirect_to IS NULL AND e.is_sensitive = false`,
      [massifIds]
    );
    const caveIds = pairs.map((p) => p.cave_id);
    const codes = new Map(massifIds.map((id) => [id, new Set()]));
    for (let i = 0; i < caveIds.length; i += CAVE_READ_CHUNK) {
      // eslint-disable-next-line no-await-in-loop
      const { rows } = await CommonService.query(
        `SELECT page FROM v_bot_page
          WHERE entity_type = 'cave' AND entity_id = ANY($1::int[])`,
        [caveIds.slice(i, i + CAVE_READ_CHUNK)]
      );
      rows.forEach(({ page }) => {
        const regionCodes = (page.entrances || [])
          .map((e) => e.regionCode)
          .filter((code) => typeof code === 'string' && hubs.regions.has(code));
        (page.massifs || [])
          .filter((m) => wanted.has(m.id))
          .forEach((m) => regionCodes.forEach((c) => codes.get(m.id).add(c)));
      });
    }
    const all = [...new Set([...codes.values()].flatMap((set) => [...set]))];
    if (all.length === 0) return result;
    // The name of the region hub (v_bot_hub): t_iso3166_2.name, cleaned
    const { rows: names } = await CommonService.query(
      String.raw`SELECT iso.iso AS code,
                    btrim(regexp_replace(regexp_replace(iso.name, '\s*\[[^]]*\]', '', 'g'), '\s*\*+$', '')) AS name
               FROM t_iso3166_2 iso WHERE iso.iso = ANY($1::text[])`,
      [all]
    );
    const nameOf = new Map(names.map((r) => [r.code, r.name]));
    codes.forEach((set, id) => {
      result.set(
        id,
        [...set]
          .sort(compareKeys)
          .map((code) => ({ code, name: nameOf.get(code) }))
      );
    });
    return result;
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
