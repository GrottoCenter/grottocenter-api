const should = require('should');
const { WHITELIST } = require('../../../api/utils/botSurfaceWhitelist');

// A square no other test uses
const POLYGON = 'SRID=4326;POLYGON((160 10, 161 10, 161 11, 160 11, 160 10))';
const INSIDE = { latitude: 10.5, longitude: 160.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };
const VERSION = 5;
const DAY = 24 * 3600;
const REGION = { iso: 'ZY-98', name: 'Other Test Region' };
const FORBIDDEN_KEYS = [
  'latitude',
  'longitude',
  'altitude',
  'precision',
  'pointGeom',
  'point_geom',
  'geogPolygon',
  'geog_polygon',
  'isSensitive',
  'isSensitiveLocked',
  'address',
  'postalCode',
  'mail',
  'customMessage',
  'cavers',
];

describe('v_bot_page - the massif and organization pages, v_bot_redirect', () => {
  const created = {
    cave: [],
    entrance: [],
    massif: [],
    organization: [],
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

  // Admitted `daysAgo` days ago: the admission time feeds lastmod
  const admit = (type, id, daysAgo = 60) =>
    query(
      `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
       VALUES ($1, $2, now() - make_interval(secs => $3)) ON CONFLICT DO NOTHING`,
      [type, id, daysAgo * DAY]
    );

  // scan: 'clean' | 'matched' | 'none' | 'old-version' | 'stale-hash'
  const scanRow = (table, id, scan) => {
    if (scan === 'none') return Promise.resolve();
    const hash =
      table === 't_name'
        ? "md5(COALESCE(t.name, ''))"
        : "md5(COALESCE(t.title, '') || E'\\n' || COALESCE(t.body, ''))";
    return query(
      `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched, pattern_id)
       SELECT $1, t.id,
              CASE WHEN $3 = 'stale-hash' THEN 'stale' ELSE ${hash} END,
              CASE WHEN $3 = 'old-version' THEN $4 - 1 ELSE $4 END,
              $3 = 'matched', CASE WHEN $3 = 'matched' THEN 'dms' END
       FROM ${table} t WHERE t.id = $2`,
      [table, id, scan, VERSION]
    );
  };

  const mkName = async (
    owner,
    name,
    { scan = 'clean', language = 'fra' } = {}
  ) => {
    const row = await TName.create({
      author: 1,
      name,
      language,
      isMain: true,
      ...owner,
    }).fetch();
    created.name.push(row.id);
    await setDates('t_name', row.id, 100);
    await scanRow('t_name', row.id, scan);
    return row;
  };

  const mkDescription = async (
    owner,
    {
      title = 'Title',
      body = 'A clean description.',
      ageDays = 60,
      scan = 'clean',
    } = {}
  ) => {
    const row = await TDescription.create({
      author: 1,
      title,
      body,
      language: 'fra',
      ...owner,
    }).fetch();
    created.description.push(row.id);
    await setDates('t_description', row.id, ageDays);
    await scanRow('t_description', row.id, scan);
    return row;
  };

  const mkCave = async ({
    name = 'Gouffre Test',
    ageDays = 60,
    admitted = true,
    admittedDaysAgo = 60,
    ...rest
  } = {}) => {
    const cave = await TCave.create({ author: 1, depth: 120, ...rest }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, ageDays);
    if (name) await mkName({ cave: cave.id }, name);
    if (admitted) await admit('cave', cave.id, admittedDaysAgo);
    return cave;
  };

  const mkEntrance = async (
    caveId,
    {
      name = 'Entrée Test',
      admitted = true,
      admittedDaysAgo = 60,
      ageDays = 60,
      ...rest
    } = {}
  ) => {
    const entrance = await TEntrance.create({
      author: 1,
      cave: caveId,
      ...OUTSIDE,
      isSensitive: false,
      isSensitiveLocked: false,
      ...rest,
    }).fetch();
    created.entrance.push(entrance.id);
    await setDates('t_entrance', entrance.id, ageDays);
    if (name) await mkName({ entrance: entrance.id }, name);
    if (admitted) await admit('entrance', entrance.id, admittedDaysAgo);
    return entrance;
  };

  // A cave that has a page and holds an entrance inside the massif polygon
  const mkListedCave = async (caveOptions = {}, entranceOptions = {}) => {
    const cave = await mkCave(caveOptions);
    await mkEntrance(cave.id, { name: null, ...INSIDE, ...entranceOptions });
    return cave;
  };

  const mkMassif = async ({
    name = 'Massif Test',
    admitted = true,
    admittedDaysAgo = 60,
    ...rest
  } = {}) => {
    const massif = await TMassif.create({
      author: 1,
      geogPolygon: POLYGON,
      isSensitive: false,
      ...rest,
    }).fetch();
    created.massif.push(massif.id);
    await setDates('t_massif', massif.id, 60);
    if (name) await mkName({ massif: massif.id }, name);
    if (admitted) await admit('massif', massif.id, admittedDaysAgo);
    return massif;
  };

  // A massif with one listed cave, so that it has a page
  const mkPublishedMassif = async (options = {}) => {
    const massif = await mkMassif(options);
    await mkListedCave();
    return massif;
  };

  const mkOrganization = async ({
    name = 'Spéléo Club Test',
    admitted = true,
    admittedDaysAgo = 60,
    ageDays = 60,
    ...rest
  } = {}) => {
    const organization = await TGrotto.create({ author: 1, ...rest }).fetch();
    created.organization.push(organization.id);
    await setDates('t_grotto', organization.id, ageDays);
    if (name) await mkName({ grotto: organization.id }, name);
    if (admitted) await admit('organization', organization.id, admittedDaysAgo);
    return organization;
  };

  const page = async (type, id) => {
    const { rows } = await query(
      'SELECT * FROM v_bot_page WHERE entity_type = $1 AND entity_id = $2',
      [type, id]
    );
    return rows[0];
  };
  const massifPage = (id) => page('massif', id);
  const organizationPage = (id) => page('organization', id);
  const caveIds = async (massif) =>
    (await massifPage(massif.id)).page.caves.map((c) => c.id);

  // Every key of a document, at every depth
  const keysOf = async (type, id) => {
    const { rows } = await query(
      `WITH RECURSIVE walk(k, v) AS (
         SELECT NULL::text, page FROM v_bot_page WHERE entity_type = $1 AND entity_id = $2
         UNION ALL
         SELECT c.k, c.v
         FROM walk w
         CROSS JOIN LATERAL (
           SELECT e.key AS k, e.value AS v
           FROM jsonb_each(CASE WHEN jsonb_typeof(w.v) = 'object' THEN w.v ELSE '{}'::jsonb END) e
           UNION ALL
           SELECT NULL::text, a.value
           FROM jsonb_array_elements(CASE WHEN jsonb_typeof(w.v) = 'array' THEN w.v ELSE '[]'::jsonb END) a
         ) c
       )
       SELECT DISTINCT k FROM walk WHERE k IS NOT NULL`,
      [type, id]
    );
    return rows.map(({ k }) => k);
  };

  const redirectRows = async (...ids) =>
    (
      await query(
        'SELECT * FROM v_bot_redirect WHERE entity_id = ANY($1) ORDER BY entity_type, entity_id',
        [ids]
      )
    ).rows;

  let originalConfig;

  before(async () => {
    originalConfig = (await query('SELECT * FROM t_bot_config')).rows[0];
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
    await query(
      'INSERT INTO t_iso3166_2 (iso, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [REGION.iso, REGION.name]
    );
  });

  after(async () => {
    // Leave the configuration as this suite found it
    await query(
      'UPDATE t_bot_config SET min_age_days = $1, pattern_version = $2',
      [originalConfig.min_age_days, originalConfig.pattern_version]
    );
    await query('DELETE FROM t_iso3166_2 WHERE iso = $1', [REGION.iso]);
  });

  afterEach(async () => {
    await query('TRUNCATE t_bot_admission, t_bot_text_scan');
    await query(
      'UPDATE t_bot_config SET min_age_days = 30, pattern_version = $1',
      [VERSION]
    );
    await TDescription.destroy({ id: created.description });
    await TName.destroy({ id: created.name });
    await TEntrance.destroy({ id: created.entrance });
    await TCave.destroy({ id: created.cave });
    await TMassif.destroy({ id: created.massif });
    await TGrotto.destroy({ id: created.organization });
    Object.values(created).forEach((ids) => ids.splice(0));
  });

  describe('massif pages', () => {
    describe('what a page carries', () => {
      it('holds exactly the fields of the whitelist, at every level', async () => {
        const massif = await mkMassif({ name: 'Vercors' });
        await mkListedCave();
        await mkDescription({ massif: massif.id });

        const row = await massifPage(massif.id);

        should(Object.keys(row).sort()).deepEqual([
          'entity_id',
          'entity_type',
          'language',
          'lastmod',
          'page',
        ]);
        should(Object.keys(row.page).sort()).deepEqual(WHITELIST.massif.top);
        should(Object.keys(row.page.descriptions[0]).sort()).deepEqual(
          WHITELIST.description.top
        );
        should(Object.keys(row.page.caves[0]).sort()).deepEqual(
          WHITELIST.cave.nested
        );
      });

      it('carries the language of the main name, its name and the listed caves', async () => {
        const massif = await mkMassif({ name: 'Vercors' });
        const cave = await mkListedCave({
          name: 'Gouffre Berger',
          depth: 1122,
          caveLength: 21000,
        });
        await query('UPDATE t_name SET id_language = $2 WHERE id_massif = $1', [
          massif.id,
          'eng',
        ]);

        const row = await massifPage(massif.id);

        should(row.entity_type).equal('massif');
        should(row.language).equal('eng');
        should(row.page).containEql({
          id: massif.id,
          name: 'Vercors',
          language: 'eng',
        });
        should(row.page.caves).deepEqual([
          { id: cave.id, name: 'Gouffre Berger', depth: 1122, length: 21000 },
        ]);
        should(row.page.descriptions).deepEqual([]);
      });

      it('holds no coordinate: no such key anywhere and no decimal-degree value', async () => {
        const massif = await mkMassif();
        await mkListedCave({ latitude: 46.123456, longitude: 6.123456 });
        await mkDescription({ massif: massif.id });

        const keys = await keysOf('massif', massif.id);

        FORBIDDEN_KEYS.forEach((k) => should(keys).not.containEql(k));
        const text = JSON.stringify((await massifPage(massif.id)).page);
        const withoutDates = text.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+/g, '');
        should(withoutDates).not.match(/-?\d{1,3}\.\d{4,}/);
      });
    });

    describe('which massifs have a page', () => {
      it('has a page for a massif that passes every gate', async () => {
        const massif = await mkPublishedMassif();

        should(await massifPage(massif.id)).not.be.undefined();
      });

      it('leaves out a massif that is not admitted', async () => {
        const massif = await mkPublishedMassif({ admitted: false });

        should(await massifPage(massif.id)).be.undefined();
      });

      it('leaves out a sensitive massif', async () => {
        const massif = await mkPublishedMassif({ isSensitive: true });

        should(await massifPage(massif.id)).be.undefined();
      });

      it('leaves out a massif that was admitted and then deleted or merged', async () => {
        const deleted = await mkPublishedMassif({ isDeleted: true });
        const target = await mkMassif();
        const merged = await mkMassif({ redirectTo: target.id });

        should(await massifPage(deleted.id)).be.undefined();
        should(await massifPage(merged.id)).be.undefined();
        should(await massifPage(target.id)).not.be.undefined();
      });

      it('leaves out a massif whose main name did not pass the scan', async () => {
        const unnamed = await mkMassif({ name: null });
        const matched = await mkMassif({ name: null });
        await mkName({ massif: matched.id }, 'Massif 46°06\'08"N', {
          scan: 'matched',
        });
        const unscanned = await mkMassif({ name: null });
        await mkName({ massif: unscanned.id }, 'Fresh', { scan: 'none' });
        const outdated = await mkMassif({ name: null });
        await mkName({ massif: outdated.id }, 'Old scan', {
          scan: 'old-version',
        });
        const edited = await mkMassif({ name: null });
        await mkName({ massif: edited.id }, 'Edited since', {
          scan: 'stale-hash',
        });
        await mkListedCave();

        for (const massif of [unnamed, matched, unscanned, outdated, edited]) {
          // eslint-disable-next-line no-await-in-loop
          should(await massifPage(massif.id)).be.undefined();
        }
      });

      it('uses the main name with the lowest id, and never substitutes another', async () => {
        const withheld = await mkMassif({ name: null });
        await mkName({ massif: withheld.id }, 'First, quarantined', {
          scan: 'matched',
        });
        await mkName({ massif: withheld.id }, 'Second, clean');
        const fine = await mkMassif({ name: null });
        await mkName({ massif: fine.id }, 'First, clean');
        await mkName({ massif: fine.id }, 'Second, quarantined', {
          scan: 'matched',
        });
        await mkListedCave();

        should(await massifPage(withheld.id)).be.undefined();
        should((await massifPage(fine.id)).page.name).equal('First, clean');
      });
    });

    describe('the caves listed, and the massif that has none', () => {
      it('leaves out a massif with no cave at all', async () => {
        const massif = await mkMassif();

        should(await massifPage(massif.id)).be.undefined();
      });

      it('leaves out a massif whose only cave sits outside the polygon', async () => {
        const massif = await mkMassif();
        const far = await mkCave();
        await mkEntrance(far.id, OUTSIDE);

        should(await massifPage(massif.id)).be.undefined();
      });

      const withoutAPage = {
        'a cave that is not admitted': () => mkListedCave({ admitted: false }),
        'a cave without a name': () => mkListedCave({ name: null }),
        'a cave whose name is withheld by the scan': async () => {
          const cave = await mkListedCave({ name: null });
          await mkName({ cave: cave.id }, 'Aven 46°06\'08"N', {
            scan: 'matched',
          });
          return cave;
        },
        'a deleted cave': () => mkListedCave({ isDeleted: true }),
        'a merged cave': async () => {
          const target = await mkCave();
          return mkListedCave({ redirectTo: target.id });
        },
      };
      Object.entries(withoutAPage).forEach(([label, make]) => {
        it(`does not list ${label}, and has no page when it is the only one`, async () => {
          const massif = await mkMassif();
          const hidden = await make();
          should(await massifPage(massif.id)).be.undefined();

          const listed = await mkListedCave();

          should(await caveIds(massif)).deepEqual([listed.id]);
          should(await caveIds(massif)).not.containEql(hidden.id);
        });
      });

      const withoutAnEntrance = {
        'only entrance inside is sensitive': (cave) =>
          mkEntrance(cave.id, { ...INSIDE, isSensitive: true }),
        'only entrance inside is not admitted': (cave) =>
          mkEntrance(cave.id, { ...INSIDE, admitted: false }),
        'only entrance inside is deleted': (cave) =>
          mkEntrance(cave.id, { ...INSIDE, isDeleted: true }),
      };
      Object.entries(withoutAnEntrance).forEach(([label, addEntrance]) => {
        it(`does not list a cave whose ${label}, even with a public entrance elsewhere`, async () => {
          const massif = await mkMassif();
          const cave = await mkCave();
          await mkEntrance(cave.id, OUTSIDE);
          await addEntrance(cave);
          should(await page('cave', cave.id)).not.be.undefined();
          should(await massifPage(massif.id)).be.undefined();

          const listed = await mkListedCave();

          should(await caveIds(massif)).deepEqual([listed.id]);
        });
      });

      it('lists a cave once when several of its entrances are inside', async () => {
        const massif = await mkMassif();
        const cave = await mkListedCave();
        await mkEntrance(cave.id, INSIDE);
        await mkEntrance(cave.id, INSIDE);

        should(await caveIds(massif)).deepEqual([cave.id]);
      });

      it('lists a locked, non-sensitive entrance cave', async () => {
        const massif = await mkMassif();
        const cave = await mkListedCave(
          {},
          { isSensitiveLocked: true, isSensitive: false }
        );

        should(await caveIds(massif)).deepEqual([cave.id]);
      });

      it('orders the caves by depth, the deepest first, unknown depth last, then by id', async () => {
        const massif = await mkMassif();
        const a = await mkListedCave({ depth: 100 });
        const unknown = await mkListedCave({ depth: null });
        const deepest = await mkListedCave({ depth: 500 });
        const zero = await mkListedCave({ depth: 0 });
        const b = await mkListedCave({ depth: 100 });

        should(await caveIds(massif)).deepEqual([
          deepest.id,
          a.id,
          b.id,
          zero.id,
          unknown.id,
        ]);
      });

      it('lists at most 100 caves, the deepest ones', async () => {
        const massif = await mkMassif();
        const depths = Array.from({ length: 101 }, (_, i) => i + 1);
        const caves = [];
        for (let i = 0; i < depths.length; i += 10) {
          // eslint-disable-next-line no-await-in-loop
          const chunk = await Promise.all(
            depths
              .slice(i, i + 10)
              .map((depth) => mkListedCave({ depth, name: `Cave ${depth}` }))
          );
          caves.push(...chunk);
        }
        const shallowest = caves.find((c) => c.depth === 1);

        const listed = (await massifPage(massif.id)).page.caves;

        should(listed).have.length(100);
        should(listed[0].depth).equal(101);
        should(listed[99].depth).equal(2);
        should(listed.map((c) => c.id)).not.containEql(shallowest.id);
      });
    });

    describe('which descriptions are shown', () => {
      const shown = async (massif) =>
        (await massifPage(massif.id)).page.descriptions.map((d) => d.body);

      it('shows a description at 30 days and omits one at 29, the page staying', async () => {
        const massif = await mkPublishedMassif();
        await mkDescription(
          { massif: massif.id },
          { body: 'Old enough', ageDays: 30.01 }
        );
        await mkDescription(
          { massif: massif.id },
          { body: 'Too young', ageDays: 29.99 }
        );

        should(await shown(massif)).deepEqual(['Old enough']);
      });

      ['matched', 'none', 'old-version', 'stale-hash'].forEach((scan) => {
        it(`omits a description whose scan is ${scan}, the page staying`, async () => {
          const massif = await mkPublishedMassif();
          await mkDescription(
            { massif: massif.id },
            { body: 'Withheld', scan }
          );
          await mkDescription({ massif: massif.id }, { body: 'Shown' });

          should(await shown(massif)).deepEqual(['Shown']);
        });
      });

      it('omits a deleted description', async () => {
        const massif = await mkPublishedMassif();
        const description = await mkDescription({ massif: massif.id });
        await TDescription.update({ id: description.id }).set({
          isDeleted: true,
        });

        should(await shown(massif)).deepEqual([]);
      });

      it('follows the age in t_bot_config', async () => {
        await query('UPDATE t_bot_config SET min_age_days = 5');
        const massif = await mkPublishedMassif();
        await mkDescription(
          { massif: massif.id },
          { body: 'Ten days', ageDays: 10 }
        );

        should(await shown(massif)).deepEqual(['Ten days']);
      });
    });

    describe('lastmod', () => {
      const daysAgo = (date) => (Date.now() - date.getTime()) / (DAY * 1000);

      it('starts at the admission time when everything else is older', async () => {
        const massif = await mkMassif();
        await mkListedCave({ ageDays: 100 });
        await query(
          "UPDATE t_massif SET date_inscription = now() - interval '100 days', date_reviewed = now() - interval '100 days' WHERE id = $1",
          [massif.id]
        );

        const row = await massifPage(massif.id);

        should(daysAgo(row.lastmod)).be.within(59.9, 60.1);
      });

      it('moves to the moment a description became old enough to show', async () => {
        const massif = await mkPublishedMassif();
        const description = await mkDescription(
          { massif: massif.id },
          { ageDays: 40 }
        );
        await mkDescription(
          { massif: massif.id },
          { body: 'Withheld, newer', ageDays: 2 }
        );
        const expected = (
          await query(
            "SELECT date_reviewed + interval '30 days' AS visible FROM t_description WHERE id = $1",
            [description.id]
          )
        ).rows[0].visible;

        const row = await massifPage(massif.id);

        should(row.lastmod.getTime()).equal(expected.getTime());
      });

      it('moves to the admission time of a listed cave admitted yesterday', async () => {
        const massif = await mkMassif();
        await mkListedCave({ ageDays: 100, admittedDaysAgo: 1 });

        const row = await massifPage(massif.id);

        should(daysAgo(row.lastmod)).be.within(0.99, 1.01);
      });

      it('moves to the admission time of the massif itself when admitted yesterday', async () => {
        const massif = await mkMassif({ admittedDaysAgo: 1 });
        await mkListedCave();
        await query(
          "UPDATE t_massif SET date_inscription = now() - interval '100 days', date_reviewed = now() - interval '100 days' WHERE id = $1",
          [massif.id]
        );

        const row = await massifPage(massif.id);

        should(daysAgo(row.lastmod)).be.within(0.99, 1.01);
      });

      it('moves when the main name is edited', async () => {
        const massif = await mkPublishedMassif();
        await query(
          "UPDATE t_name SET date_reviewed = LOCALTIMESTAMP - interval '1 day' WHERE id_massif = $1",
          [massif.id]
        );

        const row = await massifPage(massif.id);

        should(daysAgo(row.lastmod)).be.within(0.99, 1.01);
      });

      it('is the same in the column and in the document', async () => {
        const massif = await mkPublishedMassif();
        await mkDescription({ massif: massif.id }, { ageDays: 40 });

        const same = await query(
          "SELECT (page->>'lastmod')::timestamp = lastmod AS same FROM v_bot_page WHERE entity_type = 'massif' AND entity_id = $1",
          [massif.id]
        );

        should(same.rows[0].same).be.true();
      });
    });
  });

  describe('organization pages', () => {
    describe('what a page carries', () => {
      it('holds exactly the fields of the whitelist', async () => {
        const organization = await mkOrganization();

        const row = await organizationPage(organization.id);

        should(Object.keys(row).sort()).deepEqual([
          'entity_id',
          'entity_type',
          'language',
          'lastmod',
          'page',
        ]);
        should(row.entity_type).equal('organization');
        should(Object.keys(row.page).sort()).deepEqual(
          WHITELIST.organization.top
        );
      });

      it('carries the name, its language and the public fields', async () => {
        const organization = await mkOrganization({
          name: 'Spéléo Club Grenoble',
          city: 'Grenoble',
          county: 'Isère',
          region: 'free text',
          country: 'FR',
          url: 'https://example.org/club',
          yearBirth: 1950,
        });
        await query('UPDATE t_name SET id_language = $2 WHERE id_grotto = $1', [
          organization.id,
          'eng',
        ]);
        const withCode = await mkOrganization({ region: 'free text' });
        await query('UPDATE t_grotto SET iso_3166_2 = $2 WHERE id = $1', [
          withCode.id,
          REGION.iso,
        ]);
        const withoutCode = await mkOrganization({ region: 'Free Region' });

        const row = await organizationPage(organization.id);

        should(row.language).equal('eng');
        should(row.page).containEql({
          id: organization.id,
          name: 'Spéléo Club Grenoble',
          language: 'eng',
          city: 'Grenoble',
          county: 'Isère',
          region: 'free text',
          country: 'FR',
          url: 'https://example.org/club',
          yearBirth: 1950,
        });
        should((await organizationPage(withCode.id)).page.region).equal(
          REGION.name
        );
        should((await organizationPage(withoutCode.id)).page.region).equal(
          'Free Region'
        );
      });

      it('publishes none of the private fields, whatever the organization holds', async () => {
        const organization = await mkOrganization({
          address: '12 rue du Secret',
          postalCode: '38000',
          mail: 'club@private.example',
          customMessage: 'Message for members only',
          latitude: 45.123456,
          longitude: 5.123456,
        });

        const keys = await keysOf('organization', organization.id);
        const text = JSON.stringify(
          (await organizationPage(organization.id)).page
        );

        FORBIDDEN_KEYS.forEach((k) => should(keys).not.containEql(k));
        [
          '12 rue du Secret',
          '38000',
          'club@private.example',
          'Message for members only',
        ].forEach((secret) => should(text).not.containEql(secret));
        const withoutDates = text.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+/g, '');
        should(withoutDates).not.match(/-?\d{1,3}\.\d{4,}/);
      });
    });

    describe('which organizations have a page', () => {
      it('has a page for an organization that passes every gate, with no other condition', async () => {
        const organization = await mkOrganization();

        should(await organizationPage(organization.id)).not.be.undefined();
      });

      it('leaves out an organization that is not admitted', async () => {
        const organization = await mkOrganization({ admitted: false });

        should(await organizationPage(organization.id)).be.undefined();
      });

      it('leaves out an organization that was admitted and then deleted or merged', async () => {
        const deleted = await mkOrganization({ isDeleted: true });
        const target = await mkOrganization();
        const merged = await mkOrganization({ redirectTo: target.id });

        should(await organizationPage(deleted.id)).be.undefined();
        should(await organizationPage(merged.id)).be.undefined();
        should(await organizationPage(target.id)).not.be.undefined();
      });

      it('leaves out an organization whose main name did not pass the scan', async () => {
        const unnamed = await mkOrganization({ name: null });
        const matched = await mkOrganization({ name: null });
        await mkName({ grotto: matched.id }, 'Club 46°06\'08"N', {
          scan: 'matched',
        });
        const unscanned = await mkOrganization({ name: null });
        await mkName({ grotto: unscanned.id }, 'Fresh', { scan: 'none' });
        const outdated = await mkOrganization({ name: null });
        await mkName({ grotto: outdated.id }, 'Old scan', {
          scan: 'old-version',
        });
        const edited = await mkOrganization({ name: null });
        await mkName({ grotto: edited.id }, 'Edited since', {
          scan: 'stale-hash',
        });

        for (const organization of [
          unnamed,
          matched,
          unscanned,
          outdated,
          edited,
        ]) {
          // eslint-disable-next-line no-await-in-loop
          should(await organizationPage(organization.id)).be.undefined();
        }
      });

      it('uses the main name with the lowest id, and never substitutes another', async () => {
        const withheld = await mkOrganization({ name: null });
        await mkName({ grotto: withheld.id }, 'First, quarantined', {
          scan: 'matched',
        });
        await mkName({ grotto: withheld.id }, 'Second, clean');
        const fine = await mkOrganization({ name: null });
        await mkName({ grotto: fine.id }, 'First, clean');
        await mkName({ grotto: fine.id }, 'Second, quarantined', {
          scan: 'matched',
        });

        should(await organizationPage(withheld.id)).be.undefined();
        should((await organizationPage(fine.id)).page.name).equal(
          'First, clean'
        );
      });
    });

    describe('lastmod', () => {
      const daysAgo = (date) => (Date.now() - date.getTime()) / (DAY * 1000);

      it('starts at the admission time when everything else is older', async () => {
        const organization = await mkOrganization({ ageDays: 100 });

        const row = await organizationPage(organization.id);

        should(daysAgo(row.lastmod)).be.within(59.9, 60.1);
      });

      it('moves to the admission time of an organization admitted yesterday', async () => {
        const organization = await mkOrganization({
          ageDays: 100,
          admittedDaysAgo: 1,
        });

        const row = await organizationPage(organization.id);

        should(daysAgo(row.lastmod)).be.within(0.99, 1.01);
      });

      it('moves when the organization or its main name is edited', async () => {
        const edited = await mkOrganization({ ageDays: 100 });
        await query(
          "UPDATE t_grotto SET date_reviewed = LOCALTIMESTAMP - interval '1 day' WHERE id = $1",
          [edited.id]
        );
        const renamed = await mkOrganization({ ageDays: 100 });
        await query(
          "UPDATE t_name SET date_reviewed = LOCALTIMESTAMP - interval '2 days' WHERE id_grotto = $1",
          [renamed.id]
        );

        should(daysAgo((await organizationPage(edited.id)).lastmod)).be.within(
          0.99,
          1.01
        );
        should(daysAgo((await organizationPage(renamed.id)).lastmod)).be.within(
          1.99,
          2.01
        );
      });

      it('is the same in the column and in the document', async () => {
        const organization = await mkOrganization();

        const same = await query(
          "SELECT (page->>'lastmod')::timestamp = lastmod AS same FROM v_bot_page WHERE entity_type = 'organization' AND entity_id = $1",
          [organization.id]
        );

        should(same.rows[0].same).be.true();
      });
    });
  });

  describe('v_bot_redirect', () => {
    const mkers = {
      cave: async (options = {}) => {
        const cave = await mkCave(options);
        await mkEntrance(cave.id);
        return cave;
      },
      massif: (options = {}) => mkPublishedMassif(options),
      organization: (options = {}) => mkOrganization(options),
    };
    const model = (type) =>
      ({ cave: TCave, massif: TMassif, organization: TGrotto })[type];

    Object.keys(mkers).forEach((type) => {
      describe(`for a ${type}`, () => {
        // The source is deleted and merged, as a merge leaves it
        const merged = (target, options = {}) =>
          mkers[type]({
            isDeleted: true,
            redirectTo: target.id,
            ...options,
          });

        it('resolves a single hop', async () => {
          const target = await mkers[type]();
          const source = await merged(target);

          should(await redirectRows(source.id)).deepEqual([
            { entity_type: type, entity_id: source.id, target_id: target.id },
          ]);
        });

        it('resolves a chain of 3 through merged records to the final target', async () => {
          const target = await mkers[type]();
          const second = await merged(target);
          const first = await merged(second);
          const source = await merged(first);

          const rows = await redirectRows(source.id, first.id, second.id);

          should(rows.map((r) => [r.entity_id, r.target_id])).deepEqual(
            [
              [source.id, target.id],
              [first.id, target.id],
              [second.id, target.id],
            ].sort((x, y) => x[0] - y[0])
          );
        });

        it('gives no row for a cycle or a self-redirect', async () => {
          const a = await mkers[type]({ isDeleted: true });
          const b = await merged(a);
          await model(type).update({ id: a.id }).set({ redirectTo: b.id });
          const alone = await mkers[type]({ isDeleted: true });
          await model(type).update({ id: alone.id }).set({
            redirectTo: alone.id,
          });

          should(await redirectRows(a.id, b.id, alone.id)).deepEqual([]);
        });

        it('gives no row when the final target has no page', async () => {
          const target = await mkers[type]({ admitted: false });
          const source = await merged(target);

          should(await redirectRows(source.id)).deepEqual([]);
        });

        it('gives no row when the source was never admitted', async () => {
          const target = await mkers[type]();
          const source = await merged(target, { admitted: false });

          should(await redirectRows(source.id)).deepEqual([]);
        });

        it('gives no row for a record that is deleted but not merged', async () => {
          const deleted = await mkers[type]({ isDeleted: true });

          should(await redirectRows(deleted.id)).deepEqual([]);
        });

        it('still redirects a source that is merged but not deleted', async () => {
          const target = await mkers[type]();
          const source = await mkers[type]({ redirectTo: target.id });

          should(await redirectRows(source.id)).have.length(1);
        });
      });
    });

    it('does not follow a redirect to a record of another type', async () => {
      // The ids are in different sequences: a massif redirecting to the id of
      // a cave that has a page must not resolve to it
      const cave = await mkers.cave();
      const massif = await mkMassif({ isDeleted: true, redirectTo: cave.id });

      const rows = await query(
        "SELECT * FROM v_bot_redirect WHERE entity_type = 'massif' AND entity_id = $1",
        [massif.id]
      );

      should(rows.rows).deepEqual([]);
    });

    it('follows 10 redirects and gives no row beyond', async () => {
      let previous = await mkers.organization();
      const chain = [];
      for (let i = 0; i < 11; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        previous = await mkOrganization({
          isDeleted: true,
          redirectTo: previous.id,
        });
        chain.push(previous);
      }

      should(await redirectRows(chain[9].id)).have.length(1);
      should(await redirectRows(chain[10].id)).deepEqual([]);
    });

    it('never overlaps v_bot_page: a source with a redirect has no page', async () => {
      const target = await mkers.cave();
      const source = await mkers.cave({
        isDeleted: true,
        redirectTo: target.id,
      });

      should(await page('cave', source.id)).be.undefined();
      should(await redirectRows(source.id)).have.length(1);
    });
  });
}).timeout(60000);
