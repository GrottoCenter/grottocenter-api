const should = require('should');
const { BOT_FOUNDATION_MIGRATION } = require('../../customSQL');

describe('bot surface foundation tables', () => {
  const query = (sql, params) => CommonService.query(sql, params);

  afterEach(async () => {
    await query('DELETE FROM t_bot_admission WHERE entity_id >= 900000000');
    await query('DELETE FROM t_bot_text_scan WHERE source_id >= 900000000');
    await query(
      'UPDATE t_bot_config SET min_age_days = 30, min_text_chars = 500, min_depth_m = 300, min_length_m = 3000, max_boilerplate_caves = 3'
    );
  });

  describe('t_bot_config', () => {
    it('holds one row with the stage 1 content rule', async () => {
      const { rows } = await query('SELECT * FROM t_bot_config');
      should(rows).have.length(1);
      should(rows[0]).containEql({
        id: 1,
        min_age_days: 30,
        min_text_chars: 500,
        min_depth_m: 300,
        min_length_m: 3000,
        max_boilerplate_caves: 3,
      });
    });

    it('refuses a second row', async () => {
      await should(
        query('INSERT INTO t_bot_config (id) VALUES (2)')
      ).be.rejectedWith(/t_bot_config_single_row/);
    });

    it('refuses a threshold that is zero or negative', async () => {
      await should(
        query('UPDATE t_bot_config SET min_text_chars = 0')
      ).be.rejectedWith(/t_bot_config_positive/);
      await should(
        query('UPDATE t_bot_config SET min_depth_m = -1')
      ).be.rejectedWith(/t_bot_config_positive/);
    });

    it('lets an operator change the stage by updating the row', async () => {
      await query('UPDATE t_bot_config SET min_text_chars = 300');
      const { rows } = await query('SELECT min_text_chars FROM t_bot_config');
      should(rows[0].min_text_chars).equal(300);
    });
  });

  describe('t_bot_admission', () => {
    it('stamps the admission time and refuses a second row for the same record', async () => {
      await query(
        "INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ('cave', 900000001)"
      );
      const { rows } = await query(
        'SELECT bot_admitted_at FROM t_bot_admission WHERE entity_id = 900000001'
      );
      should(rows[0].bot_admitted_at).be.an.instanceOf(Date);

      await should(
        query(
          "INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ('cave', 900000001)"
        )
      ).be.rejectedWith(/duplicate key/);
    });

    it('accepts the same id for two entity types', async () => {
      await query(
        "INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ('cave', 900000002), ('entrance', 900000002)"
      );
      const { rows } = await query(
        'SELECT count(*)::int AS n FROM t_bot_admission WHERE entity_id = 900000002'
      );
      should(rows[0].n).equal(2);
    });

    it('refuses an unknown entity type', async () => {
      await should(
        query(
          "INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ('caver', 900000003)"
        )
      ).be.rejectedWith(/t_bot_admission_entity_type_check/);
    });
  });

  describe('t_bot_text_scan', () => {
    const insert = (cols) =>
      query(
        `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched, pattern_id, match_excerpt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        cols
      );

    it('stores a clean verdict and a match with its family and excerpt', async () => {
      await insert(['t_description', 900000001, 'abc', 1, false, null, null]);
      await insert([
        't_description',
        900000002,
        'def',
        1,
        true,
        'dms',
        "46°06'",
      ]);
      const { rows } = await query(
        'SELECT source_id, matched, pattern_id FROM t_bot_text_scan WHERE source_id >= 900000000 ORDER BY source_id'
      );
      should(rows).deepEqual([
        { source_id: 900000001, matched: false, pattern_id: null },
        { source_id: 900000002, matched: true, pattern_id: 'dms' },
      ]);
    });

    it('refuses a second verdict for the same text', async () => {
      await insert(['t_description', 900000001, 'abc', 1, false, null, null]);
      await should(
        insert(['t_description', 900000001, 'abc', 2, false, null, null])
      ).be.rejectedWith(/duplicate key/);
    });

    it('accepts a name verdict', async () => {
      await insert(['t_name', 900000005, 'abc', 1, false, null, null]);
      const { rows } = await query(
        'SELECT source_table FROM t_bot_text_scan WHERE source_id = 900000005'
      );
      should(rows[0].source_table).equal('t_name');
    });

    it('refuses a source table the bot pages never render', async () => {
      for (const table of ['t_location', 't_comment', 't_document']) {
        // eslint-disable-next-line no-await-in-loop
        await should(
          insert([table, 900000001, 'abc', 1, false, null, null])
        ).be.rejectedWith(/t_bot_text_scan_source_table_check/);
      }
    });

    it('refuses a pattern id or excerpt on a clean verdict', async () => {
      await should(
        insert(['t_description', 900000001, 'abc', 1, false, 'dms', null])
      ).be.rejectedWith(/t_bot_text_scan_matched_check/);
      await should(
        insert(['t_description', 900000001, 'abc', 1, false, null, 'x'])
      ).be.rejectedWith(/t_bot_text_scan_matched_check/);
    });
  });

  describe('migration', () => {
    it('can be applied again without losing rows or resetting the configuration', async () => {
      await query(
        "INSERT INTO t_bot_admission (entity_type, entity_id) VALUES ('massif', 900000004)"
      );
      await query('UPDATE t_bot_config SET min_text_chars = 300');

      await query(BOT_FOUNDATION_MIGRATION);

      const admission = await query(
        'SELECT count(*)::int AS n FROM t_bot_admission WHERE entity_id = 900000004'
      );
      should(admission.rows[0].n).equal(1);
      const config = await query('SELECT * FROM t_bot_config');
      should(config.rows).have.length(1);
      should(config.rows[0].min_text_chars).equal(300);
    });
  });
});
