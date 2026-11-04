const should = require('should');
const supertest = require('supertest');

const BASE_URL = 'https://example.test/ui';
// A country, a region and a massif id no fixture of the statistics uses
const COUNTRY = 'US';
const REGION = 'US-ZY';
const MASSIF_ID_BASE = 9100000;

describe('BotHubService', () => {
  let BotHubService;
  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the service here
    // eslint-disable-next-line global-require
    BotHubService = require('../../../api/services/bot/BotHubService');
  });

  const hubRow = (hubType, hubKey, page = {}) => ({
    hub_type: hubType,
    hub_key: hubKey,
    language: 'fra',
    lastmod: new Date('2026-01-01T00:00:00Z'),
    page,
  });

  describe('figures', () => {
    const massif = { id: null };
    // v_country_info, v_region_info and v_massif_info are tables in the test
    // database, materialized views in production; the rows are those of the
    // views: one per (cave, massif), with duplicates across massifs, a row with
    // no massif, caves without a length, a network and a diving cave. Some of
    // these caves are not published: the figures are the SPA's.
    const country = (
      idCave,
      name,
      depth,
      length,
      entrances,
      diving,
      idMassif
    ) =>
      query(
        `INSERT INTO v_country_info (id_country, id_massif, id_cave, name_cave, depth_cave, length_cave, nb_entrances, is_diving_cave)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [COUNTRY, idMassif, idCave, name, depth, length, entrances, diving]
      );
    const region = (idCave, name, depth, length, entrances, diving, idMassif) =>
      query(
        `INSERT INTO v_region_info (id_region, id_massif, id_cave, name_cave, depth_cave, length_cave, nb_entrances, is_diving_cave)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [REGION, idMassif, idCave, name, depth, length, entrances, diving]
      );
    const inMassif = (idCave, name, depth, length, entrances, diving) =>
      query(
        `INSERT INTO v_massif_info (id_massif, id_cave, name_cave, depth_cave, length_cave, nb_entrances, is_diving_cave)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [massif.id, idCave, name, depth, length, entrances, diving]
      );

    before(async () => {
      const created = await TMassif.create({
        author: 1,
        geogPolygon:
          'SRID=4326;POLYGON((170 10, 171 10, 171 11, 170 11, 170 10))',
        isSensitive: false,
      }).fetch();
      massif.id = created.id;
      await query(
        'INSERT INTO t_iso3166_2 (iso, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [REGION, 'Statistics Region']
      );
      const m = massif.id;
      // (cave, name, depth, length, entrances, diving, massif)
      await country(MASSIF_ID_BASE + 1, 'A', 100, 1000, 1, false, m);
      await country(MASSIF_ID_BASE + 1, 'A', 100, 1000, 1, false, m + 1);
      await country(MASSIF_ID_BASE + 2, 'B', 300, null, 2, true, null);
      await country(MASSIF_ID_BASE + 3, 'C', null, 2500, 3, false, m);
      await country(MASSIF_ID_BASE + 4, 'D', 51, 777, 1, true, null);
      await region(MASSIF_ID_BASE + 1, 'A', 100, 1000, 1, false, m);
      await region(MASSIF_ID_BASE + 2, 'B', 300, null, 2, true, null);
      await region(MASSIF_ID_BASE + 5, 'E', 7, 33, 1, false, m + 2);
      await inMassif(MASSIF_ID_BASE + 1, 'A', 100, 1000, 1, false);
      await inMassif(MASSIF_ID_BASE + 3, 'C', null, 2500, 3, false);
      await inMassif(MASSIF_ID_BASE + 6, 'F', 40, 10, 2, true);
    });

    after(async () => {
      await query('DELETE FROM v_country_info WHERE id_country = $1', [
        COUNTRY,
      ]);
      await query('DELETE FROM v_region_info WHERE id_region = $1', [REGION]);
      await query('DELETE FROM v_massif_info WHERE id_massif = $1', [
        massif.id,
      ]);
      await query('DELETE FROM t_iso3166_2 WHERE iso = $1', [REGION]);
      await TMassif.destroy({ id: massif.id });
      await TMassif.destroy({ id: massif.id });
    });

    const get = async (url) =>
      (
        await supertest(sails.hooks.http.app)
          .get(url)
          .set('Accept', 'application/json')
          .expect(200)
      ).body;

    // What the SPA's statistics endpoint answers, as figures
    const fromEndpoint = (body) => ({
      nbCaves: body.nb_caves,
      nbNetworks: body.nb_networks,
      nbMassifs: body.nb_massifs,
      nbDivingCaves: body.diving_caves,
      totalLength: body.total_length.value,
      avgDepth: body.avg.avg_depth,
      avgLength: body.avg.avg_length,
    });

    it('of a country equal the statistics the SPA shows for the same data', async () => {
      const spa = fromEndpoint(
        await get(`/api/v1/countries/${COUNTRY}/statistics`)
      );
      const hub = await BotHubService.countryFigures(COUNTRY);
      should(hub).deepEqual(spa);
      // And they are the values the fixture holds, not zeros: the SPA counts
      // the row with no massif as one, and a cave of two massifs once
      should(hub).deepEqual({
        nbCaves: 4,
        nbNetworks: 2,
        nbMassifs: 3,
        nbDivingCaves: 2,
        totalLength: 1000 + 2500 + 777,
        avgDepth: 150,
        avgLength: 1425,
      });
    });

    it('of a region equal the statistics the SPA shows for the same data', async () => {
      const [, suffix] = REGION.split('-');
      const spa = fromEndpoint(
        await get(`/api/v1/countries/${COUNTRY}/regions/${suffix}/statistics`)
      );
      const hub = await BotHubService.regionFigures(REGION);
      should(hub).deepEqual(spa);
      should(hub.nbCaves).equal(3);
    });

    it('of a massif equal the statistics the SPA shows, and have no count of massifs', async () => {
      const body = await get(`/api/v1/massifs/${massif.id}/statistics`);
      const hub = await BotHubService.massifFigures(massif.id);
      const { nbMassifs, ...spa } = fromEndpoint(body);
      should(hub).deepEqual(spa);
      should(hub).not.have.property('nbMassifs');
      should(hub.nbCaves).equal(3);
      should(hub.totalLength).equal(3510);
    });

    it('are null where the statistics have no data, and zero for a count, for a hub absent from the views', async () => {
      const hub = await BotHubService.countryFigures('XX');
      should(hub).deepEqual({
        nbCaves: 0,
        nbNetworks: 0,
        nbMassifs: 0,
        nbDivingCaves: 0,
        totalLength: null,
        avgDepth: null,
        avgLength: null,
      });
    });

    it('are loaded for every country and region of the hubs, under <type>:<key>, and none for the index', async () => {
      const hubs = {
        rows: [
          hubRow('index', 'ALL'),
          hubRow('country', COUNTRY),
          hubRow('region', REGION),
        ],
      };
      const figures = await BotHubService.loadFigures(hubs, { concurrency: 2 });
      should([...figures.keys()].sort()).deepEqual([
        `country:${COUNTRY}`,
        `region:${REGION}`,
      ]);
      should(figures.get(`country:${COUNTRY}`)).deepEqual(
        await BotHubService.countryFigures(COUNTRY)
      );
      should(figures.get(`region:${REGION}`)).deepEqual(
        await BotHubService.regionFigures(REGION)
      );
    });

    it('are handed to a massif with the regions of the hubs that list it', async () => {
      const hubs = {
        regionsOfMassif: new Map([
          [massif.id, [{ code: 'GB-CMN', name: 'Carmarthenshire' }]],
        ]),
      };
      const extras = await BotHubService.massifExtras(
        [massif.id, massif.id + 5],
        hubs,
        { concurrency: 2 }
      );
      should(extras.get(massif.id).figures).deepEqual(
        await BotHubService.massifFigures(massif.id)
      );
      should(extras.get(massif.id).regions).deepEqual([
        { code: 'GB-CMN', name: 'Carmarthenshire' },
      ]);
      // A massif no region lists has none
      should(extras.get(massif.id + 5).regions).deepEqual([]);
    });
  });

  describe('loadHubs', () => {
    const fixtureRows = [
      hubRow('index', 'ALL', { countries: [{ code: 'FR' }, { code: 'GB' }] }),
      hubRow('country', 'FR'),
      hubRow('country', 'GB'),
      hubRow('region', 'FR-01', { massifs: [{ id: 3, name: 'Vercors' }] }),
      hubRow('region', 'FR-ARA', {
        massifs: [
          { id: 3, name: 'Vercors' },
          { id: 4, name: 'Chartreuse' },
        ],
      }),
    ].map((row, i) => ({
      ...row,
      page: { ...row.page, name: `Region ${i}` },
    }));

    // The view's rows read by keyset, like v_bot_hub
    const readBatch =
      (calls = []) =>
      async (hubType, afterKey, limit) => {
        calls.push([hubType, afterKey, limit]);
        return fixtureRows
          .filter((r) => r.hub_type === hubType && r.hub_key > afterKey)
          .sort((a, b) => (a.hub_key < b.hub_key ? -1 : 1))
          .slice(0, limit);
      };

    it('reads every hub of every type once, whatever the batch size', async () => {
      for (const batchSize of [1, 2, 3, 100]) {
        // eslint-disable-next-line no-await-in-loop
        const hubs = await BotHubService.loadHubs({
          readBatch: readBatch(),
          batchSize,
        });
        should(hubs.rows.map((r) => `${r.hub_type}:${r.hub_key}`)).deepEqual([
          'index:ALL',
          'country:FR',
          'country:GB',
          'region:FR-01',
          'region:FR-ARA',
        ]);
        should([...hubs.countries]).deepEqual(['FR', 'GB']);
        should([...hubs.regions]).deepEqual(['FR-01', 'FR-ARA']);
        should(hubs.hasIndex).be.true();
      }
    });

    it('moves the cursor to the last key of the batch, one type at a time', async () => {
      const calls = [];
      await BotHubService.loadHubs({
        readBatch: readBatch(calls),
        batchSize: 1,
      });
      should(calls.filter(([type]) => type === 'region')).deepEqual([
        ['region', '', 1],
        ['region', 'FR-01', 1],
        ['region', 'FR-ARA', 1],
      ]);
      should(calls.map(([type]) => type)).containEql('index');
    });

    it('knows which regions list a massif', async () => {
      const hubs = await BotHubService.loadHubs({ readBatch: readBatch() });
      should(hubs.regionsOfMassif.get(3)).deepEqual([
        { code: 'FR-01', name: 'Region 3' },
        { code: 'FR-ARA', name: 'Region 4' },
      ]);
      should(hubs.regionsOfMassif.get(4)).deepEqual([
        { code: 'FR-ARA', name: 'Region 4' },
      ]);
      should(hubs.regionsOfMassif.has(5)).be.false();
    });

    it('has no index when the view has none, and reads the real view by default', async () => {
      const hubs = await BotHubService.loadHubs();
      should(hubs.rows).deepEqual([]);
      should(hubs.hasIndex).be.false();
    });
  });

  describe('createHubLinks', () => {
    const links = (overrides = {}) =>
      BotHubService.createHubLinks(
        {
          countries: new Set(['FR', 'GB']),
          regions: new Set(['FR-01', 'GB-CMN']),
          hasIndex: true,
          ...overrides,
        },
        BASE_URL
      );

    it('returns the SPA address of a hub that is published, and null for any other', () => {
      const l = links();
      should(l.index()).equal(`${BASE_URL}/countries`);
      should(l.country('FR')).equal(`${BASE_URL}/countries/FR`);
      should(l.country('ES')).be.null();
      should(l.region('FR', 'FR-01')).equal(
        `${BASE_URL}/countries/FR/regions/01`
      );
      should(l.region('GB', 'GB-CMN')).equal(
        `${BASE_URL}/countries/GB/regions/CMN`
      );
      should(l.region('FR', 'FR-02')).be.null();
    });

    it('links a region only with the country its code starts with', () => {
      const l = links();
      should(l.region('GB', 'FR-01')).be.null();
      should(l.region('F', 'FR-01')).be.null();
    });

    it('returns null for a value that is not a code, and for the index when there is none', () => {
      const l = links({ hasIndex: false });
      should(l.index()).be.null();
      should(l.country(undefined)).be.null();
      should(l.country(null)).be.null();
      should(l.region('FR', undefined)).be.null();
      should(l.region(undefined, 'FR-01')).be.null();
    });

    it('is frozen', () => {
      should(Object.isFrozen(links())).be.true();
    });
  });
});
