const should = require('should');
const sinon = require('sinon');

const VERSION = 7;
const POSITION = '46°06\'08"N 6°30\'36"E';

describe('BotTextScanService - coordinate scan of the published texts', () => {
  const created = { description: [], name: [] };
  let service;
  let detect;

  const query = (sql, params) => CommonService.query(sql, params);

  const verdictOf = async (table, id) => {
    const { rows } = await query(
      'SELECT * FROM t_bot_text_scan WHERE source_table = $1 AND source_id = $2',
      [table, id]
    );
    return rows[0];
  };

  const mkDescription = async (props) => {
    const description = await TDescription.create({
      author: 1,
      title: 'Title',
      body: 'A short clean text.',
      ...props,
    }).fetch();
    created.description.push(description.id);
    return description;
  };

  const mkName = async (name) => {
    const cave = await TCave.create({ author: 1 }).fetch();
    const row = await TName.create({
      author: 1,
      cave: cave.id,
      name,
      language: 'eng',
      isMain: true,
    }).fetch();
    created.name.push(row.id);
    created.cave = [...(created.cave || []), cave.id];
    return row;
  };

  const run = (options = {}) =>
    service.run({ patternVersion: VERSION, detect, ...options });

  before(() => {
    // Required here, not at the top: Sails re-requires api/ when it lifts
    service = sails.services.bottextscanservice;
    // eslint-disable-next-line global-require
    ({ detect } = require('../../../api/utils/coordinateDetector'));
  });

  afterEach(async () => {
    sinon.restore();
    await query('TRUNCATE t_bot_text_scan');
    await query('UPDATE t_bot_config SET pattern_version = 0');
    await TDescription.destroy({ id: created.description });
    await TName.destroy({ id: created.name });
    await TCave.destroy({ id: created.cave || [] });
    created.description = [];
    created.name = [];
    created.cave = [];
  });

  it('records a clean verdict with the hash the admission function checks', async () => {
    const description = await mkDescription({});

    await run();

    const verdict = await verdictOf('t_description', description.id);
    should(verdict.matched).be.false();
    should(verdict.pattern_id).be.null();
    should(verdict.match_excerpt).be.null();
    should(verdict.pattern_version).equal(VERSION);
    const { rows } = await query(
      "SELECT md5(COALESCE(title, '') || E'\\n' || COALESCE(body, '')) AS h FROM t_description WHERE id = $1",
      [description.id]
    );
    should(verdict.body_hash).equal(rows[0].h);
  });

  it('quarantines a body that holds a position, with the family and the excerpt', async () => {
    const description = await mkDescription({
      body: `Entrance at ${POSITION}.`,
    });

    await run();

    const verdict = await verdictOf('t_description', description.id);
    should(verdict.matched).be.true();
    should(verdict.pattern_id).equal('dms');
    should(verdict.match_excerpt).containEql('46°06');
  });

  it('quarantines a description whose title holds the position', async () => {
    const description = await mkDescription({ title: `Cave ${POSITION}` });

    await run();

    should(
      (await verdictOf('t_description', description.id)).matched
    ).be.true();
  });

  it('scans names too', async () => {
    const clean = await mkName('Gouffre Berger');
    const dirty = await mkName(`Aven ${POSITION}`);

    await run();

    should((await verdictOf('t_name', clean.id)).matched).be.false();
    should((await verdictOf('t_name', dirty.id)).matched).be.true();
  });

  it('skips deleted and empty texts', async () => {
    const deleted = await mkDescription({ isDeleted: true });
    const empty = await mkDescription({ title: '', body: '  ' });

    await run();

    should(await verdictOf('t_description', deleted.id)).be.undefined();
    should(await verdictOf('t_description', empty.id)).be.undefined();
  });

  it('reads the texts in batches and misses none', async () => {
    const rows = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      rows.push(await mkDescription({ body: `Text number ${i}` }));
    }

    await run({ batchSize: 2 });

    for (const row of rows) {
      // eslint-disable-next-line no-await-in-loop
      should(await verdictOf('t_description', row.id)).not.be.undefined();
    }
  });

  describe('incremental runs', () => {
    it('does not scan again a text that has not changed', async () => {
      await mkDescription({});
      await run();
      const spy = sinon.spy(detect);

      const second = await run({ detect: spy });

      should(spy.callCount).equal(0);
      should(second.scanned.t_description).equal(0);
    });

    it('scans again a text that was edited, and only that one', async () => {
      const edited = await mkDescription({ body: 'First version.' });
      await mkDescription({ body: 'Untouched.' });
      await run();
      await TDescription.update({ id: edited.id }).set({
        body: `Second version at ${POSITION}`,
      });
      const spy = sinon.spy(detect);

      await run({ detect: spy });

      should(spy.callCount).equal(1);
      should((await verdictOf('t_description', edited.id)).matched).be.true();
    });

    it('scans every text again when the pattern set version changes', async () => {
      const description = await mkDescription({});
      await run();
      const spy = sinon.spy(detect);

      await run({ detect: spy, patternVersion: VERSION + 1 });

      should(spy.called).be.true();
      should(
        (await verdictOf('t_description', description.id)).pattern_version
      ).equal(VERSION + 1);
    });
  });

  describe('pattern version in the configuration', () => {
    it('moves to the current version once every text has a verdict', async () => {
      await mkDescription({});

      await run();

      const { rows } = await query('SELECT pattern_version FROM t_bot_config');
      should(rows[0].pattern_version).equal(VERSION);
    });

    it('stays where it was when the run fails half way', async () => {
      await mkDescription({});
      await query('UPDATE t_bot_config SET pattern_version = 3');
      const original = CommonService.query;
      sinon
        .stub(sails.services.commonservice, 'query')
        .callsFake((sql, params) => {
          if (String(sql).includes('INSERT INTO t_bot_text_scan')) {
            return Promise.reject(new Error('disk full'));
          }
          return original(sql, params);
        });

      await should(run()).be.rejectedWith(/disk full/);

      sinon.restore();
      const { rows } = await query('SELECT pattern_version FROM t_bot_config');
      should(rows[0].pattern_version).equal(3);
    });
  });

  describe('fail closed', () => {
    it('quarantines a text on which the detector throws, and goes on', async () => {
      const bad = await mkDescription({ body: 'Boom' });
      const good = await mkDescription({ body: 'Fine' });
      const throwing = (text) => {
        if (text.includes('Boom')) throw new Error('detector bug');
        return detect(text);
      };

      const summary = await run({ detect: throwing });

      const verdict = await verdictOf('t_description', bad.id);
      should(verdict.matched).be.true();
      should(verdict.pattern_id).equal('error');
      should(verdict.match_excerpt).be.null();
      should((await verdictOf('t_description', good.id)).matched).be.false();
      should(summary.errors).equal(1);
    });
  });

  describe('summary', () => {
    it('counts what was scanned and quarantined per source', async () => {
      await mkDescription({ body: `At ${POSITION}` });
      await mkDescription({ body: 'Clean' });
      await mkName(`Aven ${POSITION}`);

      const summary = await run();

      should(summary.patternVersion).equal(VERSION);
      should(summary.scanned.t_description).be.aboveOrEqual(2);
      should(summary.quarantined.t_description).be.aboveOrEqual(1);
      should(summary.quarantined.t_name).be.aboveOrEqual(1);
      should(summary.errors).equal(0);
    });
  });

  describe('no writes to the source tables', () => {
    it('leaves the texts, their history and the search outbox untouched', async () => {
      await mkDescription({ body: `At ${POSITION}` });
      await mkName('Gouffre');
      const fingerprint = async () => {
        const { rows } = await query(
          `SELECT
             (SELECT md5(string_agg(t::text, '|' ORDER BY id)) FROM t_description t) AS descriptions,
             (SELECT md5(string_agg(t::text, '|' ORDER BY id)) FROM t_name t) AS names,
             (SELECT count(*) FROM h_description) AS history,
             (SELECT count(*) FROM t_search_outbox) AS outbox,
             (SELECT count(*) FROM t_last_change) AS changes`
        );
        return rows[0];
      };
      const before = await fingerprint();

      await run();

      should(await fingerprint()).deepEqual(before);
    });
  });
});
