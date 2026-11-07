const should = require('should');
const { WHITELIST } = require('../../../api/utils/botSurfaceWhitelist');
const { cleanRegionName } = require('../../../api/utils/botModelParts');

// A square no other test uses
const POLYGON = 'SRID=4326;POLYGON((165 10, 166 10, 166 11, 165 11, 165 10))';
const INSIDE = { latitude: 10.5, longitude: 165.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };
const VERSION = 5;
const DAY = 24 * 3600;
const FORBIDDEN_KEYS = [
  'latitude',
  'longitude',
  'altitude',
  'precision',
  'pointGeom',
  'point_geom',
  'geogPolygon',
  'geog_polygon',
  'bbox',
  'boundingBox',
  'isSensitive',
  'isSensitiveLocked',
  'cavers',
];
const REGIONS = [
  ['GB-CMN', 'Carmarthenshire [Sir Gaerfyrddin GB-GFY]'],
  ['GB-ABD', 'Aberdeenshire'],
  ['ES-NA', 'Nafarroa*'],
  ['ES-VI', 'Araba*'],
  // Nothing is left of this name once cleaned: no hub
  ['US-ZZ', '[Only an alternative]'],
];

describe('v_bot_hub - the countries index, the countries and the regions', () => {
  const created = {
    cave: [],
    entrance: [],
    massif: [],
    name: [],
    description: [],
  };
  const query = (sql, params) => CommonService.query(sql, params);

  const agedAt = (days) =>
    query('SELECT LOCALTIMESTAMP - make_interval(secs => $1) AS t', [
      days * DAY,
    ]).then(({ rows }) => rows[0].t);

  const setDates = async (table, id, days) => {
    const t = await agedAt(days);
    await query(
      `UPDATE ${table} SET date_inscription = $2, date_reviewed = $2 WHERE id = $1`,
      [id, t]
    );
  };

  const admit = (type, id) =>
    query(
      `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
       VALUES ($1, $2, now() - make_interval(secs => $3)) ON CONFLICT DO NOTHING`,
      [type, id, 60 * DAY]
    );

  const scanName = (id) =>
    query(
      `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
       SELECT 't_name', t.id, md5(COALESCE(t.name, '')), $2, false
       FROM t_name t WHERE t.id = $1`,
      [id, VERSION]
    );

  const scanDescription = (id) =>
    query(
      `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
       SELECT 't_description', t.id,
              md5(COALESCE(t.title, '') || E'\\n' || COALESCE(t.body, '')), $2, false
       FROM t_description t WHERE t.id = $1`,
      [id, VERSION]
    );

  const mkName = async (owner, name, language = 'fra') => {
    const row = await TName.create({
      author: 1,
      name,
      language,
      isMain: true,
      ...owner,
    }).fetch();
    created.name.push(row.id);
    await setDates('t_name', row.id, 100);
    await scanName(row.id);
    return row;
  };

  const mkDescription = async (owner, body) => {
    const row = await TDescription.create({
      author: 1,
      title: 'T',
      body,
      language: 'fra',
      ...owner,
    }).fetch();
    created.description.push(row.id);
    await setDates('t_description', row.id, 60);
    await scanDescription(row.id);
    return row;
  };

  // A published cave: admitted, named, with one published entrance at `place`
  const mkPublishedCave = async ({
    name = 'Gouffre Test',
    language = 'fra',
    country = 'GB',
    region = 'GB-CMN',
    descriptionChars = 0,
    depth = 120,
    caveLength = null,
    place = OUTSIDE,
    entranceOptions = {},
    caveOptions = {},
  } = {}) => {
    const cave = await TCave.create({
      author: 1,
      depth,
      caveLength,
      ...caveOptions,
    }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, 60);
    await mkName({ cave: cave.id }, name, language);
    await admit('cave', cave.id);
    const entrance = await TEntrance.create({
      author: 1,
      cave: cave.id,
      country,
      iso_3166_2: region,
      isSensitive: false,
      isSensitiveLocked: false,
      ...place,
      ...entranceOptions,
    }).fetch();
    created.entrance.push(entrance.id);
    await setDates('t_entrance', entrance.id, 60);
    await admit('entrance', entrance.id);
    if (descriptionChars > 0) {
      await mkDescription({ cave: cave.id }, 'x'.repeat(descriptionChars));
    }
    return { cave, entrance };
  };

  const mkMassif = async ({ name = 'Massif Test', ...rest } = {}) => {
    const massif = await TMassif.create({
      author: 1,
      geogPolygon: POLYGON,
      isSensitive: false,
      ...rest,
    }).fetch();
    created.massif.push(massif.id);
    await setDates('t_massif', massif.id, 60);
    if (name) await mkName({ massif: massif.id }, name);
    await admit('massif', massif.id);
    return massif;
  };

  const hubs = async (type) =>
    (
      await query(
        'SELECT * FROM v_bot_hub WHERE hub_type = $1 ORDER BY hub_key',
        [type]
      )
    ).rows;
  const hub = async (type, key) =>
    (
      await query(
        'SELECT * FROM v_bot_hub WHERE hub_type = $1 AND hub_key = $2',
        [type, key]
      )
    ).rows[0];
  const keysOf = async (type) => (await hubs(type)).map((r) => r.hub_key);
  const caveIds = (row) => row.page.caves.map((c) => c.id);

  // histo_delete() turns the first DELETE of a live row into a soft delete: a
  // second one removes it, so that nothing is left to the suites that follow
  const purge = async (model, ids) => {
    await model.destroy({ id: ids });
    await model.destroy({ id: ids });
  };

  let originalConfig;

  before(async () => {
    originalConfig = (await query('SELECT * FROM t_bot_config')).rows[0];
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
    await Promise.all(
      REGIONS.map(([iso, name]) =>
        query(
          'INSERT INTO t_iso3166_2 (iso, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [iso, name]
        )
      )
    );
  });

  after(async () => {
    await query(
      'UPDATE t_bot_config SET min_age_days = $1, pattern_version = $2',
      [originalConfig.min_age_days, originalConfig.pattern_version]
    );
    await query('DELETE FROM t_iso3166_2 WHERE iso = ANY($1)', [
      REGIONS.map(([iso]) => iso),
    ]);
  });

  afterEach(async () => {
    await query('TRUNCATE t_bot_admission, t_bot_text_scan');
    await query(
      'UPDATE t_bot_config SET min_age_days = 30, pattern_version = $1',
      [VERSION]
    );
    await purge(TDescription, created.description);
    await purge(TName, created.name);
    await purge(TEntrance, created.entrance);
    await purge(TCave, created.cave);
    await purge(TMassif, created.massif);
    Object.values(created).forEach((ids) => ids.splice(0));
  });

  describe('which hubs exist', () => {
    it('has none, and no countries index, when no cave is published', async () => {
      should(await hubs('index')).have.length(0);
      should(await hubs('country')).have.length(0);
      should(await hubs('region')).have.length(0);
    });

    it('has a country hub, a region hub and the index for one published cave', async () => {
      const { cave } = await mkPublishedCave();
      should(await keysOf('country')).deepEqual(['GB']);
      should(await keysOf('region')).deepEqual(['GB-CMN']);
      should(await keysOf('index')).deepEqual(['ALL']);
      should(caveIds(await hub('country', 'GB'))).deepEqual([cave.id]);
      should(caveIds(await hub('region', 'GB-CMN'))).deepEqual([cave.id]);
    });

    it('has no hub for a region whose caves are all unpublished, and no country hub either when it was the only one', async () => {
      // Not admitted
      const { cave } = await mkPublishedCave({ region: 'GB-ABD' });
      await query(
        "DELETE FROM t_bot_admission WHERE entity_type = 'cave' AND entity_id = $1",
        [cave.id]
      );
      should(await hubs('country')).have.length(0);
      should(await hubs('region')).have.length(0);
      should(await hubs('index')).have.length(0);
    });

    it('has no hub for a region whose caves are all sensitive: a cave with only sensitive entrances has no page', async () => {
      await mkPublishedCave({
        region: 'ES-NA',
        country: 'ES',
        entranceOptions: { isSensitive: true },
      });
      await mkPublishedCave({ region: 'GB-CMN', country: 'GB' });
      should(await keysOf('region')).deepEqual(['GB-CMN']);
      should(await keysOf('country')).deepEqual(['GB']);
    });

    it('has no hub for a region of a cave whose name did not pass the scan, a deleted cave or a merged one', async () => {
      const unscanned = await mkPublishedCave({
        region: 'ES-NA',
        country: 'ES',
      });
      await query(
        "DELETE FROM t_bot_text_scan WHERE source_table = 't_name' AND source_id IN (SELECT id FROM t_name WHERE id_cave = $1)",
        [unscanned.cave.id]
      );
      const deleted = await mkPublishedCave({ region: 'ES-VI', country: 'ES' });
      await query('UPDATE t_cave SET is_deleted = true WHERE id = $1', [
        deleted.cave.id,
      ]);
      const merged = await mkPublishedCave({ region: 'GB-ABD', country: 'GB' });
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.cave.id,
        unscanned.cave.id,
      ]);
      should(await hubs('region')).have.length(0);
      should(await hubs('country')).have.length(0);
    });

    it('has a country hub but no region hub for a code that t_iso3166_2 does not hold', async () => {
      const { cave } = await mkPublishedCave({ region: 'GB-NOPE' });
      should(await keysOf('region')).deepEqual([]);
      should(caveIds(await hub('country', 'GB'))).deepEqual([cave.id]);
    });

    it('has no region hub for a name that is nothing once cleaned (the country hub stays)', async () => {
      await mkPublishedCave({ region: 'US-ZZ', country: 'US' });
      should(await keysOf('region')).deepEqual([]);
      should(await keysOf('country')).deepEqual(['US']);
    });

    it('has no hub for a country that t_country does not hold, or an unknown one (00)', async () => {
      await mkPublishedCave({ country: '00', region: null });
      await mkPublishedCave({ country: 'QQ', region: null });
      should(await hubs('country')).have.length(0);
      should(await hubs('index')).have.length(0);
    });

    it('has no region hub for a cave with no region code, which appears under its country only', async () => {
      const { cave } = await mkPublishedCave({ region: null });
      should(await hubs('region')).have.length(0);
      should(caveIds(await hub('country', 'GB'))).deepEqual([cave.id]);
    });

    it('lists in the index exactly the countries that have a published cave', async () => {
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN' });
      await mkPublishedCave({ country: 'ES', region: 'ES-NA' });
      // France only has an unpublished cave
      const hidden = await mkPublishedCave({ country: 'FR', region: 'FR-01' });
      await query(
        "DELETE FROM t_bot_admission WHERE entity_type = 'cave' AND entity_id = $1",
        [hidden.cave.id]
      );
      const [index] = await hubs('index');
      should(index.page.countries).deepEqual([{ code: 'ES' }, { code: 'GB' }]);
      should(await keysOf('country')).deepEqual(['ES', 'GB']);
    });

    it('puts a cave on the hub of every country and region where it has a published entrance', async () => {
      const { cave } = await mkPublishedCave({
        country: 'GB',
        region: 'GB-CMN',
      });
      const other = await TEntrance.create({
        author: 1,
        cave: cave.id,
        country: 'ES',
        iso_3166_2: 'ES-NA',
        isSensitive: false,
        isSensitiveLocked: false,
        ...OUTSIDE,
      }).fetch();
      created.entrance.push(other.id);
      await setDates('t_entrance', other.id, 60);
      await admit('entrance', other.id);
      should(await keysOf('region')).deepEqual(['ES-NA', 'GB-CMN']);
      should(caveIds(await hub('region', 'ES-NA'))).deepEqual([cave.id]);
      should(caveIds(await hub('country', 'ES'))).deepEqual([cave.id]);
      should(caveIds(await hub('country', 'GB'))).deepEqual([cave.id]);
    });
  });

  describe('region names', () => {
    it('are t_iso3166_2.name without the [bracketed alternatives] or the trailing asterisk: GB-CMN and ES-NA', async () => {
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN' });
      await mkPublishedCave({ country: 'ES', region: 'ES-NA' });
      should((await hub('region', 'GB-CMN')).page.name).equal(
        'Carmarthenshire'
      );
      should((await hub('region', 'ES-NA')).page.name).equal('Nafarroa');
    });

    it('are cleaned in SQL as in JavaScript, which the breadcrumb of a cave page uses', async () => {
      const samples = [
        'Carmarthenshire [Sir Gaerfyrddin GB-GFY]',
        'Nafarroa*',
        'Nafarroako Foru Komunitatea*',
        'Ain',
        'Cork [Corcaigh]',
        'A [x] B [y]',
        'Ceredigion [Sir Ceredigion] *',
        'Name with * inside',
        '  Padded  ',
        'Isle of Anglesey [Sir Ynys Môn GB-YNM]',
        '[Only]',
        '*',
      ];
      const { rows } = await query(
        `SELECT s.name,
                NULLIF(btrim(regexp_replace(regexp_replace(s.name, '\\s*\\[[^]]*\\]', '', 'g'), '\\s*\\*+$', '')), '') AS cleaned
         FROM unnest($1::text[]) AS s(name)`,
        [samples]
      );
      rows.forEach(({ name, cleaned }) => {
        should(cleanRegionName(name)).equal(cleaned, name);
      });
      // The expression above is the one of the view: it names the same samples
      // as the view does for a published region
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN' });
      should((await hub('region', 'GB-CMN')).page.name).equal(
        cleanRegionName(REGIONS[0][1])
      );
    });
  });

  describe('the language', () => {
    it('is the most common language of the main names of the published caves', async () => {
      await mkPublishedCave({
        language: 'fra',
        country: 'GB',
        region: 'GB-CMN',
      });
      await mkPublishedCave({
        language: 'fra',
        country: 'GB',
        region: 'GB-CMN',
      });
      await mkPublishedCave({
        language: 'eng',
        country: 'GB',
        region: 'GB-CMN',
      });
      should((await hub('country', 'GB')).language).equal('fra');
      should((await hub('region', 'GB-CMN')).language).equal('fra');
      should((await hub('country', 'GB')).page.language).equal('fra');
    });

    it('is the lowest language code on a tie', async () => {
      await mkPublishedCave({
        language: 'fra',
        country: 'ES',
        region: 'ES-NA',
      });
      await mkPublishedCave({
        language: 'eng',
        country: 'ES',
        region: 'ES-NA',
      });
      await mkPublishedCave({
        language: 'eng',
        country: 'ES',
        region: 'ES-NA',
      });
      await mkPublishedCave({
        language: 'fra',
        country: 'ES',
        region: 'ES-NA',
      });
      should((await hub('country', 'ES')).language).equal('eng');
    });

    it('counts each cave once however many entrances it has', async () => {
      const { cave } = await mkPublishedCave({
        language: 'eng',
        country: 'GB',
        region: 'GB-CMN',
      });
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const extra = await TEntrance.create({
          author: 1,
          cave: cave.id,
          country: 'GB',
          iso_3166_2: 'GB-CMN',
          isSensitive: false,
          isSensitiveLocked: false,
          ...OUTSIDE,
        }).fetch();
        created.entrance.push(extra.id);
        // eslint-disable-next-line no-await-in-loop
        await setDates('t_entrance', extra.id, 60);
        // eslint-disable-next-line no-await-in-loop
        await admit('entrance', extra.id);
      }
      await mkPublishedCave({
        language: 'fra',
        country: 'GB',
        region: 'GB-CMN',
      });
      await mkPublishedCave({
        language: 'fra',
        country: 'GB',
        region: 'GB-CMN',
      });
      should((await hub('country', 'GB')).language).equal('fra');
    });

    it('is a language without a UI translation as such (the renderer falls back to English), and null when no cave has one', async () => {
      await mkPublishedCave({
        language: 'pol',
        country: 'GB',
        region: 'GB-CMN',
      });
      should((await hub('country', 'GB')).language).equal('pol');
      await query(
        "UPDATE t_name SET id_language = NULL WHERE id_language = 'pol'"
      );
      should((await hub('country', 'GB')).language).be.null();
    });

    it('is always English for the index, which is about every country, even when most caves are French', async () => {
      await mkPublishedCave({
        language: 'fra',
        country: 'GB',
        region: 'GB-CMN',
      });
      await mkPublishedCave({
        language: 'fra',
        country: 'ES',
        region: 'ES-NA',
      });
      await mkPublishedCave({
        language: 'eng',
        country: 'ES',
        region: 'ES-NA',
      });
      const [index] = await hubs('index');
      should(index.language).equal('eng');
      should(index.page.language).equal('eng');
      // A country hub still follows its caves
      should((await hub('country', 'GB')).language).equal('fra');
    });
  });

  describe('the language of the rendered hub', () => {
    let BotRenderService;
    let BotHubService;
    before(() => {
      // Sails re-requires api/ when it lifts: require the services here
      /* eslint-disable global-require */
      BotRenderService = require('../../../api/services/bot/BotRenderService');
      BotHubService = require('../../../api/services/bot/BotHubService');
      /* eslint-enable global-require */
    });

    const renderHub = (row) =>
      BotRenderService.renderHub(row, {
        baseUrl: 'https://example.test/ui',
        languageTags: new Map([
          ['fra', 'fr'],
          ['pol', 'pl'],
        ]),
        countryNames: new Map([
          ['FR', 'France'],
          ['ES', 'España'],
        ]),
        hubLinks: BotHubService.createHubLinks(
          {
            countries: new Set(['FR', 'ES']),
            regions: new Set(),
            hasIndex: true,
          },
          'https://example.test/ui'
        ),
        hubFigures: new Map(),
      });

    it('is French for France, whose caves have French names', async () => {
      await mkPublishedCave({
        language: 'fra',
        country: 'FR',
        region: 'FR-01',
      });
      await mkPublishedCave({
        language: 'fra',
        country: 'FR',
        region: 'FR-01',
      });
      await mkPublishedCave({
        language: 'eng',
        country: 'FR',
        region: 'FR-01',
      });
      const html = renderHub(await hub('country', 'FR'));
      should(html).containEql('<html lang="fr">');
      should(html).containEql('<h1>France</h1>');
      // The heading of the list is not the networks' word
      should(html).containEql('<h2>Cavités</h2>');
      should(html).not.containEql('<h2>Réseaux</h2>');
    });

    it('is English for a country whose caves are named in a language the front has no translation for', async () => {
      await mkPublishedCave({
        language: 'pol',
        country: 'ES',
        region: 'ES-NA',
      });
      const html = renderHub(await hub('country', 'ES'));
      // The page is in Polish, its labels in English
      should(html).containEql('<html lang="pl">');
      should(html).containEql('<h2>Caves</h2>');
      should(html).not.containEql('Réseaux');
    });
  });

  describe('the list of caves', () => {
    it('puts the best documented first: description length, then a known depth and length, then the id', async () => {
      const bare = await mkPublishedCave({ depth: null });
      const depthOnly = await mkPublishedCave({ depth: 50 });
      const both = await mkPublishedCave({ depth: 50, caveLength: 900 });
      const short = await mkPublishedCave({
        descriptionChars: 40,
        depth: null,
      });
      const long = await mkPublishedCave({
        descriptionChars: 400,
        depth: null,
      });
      // A depth or a length of 0 means unknown
      const zero = await mkPublishedCave({ depth: 0, caveLength: 0 });
      const row = await hub('region', 'GB-CMN');
      should(caveIds(row)).deepEqual([
        long.cave.id,
        short.cave.id,
        both.cave.id,
        depthOnly.cave.id,
        bare.cave.id,
        zero.cave.id,
      ]);
    });

    it('counts the descriptions of the entrances too, and only those the page shows', async () => {
      const plain = await mkPublishedCave({ descriptionChars: 100 });
      const viaEntrance = await mkPublishedCave();
      await mkDescription(
        { entrance: viaEntrance.entrance.id },
        'y'.repeat(300)
      );
      // Too young to show: not counted
      const young = await mkPublishedCave();
      const description = await mkDescription(
        { cave: young.cave.id },
        'z'.repeat(900)
      );
      await setDates('t_description', description.id, 1);
      const row = await hub('region', 'GB-CMN');
      should(caveIds(row)).deepEqual([
        viaEntrance.cave.id,
        plain.cave.id,
        young.cave.id,
      ]);
    });

    it('carries id, name, depth and length for each cave and nothing else', async () => {
      const { cave } = await mkPublishedCave({
        name: 'Gouffre Berger',
        depth: 1122,
        caveLength: 21000,
      });
      const row = await hub('country', 'GB');
      should(row.page.caves).deepEqual([
        { id: cave.id, name: 'Gouffre Berger', depth: 1122, length: 21000 },
      ]);
    });

    it('is capped at 100, the best documented first, and the caves left out are the poorest', async function cap() {
      this.timeout(60000);
      const bare = [];
      for (let i = 0; i < 101; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        bare.push((await mkPublishedCave({ depth: null })).cave.id);
      }
      // Created last, so the highest id: only its description puts it first
      const documented = await mkPublishedCave({
        descriptionChars: 10,
        depth: null,
      });
      const row = await hub('region', 'GB-CMN');
      should(row.page.caves).have.length(100);
      should(row.page.caves[0].id).equal(documented.cave.id);
      should(caveIds(row).slice(1)).deepEqual(bare.slice(0, 99));
      should(caveIds(row)).not.containEql(bare[100]);
      // The country hub applies the same rule
      should(caveIds(await hub('country', 'GB'))).deepEqual(caveIds(row));
    });

    it('only ever names a cave that has a page in v_bot_page, whatever else exists', async () => {
      const published = await mkPublishedCave();
      // Each of these is unpublished for another reason
      const notAdmitted = await mkPublishedCave();
      await query(
        "DELETE FROM t_bot_admission WHERE entity_type = 'cave' AND entity_id = $1",
        [notAdmitted.cave.id]
      );
      const sensitive = await mkPublishedCave({
        entranceOptions: { isSensitive: true },
      });
      const unscanned = await mkPublishedCave();
      await query(
        "DELETE FROM t_bot_text_scan WHERE source_table = 't_name' AND source_id IN (SELECT id FROM t_name WHERE id_cave = $1)",
        [unscanned.cave.id]
      );
      const rows = [await hub('region', 'GB-CMN'), await hub('country', 'GB')];
      const { rows: pages } = await query(
        "SELECT entity_id FROM v_bot_page WHERE entity_type = 'cave'"
      );
      const pageIds = pages.map((p) => p.entity_id);
      rows.forEach((row) => {
        should(caveIds(row)).deepEqual([published.cave.id]);
        caveIds(row).forEach((id) => should(pageIds).containEql(id));
        [notAdmitted, sensitive, unscanned].forEach(({ cave }) =>
          should(caveIds(row)).not.containEql(cave.id)
        );
      });
    });
  });

  describe('the massifs', () => {
    it('lists a massif on the hub of the region of a published cave that is in it, and a massif that spans two regions on both', async () => {
      const massif = await mkMassif({ name: 'Cambrian' });
      const first = await mkPublishedCave({
        country: 'GB',
        region: 'GB-CMN',
        place: INSIDE,
      });
      const second = await mkPublishedCave({
        country: 'GB',
        region: 'GB-ABD',
        place: INSIDE,
      });
      // The massif has a page too: it is never taken for a cave
      should(caveIds(await hub('country', 'GB'))).deepEqual([
        first.cave.id,
        second.cave.id,
      ]);
      const expected = [{ id: massif.id, name: 'Cambrian' }];
      should((await hub('region', 'GB-CMN')).page.massifs).deepEqual(expected);
      should((await hub('region', 'GB-ABD')).page.massifs).deepEqual(expected);
      should((await hub('country', 'GB')).page.massifs).deepEqual(expected);
    });

    it('does not list a massif that is sensitive, unnamed, unadmitted or has no published cave in it', async () => {
      await mkMassif({ name: 'Sensitive', isSensitive: true });
      await mkMassif({ name: null });
      const notAdmitted = await mkMassif({ name: 'Not admitted' });
      await query(
        "DELETE FROM t_bot_admission WHERE entity_type = 'massif' AND entity_id = $1",
        [notAdmitted.id]
      );
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN', place: INSIDE });
      // A cave outside every massif
      await mkPublishedCave({ country: 'GB', region: 'GB-ABD' });
      should((await hub('region', 'GB-CMN')).page.massifs).deepEqual([]);
      should((await hub('country', 'GB')).page.massifs).deepEqual([]);
    });

    it('lists every published massif of the hub, by id', async () => {
      const first = await mkMassif({ name: 'First' });
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN', place: INSIDE });
      const { massifs } = (await hub('country', 'GB')).page;
      should(massifs).deepEqual([{ id: first.id, name: 'First' }]);
    });

    it('lists only massifs that have a page in v_bot_page', async () => {
      const massif = await mkMassif({ name: 'Linked' });
      await mkMassif({ name: 'Sensitive', isSensitive: true });
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN', place: INSIDE });
      const listed = (await hub('country', 'GB')).page.massifs.map((m) => m.id);
      should(listed).deepEqual([massif.id]);
      const { rows } = await query(
        "SELECT entity_id FROM v_bot_page WHERE entity_type = 'massif' AND entity_id = ANY($1)",
        [listed]
      );
      should(rows.map((r) => r.entity_id)).deepEqual(listed);
    });
  });

  describe('the regions of a country', () => {
    it('are the region hubs of the country, by code, with their cleaned name', async () => {
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN' });
      await mkPublishedCave({ country: 'GB', region: 'GB-ABD' });
      await mkPublishedCave({ country: 'ES', region: 'ES-NA' });
      should((await hub('country', 'GB')).page.regions).deepEqual([
        { code: 'GB-ABD', name: 'Aberdeenshire' },
        { code: 'GB-CMN', name: 'Carmarthenshire' },
      ]);
      should((await hub('country', 'ES')).page.regions).deepEqual([
        { code: 'ES-NA', name: 'Nafarroa' },
      ]);
    });
  });

  describe('what a row carries', () => {
    it('holds exactly the fields of the whitelist, at every level, and no coordinate of any kind', async () => {
      await mkMassif({ name: 'Cambrian' });
      await mkPublishedCave({
        country: 'GB',
        region: 'GB-CMN',
        place: INSIDE,
        descriptionChars: 20,
      });
      const [index] = await hubs('index');
      const country = await hub('country', 'GB');
      const region = await hub('region', 'GB-CMN');

      should(Object.keys(index).sort()).deepEqual([
        'hub_key',
        'hub_type',
        'language',
        'lastmod',
        'page',
      ]);
      should(Object.keys(index.page).sort()).deepEqual(WHITELIST.hubIndex.top);
      should(Object.keys(index.page.countries[0]).sort()).deepEqual(
        WHITELIST.hubCountry.nested
      );
      should(Object.keys(country.page).sort()).deepEqual(
        WHITELIST.hubCountry.top
      );
      should(Object.keys(country.page.regions[0]).sort()).deepEqual(
        WHITELIST.hubRegion.nested
      );
      should(Object.keys(country.page.massifs[0]).sort()).deepEqual(
        WHITELIST.massif.nested
      );
      should(Object.keys(country.page.caves[0]).sort()).deepEqual(
        WHITELIST.cave.nested
      );
      should(Object.keys(region.page).sort()).deepEqual(
        WHITELIST.hubRegion.top
      );

      const text = JSON.stringify([index, country, region]).toLowerCase();
      FORBIDDEN_KEYS.forEach((key) =>
        should(text).not.containEql(`"${key.toLowerCase()}"`)
      );
      // No number that looks like the position of the fixtures, as a whole
      // number with any trailing zeros (a numeric(24, 20) column comes out as
      // 10.50000000000000000000). A lastmod such as "…:10.561Z" holds the
      // digits "10.5" followed by another digit, and is not one
      should(text).not.match(/(?<![\d.])165\.50*(?!\d)/);
      should(text).not.match(/(?<![\d.])10\.50*(?!\d)/);
    });

    it('has the latest lastmod of its caves', async () => {
      const first = await mkPublishedCave();
      const second = await mkPublishedCave();
      const lastmods = (
        await query(
          "SELECT lastmod FROM v_bot_page WHERE entity_type = 'cave' AND entity_id = ANY($1)",
          [[first.cave.id, second.cave.id]]
        )
      ).rows.map((r) => r.lastmod.getTime());
      const row = await hub('country', 'GB');
      should(row.lastmod.getTime()).equal(Math.max(...lastmods));
    });
  });

  describe('reading by keyset', () => {
    it('returns the hubs of one type in the order of the key, after a cursor', async () => {
      await mkPublishedCave({ country: 'GB', region: 'GB-CMN' });
      await mkPublishedCave({ country: 'GB', region: 'GB-ABD' });
      await mkPublishedCave({ country: 'ES', region: 'ES-NA' });
      const read = async (after) =>
        (
          await query(
            `SELECT hub_key FROM v_bot_hub
              WHERE hub_type = 'region' AND hub_key > $1
              ORDER BY hub_key LIMIT 2`,
            [after]
          )
        ).rows.map((r) => r.hub_key);
      should(await read('')).deepEqual(['ES-NA', 'GB-ABD']);
      should(await read('GB-ABD')).deepEqual(['GB-CMN']);
    });
  });
});
