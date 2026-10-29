const should = require('should');
const { WHITELIST } = require('../../../api/utils/botSurfaceWhitelist');

// A square no other test uses
const POLYGON =
  'SRID=4326;POLYGON((150 -40, 151 -40, 151 -39, 150 -39, 150 -40))';
const INSIDE = { latitude: -39.5, longitude: 150.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };
const VERSION = 5;
const DAY = 24 * 3600;
const REGION = { iso: 'ZZ-99', name: 'Test Region' };

describe('v_bot_page - the cave pages', () => {
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
      'INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [type, id]
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
    ...rest
  } = {}) => {
    const cave = await TCave.create({ author: 1, depth: 120, ...rest }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, ageDays);
    if (name) await mkName({ cave: cave.id }, name);
    if (admitted) await admit('cave', cave.id);
    return cave;
  };

  const mkEntrance = async (
    caveId,
    { name = 'Entrée Test', admitted = true, ageDays = 60, ...rest } = {}
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
    if (admitted) await admit('entrance', entrance.id);
    return entrance;
  };

  const mkMassif = async ({
    name = 'Massif Test',
    admitted = true,
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
    if (admitted) await admit('massif', massif.id);
    return massif;
  };

  const page = async (caveId) => {
    const { rows } = await query(
      "SELECT * FROM v_bot_page WHERE entity_type = 'cave' AND entity_id = $1",
      [caveId]
    );
    return rows[0];
  };

  before(async () => {
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
    await query(
      'INSERT INTO t_iso3166_2 (iso, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [REGION.iso, REGION.name]
    );
  });

  after(async () => {
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
    Object.values(created).forEach((ids) => ids.splice(0));
  });

  describe('what a page carries', () => {
    it('holds exactly the fields of the whitelist, at every level', async () => {
      const cave = await mkCave({ temperature: 6, isDiving: true });
      const entrance = await mkEntrance(cave.id, {
        ...INSIDE,
        city: 'Autrans',
        county: 'Isère',
        region: 'free text',
        yearDiscovery: 1963,
      });
      await query('UPDATE t_entrance SET iso_3166_2 = $2 WHERE id = $1', [
        entrance.id,
        REGION.iso,
      ]);
      await mkDescription({ cave: cave.id });
      await mkDescription({ entrance: entrance.id });
      await mkMassif();

      const row = await page(cave.id);

      should(Object.keys(row).sort()).deepEqual([
        'entity_id',
        'entity_type',
        'language',
        'lastmod',
        'page',
      ]);
      should(Object.keys(row.page).sort()).deepEqual(WHITELIST.cave.top);
      should(Object.keys(row.page.entrances[0]).sort()).deepEqual(
        WHITELIST.entrance.top
      );
      should(Object.keys(row.page.descriptions[0]).sort()).deepEqual(
        WHITELIST.description.top
      );
      should(
        Object.keys(row.page.entrances[0].descriptions[0]).sort()
      ).deepEqual(WHITELIST.description.top);
      should(Object.keys(row.page.massifs[0]).sort()).deepEqual(
        WHITELIST.massif.nested
      );
    });

    it('shows the region name and code of t_iso3166_2, then the free text when there is no code', async () => {
      const cave = await mkCave();
      const withCode = await mkEntrance(cave.id, { region: 'free text' });
      const without = await mkEntrance(cave.id, { region: 'Free Text Region' });
      await query('UPDATE t_entrance SET iso_3166_2 = $2 WHERE id = $1', [
        withCode.id,
        REGION.iso,
      ]);

      const { entrances } = (await page(cave.id)).page;

      const byId = Object.fromEntries(entrances.map((e) => [e.id, e]));
      should(byId[withCode.id]).containEql({
        region: REGION.name,
        regionCode: REGION.iso,
      });
      should(byId[without.id]).containEql({
        region: 'Free Text Region',
        regionCode: null,
      });
    });

    it('carries the language of the main name and the cave characteristics', async () => {
      const cave = await mkCave({ depth: 321, temperature: 7 });
      await mkEntrance(cave.id);

      const row = await page(cave.id);

      should(row.language).equal('fra');
      should(row.page).containEql({
        id: cave.id,
        name: 'Gouffre Test',
        language: 'fra',
        depth: 321,
        temperature: 7,
      });
    });

    it('holds no coordinate: no such key anywhere and no decimal-degree value', async () => {
      const cave = await mkCave({ latitude: 46.123456, longitude: 6.123456 });
      await mkEntrance(cave.id, {
        latitude: -39.5,
        longitude: 150.5,
        altitude: 1450,
      });
      await mkMassif();

      const { rows } = await query(
        `WITH RECURSIVE walk(k, v) AS (
           SELECT NULL::text, page FROM v_bot_page WHERE entity_id = $1
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
        [cave.id]
      );
      const forbidden = [
        'latitude',
        'longitude',
        'altitude',
        'precision',
        'pointGeom',
        'point_geom',
        'geogPolygon',
        'isSensitive',
        'isSensitiveLocked',
      ];
      rows.forEach(({ k }) => should(forbidden).not.containEql(k));
      const text = JSON.stringify((await page(cave.id)).page);
      should(text).not.match(/-?\d{1,3}\.\d{4,}/);
    });
  });

  describe('which pages exist', () => {
    it('leaves out a cave that is not admitted', async () => {
      const cave = await mkCave({ admitted: false });
      await mkEntrance(cave.id);

      should(await page(cave.id)).be.undefined();
    });

    it('leaves out a cave whose only entrance is sensitive', async () => {
      const cave = await mkCave();
      await mkEntrance(cave.id, { isSensitive: true });

      should(await page(cave.id)).be.undefined();
    });

    it('leaves out a cave whose only entrance is not admitted', async () => {
      const cave = await mkCave();
      await mkEntrance(cave.id, { admitted: false });

      should(await page(cave.id)).be.undefined();
    });

    it('leaves out a cave that was admitted and then deleted or merged', async () => {
      const deleted = await mkCave();
      await mkEntrance(deleted.id);
      await TCave.update({ id: deleted.id }).set({ isDeleted: true });
      const target = await mkCave();
      await mkEntrance(target.id);
      const merged = await mkCave();
      await mkEntrance(merged.id);
      await TCave.update({ id: merged.id }).set({ redirectTo: target.id });

      should(await page(deleted.id)).be.undefined();
      should(await page(merged.id)).be.undefined();
      should(await page(target.id)).not.be.undefined();
    });

    it('keeps an admitted cave that was edited yesterday, with an updated lastmod', async () => {
      const cave = await mkCave({ ageDays: 90 });
      await mkEntrance(cave.id, { ageDays: 90 });
      const before = (await page(cave.id)).lastmod;

      await query(
        "UPDATE t_cave SET date_reviewed = LOCALTIMESTAMP - interval '1 day' WHERE id = $1",
        [cave.id]
      );

      const after = await page(cave.id);
      should(after).not.be.undefined();
      should(after.lastmod.getTime()).be.above(before.getTime());
    });

    it('leaves out a cave without a main name that passed the scan, and keeps one named after a scan', async () => {
      const unnamed = await mkCave({ name: null });
      await mkEntrance(unnamed.id);
      const matched = await mkCave({ name: null });
      await mkEntrance(matched.id);
      await mkName({ cave: matched.id }, 'Aven 46°06\'08"N', {
        scan: 'matched',
      });
      const unscanned = await mkCave({ name: null });
      await mkEntrance(unscanned.id);
      await mkName({ cave: unscanned.id }, 'Fresh name', { scan: 'none' });
      const outdated = await mkCave({ name: null });
      await mkEntrance(outdated.id);
      await mkName({ cave: outdated.id }, 'Old scan', { scan: 'old-version' });
      const edited = await mkCave({ name: null });
      await mkEntrance(edited.id);
      await mkName({ cave: edited.id }, 'Edited since', { scan: 'stale-hash' });

      for (const cave of [unnamed, matched, unscanned, outdated, edited]) {
        // eslint-disable-next-line no-await-in-loop
        should(await page(cave.id)).be.undefined();
      }
    });
  });

  describe('which entrances are embedded', () => {
    it('embeds the public entrance of a mixed cave and nothing of the sensitive one', async () => {
      const cave = await mkCave();
      const publicEntrance = await mkEntrance(cave.id, { name: 'Public one' });
      const secret = await mkEntrance(cave.id, {
        name: 'Secret entrance',
        isSensitive: true,
      });
      await mkDescription({
        entrance: secret.id,
        body: 'Where the secret entrance is.',
      });

      const row = await page(cave.id);

      should(row.page.entrances.map((e) => e.id)).deepEqual([
        publicEntrance.id,
      ]);
      const text = JSON.stringify(row.page);
      should(text).not.containEql('Secret entrance');
      should(text).not.containEql('Where the secret entrance is.');
      should(text).not.containEql(`"id": ${secret.id}`);
    });

    it('does not embed an entrance that is not admitted yet', async () => {
      const cave = await mkCave();
      const old = await mkEntrance(cave.id);
      const young = await mkEntrance(cave.id, { admitted: false, ageDays: 1 });

      const { entrances } = (await page(cave.id)).page;

      should(entrances.map((e) => e.id)).deepEqual([old.id]);
      should(entrances.map((e) => e.id)).not.containEql(young.id);
    });

    it('embeds a locked, non-sensitive entrance that lies inside a sensitive massif', async () => {
      await mkMassif({ isSensitive: true });
      const cave = await mkCave();
      const locked = await mkEntrance(cave.id, {
        ...INSIDE,
        isSensitiveLocked: true,
      });

      const row = await page(cave.id);

      should(row.page.entrances.map((e) => e.id)).deepEqual([locked.id]);
    });

    it('leaves out a deleted or merged entrance', async () => {
      const cave = await mkCave();
      const live = await mkEntrance(cave.id);
      const deleted = await mkEntrance(cave.id, { isDeleted: true });
      const merged = await mkEntrance(cave.id, { redirectTo: live.id });

      const { entrances } = (await page(cave.id)).page;

      should(entrances.map((e) => e.id)).deepEqual([live.id]);
      should(entrances.map((e) => e.id)).not.containEql(deleted.id);
      should(entrances.map((e) => e.id)).not.containEql(merged.id);
    });

    it('shows an entrance without a name that passed the scan with a null name', async () => {
      const cave = await mkCave();
      const unscanned = await mkEntrance(cave.id, { name: null });
      await mkName({ entrance: unscanned.id }, 'Fresh', { scan: 'none' });

      const { entrances } = (await page(cave.id)).page;

      should(entrances).have.length(1);
      should(entrances[0].name).be.null();
    });
  });

  describe('which descriptions are shown', () => {
    const shown = async (cave) =>
      (await page(cave.id)).page.descriptions.map((d) => d.body);

    it('shows a description at 30 days and omits one at 29, the page staying', async () => {
      const cave = await mkCave();
      await mkEntrance(cave.id);
      await mkDescription(
        { cave: cave.id },
        { body: 'Old enough', ageDays: 30.01 }
      );
      await mkDescription(
        { cave: cave.id },
        { body: 'Too young', ageDays: 29.99 }
      );

      should(await shown(cave)).deepEqual(['Old enough']);
    });

    ['matched', 'none', 'old-version', 'stale-hash'].forEach((scan) => {
      it(`omits a description whose scan is ${scan}`, async () => {
        const cave = await mkCave();
        await mkEntrance(cave.id);
        await mkDescription({ cave: cave.id }, { body: 'Withheld', scan });
        await mkDescription({ cave: cave.id }, { body: 'Shown' });

        should(await shown(cave)).deepEqual(['Shown']);
      });
    });

    it('omits a deleted description', async () => {
      const cave = await mkCave();
      await mkEntrance(cave.id);
      const description = await mkDescription({ cave: cave.id });
      await TDescription.update({ id: description.id }).set({
        isDeleted: true,
      });

      should(await shown(cave)).deepEqual([]);
    });

    it('applies the same gates to the description of an entrance', async () => {
      const cave = await mkCave();
      const entrance = await mkEntrance(cave.id);
      await mkDescription({ entrance: entrance.id }, { body: 'Shown' });
      await mkDescription(
        { entrance: entrance.id },
        { body: 'Young', ageDays: 5 }
      );
      await mkDescription(
        { entrance: entrance.id },
        { body: 'Quarantined', scan: 'matched' }
      );

      const row = await page(cave.id);

      should(row.page.entrances[0].descriptions.map((d) => d.body)).deepEqual([
        'Shown',
      ]);
    });

    it('shows a text repeated on many caves', async () => {
      const caves = [];
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const cave = await mkCave();
        // eslint-disable-next-line no-await-in-loop
        await mkEntrance(cave.id);
        // eslint-disable-next-line no-await-in-loop
        await mkDescription(
          { cave: cave.id },
          { body: 'Information comes from the WISH project.' }
        );
        caves.push(cave);
      }

      for (const cave of caves) {
        // eslint-disable-next-line no-await-in-loop
        should(await shown(cave)).deepEqual([
          'Information comes from the WISH project.',
        ]);
      }
    });

    it('follows the age in t_bot_config', async () => {
      await query('UPDATE t_bot_config SET min_age_days = 5');
      const cave = await mkCave();
      await mkEntrance(cave.id);
      await mkDescription({ cave: cave.id }, { body: 'Ten days', ageDays: 10 });

      should(await shown(cave)).deepEqual(['Ten days']);
    });
  });

  describe('massifs listed on a page', () => {
    const listed = async (cave) => (await page(cave.id)).page.massifs;

    it('lists an admitted massif that holds an embedded entrance', async () => {
      const massif = await mkMassif({ name: 'Vercors' });
      const cave = await mkCave();
      await mkEntrance(cave.id, INSIDE);

      should(await listed(cave)).deepEqual([
        { id: massif.id, name: 'Vercors' },
      ]);
    });

    it('does not list a massif that is not admitted, sensitive, deleted, unnamed or far away', async () => {
      await mkMassif({ admitted: false });
      await mkMassif({ isSensitive: true });
      await mkMassif({ isDeleted: true });
      await mkMassif({ name: null });
      const far = await mkCave();
      await mkEntrance(far.id, OUTSIDE);
      const cave = await mkCave();
      await mkEntrance(cave.id, INSIDE);

      should(await listed(cave)).deepEqual([]);
      should(await listed(far)).deepEqual([]);
    });

    it('does not list a massif for a sensitive entrance of the cave', async () => {
      await mkMassif();
      const cave = await mkCave();
      await mkEntrance(cave.id, OUTSIDE);
      await mkEntrance(cave.id, { ...INSIDE, isSensitive: true });

      should(await listed(cave)).deepEqual([]);
    });
  });

  describe('lastmod', () => {
    it('is the latest date among the cave, the descriptions shown and the entrances', async () => {
      const cave = await mkCave({ ageDays: 100 });
      const entrance = await mkEntrance(cave.id, { ageDays: 90 });
      const description = await mkDescription(
        { cave: cave.id },
        { ageDays: 40 }
      );
      await mkDescription(
        { cave: cave.id },
        { body: 'Newer but withheld', ageDays: 2 }
      );
      const expected = (
        await query('SELECT date_reviewed FROM t_description WHERE id = $1', [
          description.id,
        ])
      ).rows[0].date_reviewed;

      const row = await page(cave.id);

      should(row.lastmod.getTime()).equal(expected.getTime());
      const same = await query(
        "SELECT (page->>'lastmod')::timestamp = lastmod AS same FROM v_bot_page WHERE entity_id = $1",
        [cave.id]
      );
      should(same.rows[0].same).be.true();
      should(entrance.id).be.a.Number();
    });
  });
});
