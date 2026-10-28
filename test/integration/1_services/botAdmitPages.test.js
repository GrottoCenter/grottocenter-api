const should = require('should');

// A square no other test uses
const POLYGON =
  'SRID=4326;POLYGON((150 -40, 151 -40, 151 -39, 150 -39, 150 -40))';
const INSIDE = { latitude: -39.5, longitude: 150.5 };
const PATTERN_VERSION = 1;
const DAY = 24 * 3600;

describe('bot_admit_pages - admission to the bot surface', () => {
  const created = {
    document: [],
    cave: [],
    entrance: [],
    massif: [],
    grotto: [],
    description: [],
  };
  const query = (sql, params) => CommonService.query(sql, params);
  let counter = 0;

  const agedAt = (ageSeconds) =>
    query('SELECT LOCALTIMESTAMP - make_interval(secs => $1) AS t', [
      ageSeconds,
    ]).then(({ rows }) => rows[0].t);

  const setDates = async (table, id, ageDays) => {
    const t = await agedAt(ageDays * DAY);
    await query(
      `UPDATE ${table} SET date_inscription = $2, date_reviewed = $2 WHERE id = $1`,
      [id, t]
    );
  };

  const run = async () => {
    const { rows } = await query('SELECT * FROM bot_admit_pages()');
    return Object.fromEntries(
      rows.map((r) => [r.entity_type, Number(r.admitted)])
    );
  };

  const isAdmitted = async (type, id) => {
    const { rows } = await query(
      'SELECT 1 FROM t_bot_admission WHERE entity_type = $1 AND entity_id = $2',
      [type, id]
    );
    return rows.length === 1;
  };

  const mkCave = async ({ length = 0, ageDays = 60, ...rest } = {}) => {
    // The model names the length attribute caveLength
    const cave = await TCave.create({
      author: 1,
      depth: 0,
      caveLength: length,
      ...rest,
    }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, ageDays);
    return cave;
  };

  const mkEntrance = async (caveId, props = {}) => {
    const { ageDays = 60, ...rest } = props;
    const entrance = await TEntrance.create({
      author: 1,
      cave: caveId,
      ...INSIDE,
      isSensitive: false,
      isSensitiveLocked: false,
      ...rest,
    }).fetch();
    created.entrance.push(entrance.id);
    await setDates('t_entrance', entrance.id, ageDays);
    return entrance;
  };

  // A cave with one public entrance, both old enough
  const mkPublicCave = async (caveProps = {}, entranceProps = {}) => {
    const cave = await mkCave(caveProps);
    const entrance = await mkEntrance(cave.id, entranceProps);
    return { cave, entrance };
  };

  // body of exactly `length` characters, unique to `key`
  const bodyOf = (key, length) => `${key}-`.padEnd(length, 'x');
  const uniqueKey = () => {
    counter += 1;
    return `t${counter}-${Date.now()}`;
  };

  // scan: 'clean' | 'matched' | 'none' | 'old-version' | 'stale-hash'
  const mkDescription = async ({
    cave,
    entrance,
    body,
    ageDays = 60,
    scan = 'clean',
  }) => {
    const description = await TDescription.create({
      author: 1,
      title: 'Title',
      body,
      ...(cave && { cave }),
      ...(entrance && { entrance }),
    }).fetch();
    created.description.push(description.id);
    await setDates('t_description', description.id, ageDays);
    if (scan !== 'none') {
      await query(
        `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched, pattern_id)
         SELECT 't_description', d.id,
                CASE WHEN $2 = 'stale-hash' THEN 'stale' ELSE md5(COALESCE(d.title, '') || E'\\n' || COALESCE(d.body, '')) END,
                CASE WHEN $2 = 'old-version' THEN $3 - 1 ELSE $3 END,
                $2 = 'matched',
                CASE WHEN $2 = 'matched' THEN 'dms' END
         FROM t_description d WHERE d.id = $1`,
        [description.id, scan, PATTERN_VERSION]
      );
    }
    return description;
  };

  before(async () => {
    await query('UPDATE t_bot_config SET pattern_version = $1', [
      PATTERN_VERSION,
    ]);
  });

  afterEach(async () => {
    await query('TRUNCATE t_bot_admission, t_bot_text_scan');
    await query(
      'UPDATE t_bot_config SET min_age_days = 30, min_text_chars = 500, min_depth_m = 300, min_length_m = 3000, max_boilerplate_caves = 3, pattern_version = $1',
      [PATTERN_VERSION]
    );
    await TDescription.destroy({ id: created.description });
    await TEntrance.destroy({ id: created.entrance });
    await TCave.destroy({ id: created.cave });
    await TMassif.destroy({ id: created.massif });
    await TDocument.destroy({ id: created.document });
    await TGrotto.destroy({ id: created.grotto });
    Object.values(created).forEach((ids) => ids.splice(0));
  });

  describe('entrances', () => {
    it('admits a public entrance that is at least 30 days old and refuses a younger one', async () => {
      const cave = await mkCave();
      const old = await mkEntrance(cave.id, { ageDays: 30.01 });
      const young = await mkEntrance(cave.id, { ageDays: 29.99 });

      await run();

      should(await isAdmitted('entrance', old.id)).be.true();
      should(await isAdmitted('entrance', young.id)).be.false();
    });

    it('refuses a sensitive entrance, and admits a locked non-sensitive one', async () => {
      const cave = await mkCave();
      const sensitive = await mkEntrance(cave.id, { isSensitive: true });
      const locked = await mkEntrance(cave.id, { isSensitiveLocked: true });

      await run();

      should(await isAdmitted('entrance', sensitive.id)).be.false();
      should(await isAdmitted('entrance', locked.id)).be.true();
    });

    it('refuses a deleted entrance and a merged one', async () => {
      const cave = await mkCave();
      const deleted = await mkEntrance(cave.id, { isDeleted: true });
      const target = await mkEntrance(cave.id);
      const merged = await mkEntrance(cave.id, { redirectTo: target.id });

      await run();

      should(await isAdmitted('entrance', deleted.id)).be.false();
      should(await isAdmitted('entrance', merged.id)).be.false();
      should(await isAdmitted('entrance', target.id)).be.true();
    });
  });

  describe('caves: the gates', () => {
    it('refuses a cave whose only entrance is sensitive', async () => {
      const { cave } = await mkPublicCave(
        { depth: 500 },
        { isSensitive: true }
      );

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('refuses a cave whose public entrance is younger than 30 days', async () => {
      const { cave } = await mkPublicCave({ depth: 500 }, { ageDays: 10 });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('admits a cave the same night as its entrance', async () => {
      const { cave, entrance } = await mkPublicCave({ depth: 500 });

      await run();

      should(await isAdmitted('entrance', entrance.id)).be.true();
      should(await isAdmitted('cave', cave.id)).be.true();
    });

    it('refuses a cave younger than 30 days, deleted, or merged', async () => {
      const young = await mkPublicCave({ depth: 500, ageDays: 10 });
      const deleted = await mkPublicCave({ depth: 500, isDeleted: true });
      const target = await mkPublicCave({ depth: 500 });
      const merged = await mkPublicCave({
        depth: 500,
        redirectTo: target.cave.id,
      });

      await run();

      should(await isAdmitted('cave', young.cave.id)).be.false();
      should(await isAdmitted('cave', deleted.cave.id)).be.false();
      should(await isAdmitted('cave', merged.cave.id)).be.false();
      should(await isAdmitted('cave', target.cave.id)).be.true();
    });

    it('refuses a cave with no content at all', async () => {
      const { cave } = await mkPublicCave();

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });
  });

  describe('caves: the content rule', () => {
    it('admits at 500 unique characters and refuses 499', async () => {
      const enough = await mkPublicCave();
      const short = await mkPublicCave();
      await mkDescription({
        cave: enough.cave.id,
        body: bodyOf(uniqueKey(), 500),
      });
      await mkDescription({
        cave: short.cave.id,
        body: bodyOf(uniqueKey(), 499),
      });

      await run();

      should(await isAdmitted('cave', enough.cave.id)).be.true();
      should(await isAdmitted('cave', short.cave.id)).be.false();
    });

    it('adds up the distinct texts of a cave', async () => {
      const { cave } = await mkPublicCave();
      await mkDescription({ cave: cave.id, body: bodyOf(uniqueKey(), 300) });
      await mkDescription({ cave: cave.id, body: bodyOf(uniqueKey(), 200) });

      await run();

      should(await isAdmitted('cave', cave.id)).be.true();
    });

    it('counts the same text only once on a cave', async () => {
      const { cave } = await mkPublicCave();
      const body = bodyOf(uniqueKey(), 300);
      await mkDescription({ cave: cave.id, body });
      await mkDescription({ cave: cave.id, body });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('counts text that exists only on a public entrance', async () => {
      const { cave, entrance } = await mkPublicCave();
      await mkDescription({
        entrance: entrance.id,
        body: bodyOf(uniqueKey(), 500),
      });

      await run();

      should(await isAdmitted('cave', cave.id)).be.true();
    });

    it('does not count the text of a sensitive entrance', async () => {
      const { cave } = await mkPublicCave();
      const sensitive = await mkEntrance(cave.id, { isSensitive: true });
      await mkDescription({
        entrance: sensitive.id,
        body: bodyOf(uniqueKey(), 600),
      });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('does not count the text of an entrance that was admitted and then made sensitive', async () => {
      const { cave } = await mkPublicCave();
      const later = await mkEntrance(cave.id);
      const description = await mkDescription({
        entrance: later.id,
        body: bodyOf(uniqueKey(), 600),
        scan: 'none',
      });
      await run(); // entrances admitted, the unscanned text counts for nothing yet
      await query(
        `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
         SELECT 't_description', id, md5(COALESCE(title, '') || E'\\n' || COALESCE(body, '')), $2, false
         FROM t_description WHERE id = $1`,
        [description.id, PATTERN_VERSION]
      );
      await TEntrance.update({ id: later.id }).set({ isSensitive: true });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('treats a text repeated on 3 caves as unique and on 4 caves as boilerplate', async () => {
      const body = bodyOf(uniqueKey(), 600);
      const three = [];
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        three.push(await mkPublicCave());
      }
      await Promise.all(
        three.map(({ cave }) => mkDescription({ cave: cave.id, body }))
      );

      await run();
      for (const { cave } of three) {
        // eslint-disable-next-line no-await-in-loop
        should(await isAdmitted('cave', cave.id)).be.true();
      }

      await query('TRUNCATE t_bot_admission');
      const fourth = await mkPublicCave();
      await mkDescription({ cave: fourth.cave.id, body });

      await run();
      for (const { cave } of [...three, fourth]) {
        // eslint-disable-next-line no-await-in-loop
        should(await isAdmitted('cave', cave.id)).be.false();
      }
    });

    it('admits at depth 300 and refuses 299, with no text', async () => {
      const deep = await mkPublicCave({ depth: 300 });
      const shallow = await mkPublicCave({ depth: 299 });

      await run();

      should(await isAdmitted('cave', deep.cave.id)).be.true();
      should(await isAdmitted('cave', shallow.cave.id)).be.false();
    });

    it('admits at length 3000 and refuses 2999, with no text', async () => {
      const long = await mkPublicCave({ length: 3000 });
      const short = await mkPublicCave({ length: 2999 });

      await run();

      should(await isAdmitted('cave', long.cave.id)).be.true();
      should(await isAdmitted('cave', short.cave.id)).be.false();
    });

    it('never counts a depth or a length of 0', async () => {
      const { cave } = await mkPublicCave({ depth: 0, length: 0 });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    ['matched', 'none', 'old-version', 'stale-hash'].forEach((scan) => {
      it(`does not count a text whose scan is ${scan}`, async () => {
        const { cave } = await mkPublicCave();
        await mkDescription({
          cave: cave.id,
          body: bodyOf(uniqueKey(), 600),
          scan,
        });

        await run();

        should(await isAdmitted('cave', cave.id)).be.false();
      });
    });

    it('does not count a text that is under 30 days old, and counts it at 30 days', async () => {
      const young = await mkPublicCave();
      const old = await mkPublicCave();
      await mkDescription({
        cave: young.cave.id,
        body: bodyOf(uniqueKey(), 600),
        ageDays: 29.99,
      });
      await mkDescription({
        cave: old.cave.id,
        body: bodyOf(uniqueKey(), 600),
        ageDays: 30.01,
      });

      await run();

      should(await isAdmitted('cave', young.cave.id)).be.false();
      should(await isAdmitted('cave', old.cave.id)).be.true();
    });

    it('does not count a deleted text', async () => {
      const { cave } = await mkPublicCave();
      const description = await mkDescription({
        cave: cave.id,
        body: bodyOf(uniqueKey(), 600),
      });
      await TDescription.update({ id: description.id }).set({
        isDeleted: true,
      });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('counts no text while no complete scan has been recorded (pattern version 0)', async () => {
      await query('UPDATE t_bot_config SET pattern_version = 0');
      const { cave } = await mkPublicCave();
      await mkDescription({ cave: cave.id, body: bodyOf(uniqueKey(), 600) });

      await run();

      should(await isAdmitted('cave', cave.id)).be.false();
    });

    it('follows the thresholds in t_bot_config', async () => {
      await query(
        'UPDATE t_bot_config SET min_text_chars = 300, min_depth_m = 100'
      );
      const text = await mkPublicCave();
      const deep = await mkPublicCave({ depth: 100 });
      await mkDescription({
        cave: text.cave.id,
        body: bodyOf(uniqueKey(), 300),
      });

      await run();

      should(await isAdmitted('cave', text.cave.id)).be.true();
      should(await isAdmitted('cave', deep.cave.id)).be.true();
    });
  });

  describe('configuration', () => {
    it('fails loudly when the configuration row is missing, instead of admitting nothing', async () => {
      // One connection, so the DELETE is rolled back with the failed call
      await should(
        sails.getDatastore().transaction(async (db) => {
          await CommonService.query('DELETE FROM t_bot_config', [], db);
          await CommonService.query('SELECT * FROM bot_admit_pages()', [], db);
        })
      ).be.rejectedWith(/no rows/i);

      const { rows } = await query(
        'SELECT count(*)::int AS n FROM t_bot_config'
      );
      should(rows[0].n).equal(1);
    });
  });

  describe('stickiness', () => {
    it('keeps an admitted cave when its text later shrinks, and does not touch the admission time', async () => {
      const { cave } = await mkPublicCave();
      const description = await mkDescription({
        cave: cave.id,
        body: bodyOf(uniqueKey(), 600),
      });
      await run();
      const before = await query(
        "SELECT bot_admitted_at FROM t_bot_admission WHERE entity_type = 'cave' AND entity_id = $1",
        [cave.id]
      );

      await TDescription.update({ id: description.id }).set({ body: 'short' });
      const second = await run();

      should(await isAdmitted('cave', cave.id)).be.true();
      should(second.cave).equal(0);
      const after = await query(
        "SELECT bot_admitted_at FROM t_bot_admission WHERE entity_type = 'cave' AND entity_id = $1",
        [cave.id]
      );
      should(after.rows[0].bot_admitted_at).deepEqual(
        before.rows[0].bot_admitted_at
      );
    });

    it('admits nothing the second time it runs', async () => {
      await mkPublicCave({ depth: 500 });
      const first = await run();
      const second = await run();

      should(first.cave).be.aboveOrEqual(1);
      should(Object.values(second).every((n) => n === 0)).be.true();
    });

    it('does not delete the admission of a record that is later deleted', async () => {
      const { cave } = await mkPublicCave({ depth: 500 });
      await run();
      await TCave.update({ id: cave.id }).set({ isDeleted: true });

      await run();

      should(await isAdmitted('cave', cave.id)).be.true();
    });
  });

  describe('massifs', () => {
    const mkMassif = async (props = {}) => {
      const { ageDays = 60, ...rest } = props;
      const massif = await TMassif.create({
        author: 1,
        geogPolygon: POLYGON,
        isSensitive: false,
        ...rest,
      }).fetch();
      created.massif.push(massif.id);
      await setDates('t_massif', massif.id, ageDays);
      return massif;
    };

    it('admits a massif that holds an admitted cave', async () => {
      const { cave } = await mkPublicCave({ depth: 500 });
      const massif = await mkMassif();

      const result = await run();

      should(await isAdmitted('cave', cave.id)).be.true();
      should(await isAdmitted('massif', massif.id)).be.true();
      should(result.massif).be.aboveOrEqual(1);
    });

    it('refuses a massif that holds no admitted cave', async () => {
      await mkPublicCave(); // inside the polygon but no content: not admitted
      const massif = await mkMassif();

      await run();

      should(await isAdmitted('massif', massif.id)).be.false();
    });

    it('refuses a massif whose only caves are sensitive', async () => {
      await mkPublicCave({ depth: 500 }, { isSensitive: true });
      const massif = await mkMassif();

      await run();

      should(await isAdmitted('massif', massif.id)).be.false();
    });

    it('refuses a sensitive massif, a young one, and a deleted one', async () => {
      await mkPublicCave({ depth: 500 });
      const sensitive = await mkMassif({ isSensitive: true });
      const young = await mkMassif({ ageDays: 10 });
      const deleted = await mkMassif({ isDeleted: true });

      await run();

      should(await isAdmitted('massif', sensitive.id)).be.false();
      should(await isAdmitted('massif', young.id)).be.false();
      should(await isAdmitted('massif', deleted.id)).be.false();
    });
  });

  describe('organizations', () => {
    const mkGrotto = async (props = {}) => {
      const { ageDays = 60, ...rest } = props;
      const grotto = await TGrotto.create({ author: 1, ...rest }).fetch();
      created.grotto.push(grotto.id);
      await setDates('t_grotto', grotto.id, ageDays);
      return grotto;
    };

    it('admits an organization at least 30 days old and refuses a young, deleted or merged one', async () => {
      const old = await mkGrotto();
      const young = await mkGrotto({ ageDays: 10 });
      const deleted = await mkGrotto({ isDeleted: true });
      const merged = await mkGrotto({ redirectTo: old.id });

      await run();

      should(await isAdmitted('organization', old.id)).be.true();
      should(await isAdmitted('organization', young.id)).be.false();
      should(await isAdmitted('organization', deleted.id)).be.false();
      should(await isAdmitted('organization', merged.id)).be.false();
    });
  });

  it('never admits a document', async () => {
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    created.document.push(doc.id);
    await setDates('t_document', doc.id, 90);

    await run();

    should(await isAdmitted('document', doc.id)).be.false();
  });
});
