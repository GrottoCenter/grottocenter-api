const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const sinon = require('sinon');
const { createBotFixtures } = require('../../helpers/botSurfaceFixtures');

const VERSION = 5;
const ALL_TYPES = ['cave', 'massif', 'organization', 'hub'];
const POSITION = '46°06\'08"N 6°30\'36"E';
const LONG_TEXT =
  'Une grande salle suivie de puits successifs, de galeries fossiles ornées de concrétions et de siphons explorés par les plongeurs. '.repeat(
    5
  );

describe('BotPipelineService - runs over real rows with the local adapter', () => {
  let BotPipelineService;
  let BotPageGeneratorService;
  let BotSitemapService;
  let BotRenderService;
  let BotOutboxService;
  let BotOutboxQueueService;
  let botPagePaths;
  let botSitemap;
  let LocalStorageAdapter;
  let fixtures;
  let originalConfig;
  let root;
  let adapter;

  const query = (sql, params) => CommonService.query(sql, params);

  before(async () => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    BotPipelineService = require('../../../api/services/bot/BotPipelineService');
    BotPageGeneratorService = require('../../../api/services/bot/BotPageGeneratorService');
    BotSitemapService = require('../../../api/services/bot/BotSitemapService');
    BotRenderService = require('../../../api/services/bot/BotRenderService');
    BotOutboxService = require('../../../api/services/bot/BotOutboxService');
    BotOutboxQueueService = require('../../../api/services/BotOutboxQueueService');
    botPagePaths = require('../../../api/utils/botPagePaths');
    botSitemap = require('../../../api/utils/botSitemap');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
    fixtures = createBotFixtures({ scanVersion: VERSION });
    originalConfig = (await query('SELECT * FROM t_bot_config')).rows[0];
  });

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-pipeline-e2e-'));
    adapter = new LocalStorageAdapter(root);
    await query('TRUNCATE t_bot_page_manifest, t_bot_outbox');
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
  });

  afterEach(async () => {
    sinon.restore();
    await fixtures.cleanup();
    await query(
      'UPDATE t_bot_config SET min_age_days = $1, pattern_version = $2',
      [originalConfig.min_age_days, originalConfig.pattern_version]
    );
    fs.rmSync(root, { recursive: true, force: true });
  });

  const nightly = (entityTypes = ['cave', 'massif', 'organization']) =>
    BotPipelineService.run({ adapter, entityTypes });

  const keyOf = (type, id) => botPagePaths.toKey(type, id);
  const isOnline = (key) => fs.existsSync(path.join(root, key));
  const manifestRow = async (key) =>
    (await query('SELECT * FROM t_bot_page_manifest WHERE path = $1', [key]))
      .rows[0];
  const manifestCount = async (type) =>
    (
      await query(
        'SELECT count(*)::int AS n FROM t_bot_page_manifest WHERE entity_type = $1',
        [type]
      )
    ).rows[0].n;
  const isAdmitted = async (type, id) =>
    (
      await query(
        'SELECT 1 FROM t_bot_admission WHERE entity_type = $1 AND entity_id = $2',
        [type, id]
      )
    ).rows.length === 1;
  const sitemapIndex = () =>
    fs.readFileSync(path.join(root, botSitemap.INDEX_PATH), 'utf8');

  // A cave with a page, a massif around its entrance and an organization,
  // admitted: what an earlier night would have left
  const mkPublished = async () => {
    const cave = await fixtures.mkCave('Gouffre Pipeline');
    await fixtures.mkEntrance(cave.id, 'Entrance Pipeline', {
      place: fixtures.INSIDE,
    });
    const massif = await fixtures.mkMassif('Massif Pipeline');
    const organization = await fixtures.mkOrganization('Club Pipeline');
    return { cave, massif, organization };
  };

  describe('the order of the steps over real rows', () => {
    it('publishes tonight a record that turns 30 days old tonight, because admission runs before generation', async () => {
      // 30 days and one hour old: eligible at tonight's admission, not admitted yet
      const organization = await fixtures.mkOrganization('Club Birthday', {
        admitted: false,
        ageDays: 30 + 1 / 24,
        scanned: false,
      });
      should(await isAdmitted('organization', organization.id)).be.false();
      should(isOnline(keyOf('organization', organization.id))).be.false();

      const result = await nightly(['organization']);

      should(await isAdmitted('organization', organization.id)).be.true();
      should(isOnline(keyOf('organization', organization.id))).be.true();
      should(await manifestRow(keyOf('organization', organization.id))).be.ok();
      should(result.counts.admission.organization).be.aboveOrEqual(1);
    });

    it('does not publish a record that is a day short of 30 days', async () => {
      const organization = await fixtures.mkOrganization('Club Too Young', {
        admitted: false,
        ageDays: 29,
        scanned: false,
      });

      await nightly(['organization']);

      should(await isAdmitted('organization', organization.id)).be.false();
      should(isOnline(keyOf('organization', organization.id))).be.false();
    });

    it('counts for admission tonight a description written 30 days ago and scanned tonight, because the scan runs before admission', async () => {
      const cave = await fixtures.mkCave('Gouffre Scanned Tonight', {
        admitted: false,
        depth: 0,
        scanned: false,
      });
      await fixtures.mkEntrance(cave.id, 'Entrance Scanned Tonight', {
        admitted: false,
        scanned: false,
      });
      // Old enough, long enough, and without a verdict yet
      await fixtures.mkDescription({ cave: cave.id }, LONG_TEXT, {
        ageDays: 31,
        scanned: false,
      });
      // The same cave with a description that is only 10 days old
      const young = await fixtures.mkCave('Gouffre Young Text', {
        admitted: false,
        depth: 0,
        scanned: false,
      });
      await fixtures.mkEntrance(young.id, 'Entrance Young Text', {
        admitted: false,
        scanned: false,
      });
      await fixtures.mkDescription({ cave: young.id }, LONG_TEXT, {
        ageDays: 10,
        scanned: false,
      });
      should(await isAdmitted('cave', cave.id)).be.false();

      const result = await nightly(['cave']);

      should(await isAdmitted('cave', cave.id)).be.true();
      should(isOnline(keyOf('cave', cave.id))).be.true();
      // Control: the content rule is what decides, not the pipeline
      should(await isAdmitted('cave', young.id)).be.false();
      should(isOnline(keyOf('cave', young.id))).be.false();
      should(result.counts.scan.scanned.t_description).be.aboveOrEqual(2);
    });
  });

  describe('the run record', () => {
    it('holds the figures of the night: per-source scan counts, admissions, pages per type, uploads, sitemaps, durations, memory', async () => {
      const { cave, massif, organization } = await mkPublished();
      // One text per source that holds a position: quarantined
      await fixtures.mkDescription(
        { cave: cave.id },
        `Entrance at ${POSITION}.`,
        {
          scanned: false,
        }
      );
      await fixtures.mkName({ cave: cave.id }, `Gouffre ${POSITION}`, {
        scanned: false,
        ageDays: 50,
      });

      const result = await nightly();

      const { rows } = await query(
        'SELECT * FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1'
      );
      const record = rows[0];
      should(record.id).equal(result.id);
      should(record.status).equal('succeeded');
      should(record.failed_step).be.null();
      const { counts } = record;
      should(counts.scan.scanned.t_description).be.aboveOrEqual(1);
      should(counts.scan.scanned.t_name).be.aboveOrEqual(1);
      should(counts.scan.quarantined.t_description).be.aboveOrEqual(1);
      should(counts.scan.quarantined.t_name).be.aboveOrEqual(1);
      should(counts.scan.errors).equal(0);
      should(counts.invariant).eql({ violations: 0, overrides: 0 });
      should(counts.admission.total).be.a.Number();
      should(counts.generation.uploaded).be.aboveOrEqual(3);
      should(counts.generation.pages.cave).be.aboveOrEqual(1);
      should(counts.generation.pages.massif).be.aboveOrEqual(1);
      should(counts.generation.pages.organization).be.aboveOrEqual(1);
      should(counts.generation.byType.cave.uploaded).be.aboveOrEqual(1);
      should(counts.sitemaps.urls).be.aboveOrEqual(3);
      should(counts.sitemaps.shards).be.aboveOrEqual(3);
      should(counts.audit).containEql({
        failures: 0,
        failuresByReason: {},
        truncated: false,
        publishingStopped: false,
        publishing: true,
        variantChecked: 0,
      });
      // Everything this night uploaded was read back: pages, hubs, redirects
      should(counts.audit.uploadedChecked).be.aboveOrEqual(3);
      should(counts.audit.pagesChecked).equal(counts.audit.uploadedChecked);
      should(counts.peakRssMb).be.above(0);
      should(counts.entityTypes).eql(['cave', 'massif', 'organization']);
      should(Object.keys(record.step_durations).sort()).eql(
        [
          'admission',
          'audit',
          'generation',
          'invariant',
          'scan',
          'sitemaps',
        ].sort()
      );
      // The pages and the sitemaps are really there
      [
        keyOf('cave', cave.id),
        keyOf('massif', massif.id),
        keyOf('organization', organization.id),
        botSitemap.INDEX_PATH,
      ].forEach((key) => should(isOnline(key)).be.true());
    });

    it('a second run with nothing changed uploads nothing and deletes nothing', async () => {
      await mkPublished();
      await nightly();

      const second = await nightly();

      should(second.counts.generation.uploaded).equal(0);
      should(second.counts.generation.deleted).equal(0);
      should(second.counts.generation.unchanged).be.aboveOrEqual(3);
      should(second.counts.sitemaps.uploaded).equal(0);
    });

    it('forced failure of step 1 uploads and deletes nothing and records the failed step', async () => {
      const { cave } = await mkPublished();
      await nightly();
      const put = sinon.spy(adapter, 'put');
      const del = sinon.spy(adapter, 'delete');
      // A change that would delete the cave page, and a violation
      await query('UPDATE t_cave SET is_deleted = true WHERE id = $1', [
        cave.id,
      ]);
      const original = CommonService.query;
      sinon.stub(CommonService, 'query').callsFake((sql, ...rest) => {
        if (sql === 'SELECT * FROM bot_cascade_check()') {
          return Promise.resolve({
            rows: [
              {
                violation_count: '1',
                violation_ids: [1],
                override_count: '0',
                override_ids: [],
              },
            ],
          });
        }
        return original.call(CommonService, sql, ...rest);
      });
      sinon.stub(sails.log, 'error');

      const failure = await nightly().catch((e) => e);

      CommonService.query.restore();
      should(failure.failedStep).equal(1);
      should(put.callCount).equal(0);
      should(del.callCount).equal(0);
      should(isOnline(keyOf('cave', cave.id))).be.true();
      const { rows } = await query(
        'SELECT status, failed_step FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1'
      );
      should(rows[0]).eql({ status: 'failed', failed_step: 1 });
    });

    it('forced failure of step 2 uploads and deletes nothing and records the failed step', async () => {
      const { cave } = await mkPublished();
      await nightly();
      const put = sinon.spy(adapter, 'put');
      const del = sinon.spy(adapter, 'delete');
      await query('UPDATE t_cave SET is_deleted = true WHERE id = $1', [
        cave.id,
      ]);
      const scan = sinon
        .stub(sails.services.bottextscanservice, 'run')
        .rejects(new Error('detector exploded'));
      sinon.stub(sails.log, 'error');

      const failure = await nightly().catch((e) => e);

      should(scan.callCount).equal(1);
      should(failure.failedStep).equal(2);
      should(put.callCount).equal(0);
      should(del.callCount).equal(0);
      should(isOnline(keyOf('cave', cave.id))).be.true();
      const { rows } = await query(
        'SELECT status, failed_step, error FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1'
      );
      should(rows[0].failed_step).equal(2);
      should(rows[0].error).match(/detector exploded/);
    });
  });

  describe('the audit (step 6)', () => {
    const POSITION_HTML = '<p>46°06&#39;08&quot;N 6°30&#39;36&quot;E</p>';

    it('catches and deletes a page the renderer got wrong, without failing the run', async () => {
      const { cave, massif, organization } = await mkPublished();
      // A template that interpolates what it should not: every cave page
      // carries a position
      const render = BotRenderService.render.bind(BotRenderService);
      const stub = sinon
        .stub(BotRenderService, 'render')
        .callsFake((row, options) => {
          const page = render(row, options);
          return row.entity_type === 'cave'
            ? page.replace('</main>', `${POSITION_HTML}</main>`)
            : page;
        });
      const logError = sinon.stub(sails.log, 'error');

      const result = await nightly();

      should(stub.called).be.true();
      should(result.counts.audit.failures).equal(1);
      should(result.counts.audit.failuresByReason).eql({
        'coordinates-body': 1,
      });
      should(result.counts.audit.publishingStopped).be.false();
      // The page is gone from the adapter and the manifest, the others stay
      should(isOnline(keyOf('cave', cave.id))).be.false();
      should(await manifestRow(keyOf('cave', cave.id))).be.undefined();
      should(isOnline(keyOf('massif', massif.id))).be.true();
      should(isOnline(keyOf('organization', organization.id))).be.true();
      should(
        logError
          .getCalls()
          .some((c) =>
            c.args[0].startsWith(
              `bot-surface-audit failure ${keyOf('cave', cave.id)}: coordinates-body`
            )
          )
      ).be.true();
      const { rows } = await query(
        'SELECT status, counts FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1'
      );
      should(rows[0].status).equal('succeeded');
      should(rows[0].counts.audit.failures).equal(1);
    });

    it('stops publishing past the failure limit, and says so in the final line', async () => {
      await mkPublished();
      const render = BotRenderService.render.bind(BotRenderService);
      sinon.stub(BotRenderService, 'render').callsFake((row, options) => {
        const page = render(row, options);
        return row.entity_type === 'cave'
          ? page.replace('</main>', `${POSITION_HTML}</main>`)
          : page;
      });
      sinon.stub(sails.log, 'error');
      const info = sinon.spy(sails.log, 'info');

      const result = await BotPipelineService.run({
        adapter,
        entityTypes: ['cave', 'massif', 'organization'],
        audit: { failureLimit: 0 },
      });

      should(result.counts.audit.publishingStopped).be.true();
      const { rows } = await query('SELECT * FROM t_bot_surface_state');
      should(rows[0].publishing).be.false();
      should(rows[0].reason).match(/1 pages failed \(limit 0\)/);
      const line = info
        .getCalls()
        .map((c) => c.args[0])
        .find((text) => text.startsWith('bot-surface-nightly succeeded'));
      should(line).match(/auditFailures=1 publishing=OFF /);
    });

    it('reads back from the adapter, not from the database: a page tampered with online is caught', async () => {
      const { organization } = await mkPublished();
      await nightly();
      const key = keyOf('organization', organization.id);
      // The base tables and the manifest are clean; the blob is not
      fs.writeFileSync(
        path.join(root, key),
        fs
          .readFileSync(path.join(root, key), 'utf8')
          .replace('</main>', `${POSITION_HTML}</main>`)
      );
      sinon.stub(sails.log, 'error');

      // Nothing changed, so tonight uploads nothing: only the sample reads it
      const result = await BotPipelineService.run({
        adapter,
        entityTypes: ['cave', 'massif', 'organization'],
        audit: { sampleSize: 100 },
      });

      should(result.counts.audit.sampled).be.aboveOrEqual(1);
      should(result.counts.audit.failuresByReason).eql({
        'coordinates-body': 1,
      });
      should(isOnline(key)).be.false();
    });
  });

  describe('publishing off (t_bot_surface_state)', () => {
    const setPublishing = (publishing) =>
      query(
        'UPDATE t_bot_surface_state SET publishing = $1, reason = $2, updated_at = now() WHERE id = 1',
        [publishing, publishing ? null : 'test']
      );
    const touch = (kind, id) =>
      query(
        "INSERT INTO t_bot_outbox (kind, id_entity, operation) VALUES ($1, $2, 'U')",
        [kind, id]
      );
    const bytes = (key) => fs.readFileSync(path.join(root, key), 'utf8');
    const caveWithEntrance = async (name) => {
      const cave = await fixtures.mkCave(name);
      await fixtures.mkEntrance(cave.id, `${name} entrance`);
      return cave;
    };

    it('the pipeline uploads nothing: a new page stays out, a changed page is deleted, an unchanged page stays, a removed record is deleted', async () => {
      const changed = await caveWithEntrance('Gouffre Changed');
      const unchanged = await caveWithEntrance('Gouffre Unchanged');
      const removed = await caveWithEntrance('Gouffre Removed');
      await nightly(['cave']);
      const before = bytes(keyOf('cave', unchanged.id));
      const sitemapBefore = sitemapIndex();
      // While publishing is off: a record changes, one appears, one is removed
      await setPublishing(false);
      await query('UPDATE t_cave SET depth = 999 WHERE id = $1', [changed.id]);
      await query('UPDATE t_cave SET is_deleted = true WHERE id = $1', [
        removed.id,
      ]);
      const fresh = await caveWithEntrance('Gouffre Fresh');
      const put = sinon.spy(adapter, 'put');

      const result = await nightly(['cave']);

      should(put.callCount).equal(0);
      should(result.counts.generation.uploaded).equal(0);
      should(result.counts.generation.publishing).be.false();
      should(result.counts.generation.withheld).equal(1);
      // fresh: withheld; changed and removed: deleted
      should(isOnline(keyOf('cave', fresh.id))).be.false();
      should(await manifestRow(keyOf('cave', fresh.id))).be.undefined();
      should(isOnline(keyOf('cave', changed.id))).be.false();
      should(await manifestRow(keyOf('cave', changed.id))).be.undefined();
      should(isOnline(keyOf('cave', removed.id))).be.false();
      should(result.counts.generation.deleted).equal(2);
      should(isOnline(keyOf('cave', unchanged.id))).be.true();
      should(bytes(keyOf('cave', unchanged.id))).equal(before);
      should(await manifestRow(keyOf('cave', unchanged.id))).be.ok();
      // The sitemaps would have changed (they name fewer pages): the shard
      // and the index are deleted, never rewritten
      should(result.counts.sitemaps.uploaded).equal(0);
      should(result.counts.sitemaps.publishing).be.false();
      should(sitemapBefore).be.a.String();
      should(isOnline(botSitemap.INDEX_PATH)).be.false();
      const { rows } = await query(
        "SELECT path FROM t_bot_page_manifest WHERE entity_type = 'static' AND path LIKE 'sitemap%'"
      );
      should(rows).eql([]);
    });

    it('leaves the sitemaps and every page as they are when nothing changed', async () => {
      const { cave, massif, organization } = await mkPublished();
      await nightly();
      const index = sitemapIndex();
      const files = [
        keyOf('cave', cave.id),
        keyOf('massif', massif.id),
        keyOf('organization', organization.id),
        botSitemap.INDEX_PATH,
      ];
      const snapshot = files.map((key) => bytes(key));
      await setPublishing(false);
      const put = sinon.spy(adapter, 'put');
      const del = sinon.spy(adapter, 'delete');

      const result = await nightly();

      should(put.callCount).equal(0);
      should(del.callCount).equal(0);
      should(result.counts.sitemaps.deleted).equal(0);
      should(sitemapIndex()).equal(index);
      files.forEach((key, i) => should(bytes(key)).equal(snapshot[i]));
    });

    it('the audit still runs while publishing is off, and still deletes', async () => {
      const { organization } = await mkPublished();
      await nightly();
      await setPublishing(false);
      const key = keyOf('organization', organization.id);
      fs.writeFileSync(
        path.join(root, key),
        bytes(key).replace(
          '</main>',
          '<p>46°06&#39;08&quot;N 6°30&#39;36&quot;E</p></main>'
        )
      );
      sinon.stub(sails.log, 'error');

      const result = await BotPipelineService.run({
        adapter,
        entityTypes: ['cave', 'massif', 'organization'],
        audit: { sampleSize: 100 },
      });

      should(result.counts.audit.failures).equal(1);
      should(isOnline(key)).be.false();
    });

    it('fails closed: with the state row missing nothing is uploaded and the error is logged', async () => {
      const { organization } = await mkPublished();
      await query('DELETE FROM t_bot_surface_state');
      const logError = sinon.stub(sails.log, 'error');
      const put = sinon.spy(adapter, 'put');

      const result = await nightly();

      should(put.callCount).equal(0);
      should(result.counts.generation.publishing).be.false();
      should(isOnline(keyOf('organization', organization.id))).be.false();
      should(
        logError
          .getCalls()
          .some((c) => /t_bot_surface_state has no row/.test(c.args[0]))
      ).be.true();
    });

    it('the withdrawal worker uploads nothing either: new and changed pages are not uploaded, the changed one is deleted, an unchanged one stays', async () => {
      const changed = await caveWithEntrance('Gouffre Worker Changed');
      const unchanged = await caveWithEntrance('Gouffre Worker Unchanged');
      // Too young for the nightly admission: not published by the first run
      const fresh = await fixtures.mkCave('Gouffre Worker Fresh', {
        admitted: false,
        ageDays: 5,
      });
      await fixtures.mkEntrance(fresh.id, 'Gouffre Worker Fresh entrance', {
        admitted: false,
        ageDays: 5,
      });
      await nightly(['cave']);
      should(isOnline(keyOf('cave', fresh.id))).be.false();
      const before = bytes(keyOf('cave', unchanged.id));
      await setPublishing(false);
      await query('UPDATE t_cave SET depth = 999 WHERE id = $1', [changed.id]);
      // Admitted now, so it is new for the worker (the age gate is nightly)
      await query(
        `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
         VALUES ('cave', $1, now() - interval '60 days')`,
        [fresh.id]
      );
      await query(
        `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
         SELECT 'entrance', id, now() - interval '60 days' FROM t_entrance WHERE id_cave = $1`,
        [fresh.id]
      );
      await query('TRUNCATE t_bot_outbox');
      await touch('cave', changed.id);
      await touch('cave', unchanged.id);
      await touch('cave', fresh.id);
      const put = sinon.spy(adapter, 'put');

      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave'],
      });

      should(put.callCount).equal(0);
      should(result.uploaded).equal(0);
      should(result.deleted).equal(1);
      should(result.withheld).equal(1);
      should(result.unchanged).equal(1);
      should(isOnline(keyOf('cave', changed.id))).be.false();
      should(await manifestRow(keyOf('cave', changed.id))).be.undefined();
      should(isOnline(keyOf('cave', fresh.id))).be.false();
      should(isOnline(keyOf('cave', unchanged.id))).be.true();
      should(bytes(keyOf('cave', unchanged.id))).equal(before);
      // The outbox rows are handled and gone
      should(
        (await query('SELECT count(*)::int AS n FROM t_bot_outbox')).rows[0].n
      ).equal(0);
    });

    it('the withdrawal worker still deletes a page that must go', async () => {
      const cave = await caveWithEntrance('Gouffre Worker Withdrawn');
      await nightly(['cave']);
      await setPublishing(false);
      await query(
        'UPDATE t_entrance SET is_sensitive = true WHERE id_cave = $1',
        [cave.id]
      );

      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave'],
      });

      should(result.deleted).equal(1);
      should(isOnline(keyOf('cave', cave.id))).be.false();
      should(await manifestRow(keyOf('cave', cave.id))).be.undefined();
    });

    it('the worker uploads again as soon as publishing is back on', async () => {
      const cave = await caveWithEntrance('Gouffre Back On');
      await nightly(['cave']);
      await setPublishing(false);
      await query('UPDATE t_cave SET depth = 999 WHERE id = $1', [cave.id]);
      await query('TRUNCATE t_bot_outbox');
      await touch('cave', cave.id);
      await BotOutboxService.run({ adapter, entityTypes: ['cave'] });
      should(isOnline(keyOf('cave', cave.id))).be.false();

      await setPublishing(true);
      await touch('cave', cave.id);
      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave'],
      });

      should(result.uploaded).equal(1);
      should(isOnline(keyOf('cave', cave.id))).be.true();
    });

    it('the worker fails closed with the state row missing', async () => {
      const cave = await caveWithEntrance('Gouffre Worker Closed');
      await query('DELETE FROM t_bot_surface_state');
      sinon.stub(sails.log, 'error');
      await touch('cave', cave.id);
      const put = sinon.spy(adapter, 'put');

      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave'],
      });

      should(put.callCount).equal(0);
      should(result.withheld).equal(1);
      should(isOnline(keyOf('cave', cave.id))).be.false();
    });
  });

  describe('the allow-list (BOT_SURFACE_ENTITY_TYPES)', () => {
    it('generates a listed type and none of the others', async () => {
      const { cave, massif, organization } = await mkPublished();

      await nightly(['organization']);

      should(isOnline(keyOf('organization', organization.id))).be.true();
      should(isOnline(keyOf('cave', cave.id))).be.false();
      should(isOnline(keyOf('massif', massif.id))).be.false();
      should(await manifestCount('cave')).equal(0);
      should(await manifestCount('massif')).equal(0);
      const index = sitemapIndex();
      should(index).containEql(botSitemap.shardPath('organization', 0));
      should(index).not.containEql(botSitemap.shardPath('cave', 0));
      should(index).not.containEql(botSitemap.shardPath('massif', 0));
    });

    it('deletes the pages, manifest rows and sitemap entries of a type that leaves the list', async () => {
      const { cave, massif, organization } = await mkPublished();
      await nightly(ALL_TYPES);
      should(isOnline(keyOf('cave', cave.id))).be.true();
      should(isOnline(keyOf('massif', massif.id))).be.true();
      should(await manifestCount('cave')).be.aboveOrEqual(1);
      should(isOnline(botSitemap.shardPath('cave', 0))).be.true();
      should(isOnline(botSitemap.shardPath('massif', 0))).be.true();

      const second = await nightly(['organization']);

      should(isOnline(keyOf('cave', cave.id))).be.false();
      should(isOnline(keyOf('massif', massif.id))).be.false();
      should(isOnline(keyOf('organization', organization.id))).be.true();
      should(await manifestRow(keyOf('cave', cave.id))).be.undefined();
      should(await manifestCount('cave')).equal(0);
      should(await manifestCount('massif')).equal(0);
      should(isOnline(botSitemap.shardPath('cave', 0))).be.false();
      should(isOnline(botSitemap.shardPath('massif', 0))).be.false();
      should(isOnline(botSitemap.shardPath('organization', 0))).be.true();
      should(sitemapIndex()).not.containEql(botSitemap.shardPath('cave', 0));
      should(second.counts.generation.byType.cave.deleted).be.aboveOrEqual(1);
      should(second.counts.generation.byType.cave.uploaded).equal(0);
      should(second.counts.generation.pages.cave ?? 0).equal(0);
    });

    it('takes everything down with the documented rollback: the pages, then the sitemaps, with an empty list', async () => {
      const { cave, massif, organization } = await mkPublished();
      await nightly(ALL_TYPES);
      should(isOnline(botSitemap.INDEX_PATH)).be.true();

      await BotPageGeneratorService.run({ adapter, entityTypes: [] });
      // The pages are down, the sitemaps still name them until the second call
      should(isOnline(keyOf('cave', cave.id))).be.false();
      should(isOnline(botSitemap.shardPath('cave', 0))).be.true();
      await BotSitemapService.run({ adapter, entityTypes: [] });

      should(isOnline(keyOf('massif', massif.id))).be.false();
      should(isOnline(keyOf('organization', organization.id))).be.false();
      should(isOnline(botSitemap.INDEX_PATH)).be.false();
      should(isOnline(botSitemap.shardPath('cave', 0))).be.false();
      const { rows } = await query(
        "SELECT path FROM t_bot_page_manifest WHERE path <> '404.html'"
      );
      should(rows).eql([]);
    });

    it('deletes the hub pages and their sitemap when hub leaves the list, and no page links to a hub any more', async () => {
      const { cave } = await mkPublished();
      await nightly(ALL_TYPES);
      const hubUrl = botPagePaths.toHubUrl(
        'country',
        'FR',
        sails.config.custom.botSurface.publicBaseUrl
      );
      should(
        fs.readFileSync(path.join(root, keyOf('cave', cave.id)), 'utf8')
      ).containEql(hubUrl);
      const hubs = await manifestCount('hub');
      should(hubs).be.aboveOrEqual(1);
      should(isOnline(botSitemap.HUB_SHARD_PATH)).be.true();

      await nightly(['cave', 'massif', 'organization']);

      should(
        fs.readFileSync(path.join(root, keyOf('cave', cave.id)), 'utf8')
      ).not.containEql(hubUrl);
      should(await manifestCount('hub')).equal(0);
      should(isOnline(botSitemap.HUB_SHARD_PATH)).be.false();
      should(sitemapIndex()).not.containEql(botSitemap.HUB_SHARD_PATH);
      const hubDir = path.join(root, 'hubs');
      should(
        fs.existsSync(hubDir)
          ? fs
              .readdirSync(hubDir, { recursive: true })
              .filter((f) => f.endsWith('.html'))
          : []
      ).be.empty();
    });

    it('rejects a name outside the vocabulary and a list that is not an array', async () => {
      await should(
        BotPageGeneratorService.run({
          adapter,
          entityTypes: ['cave', 'grotto'],
        })
      ).be.rejectedWith(RangeError, /Unknown bot entity type: grotto/);
      await should(
        BotPageGeneratorService.run({ adapter, entityTypes: 'cave' })
      ).be.rejectedWith(TypeError);
      await should(
        BotSitemapService.run({ adapter, entityTypes: ['grotto'] })
      ).be.rejectedWith(RangeError);
    });
  });

  describe('the withdrawal worker and the allow-list', () => {
    const touchMassif = (id) =>
      query(
        "INSERT INTO t_bot_outbox (kind, id_entity, operation) VALUES ('massif', $1, 'U')",
        [id]
      );

    it('publishes a listed type', async () => {
      const { massif } = await mkPublished();
      await touchMassif(massif.id);

      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave', 'massif', 'organization'],
      });

      should(isOnline(keyOf('massif', massif.id))).be.true();
      should(result.uploaded).be.aboveOrEqual(1);
    });

    it('does not publish a type that is not listed', async () => {
      const { cave, massif } = await mkPublished();
      await touchMassif(massif.id);
      await query(
        "INSERT INTO t_bot_outbox (kind, id_entity, operation) VALUES ('cave', $1, 'U')",
        [cave.id]
      );

      const put = sinon.spy(adapter, 'put');
      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave'],
      });

      should(isOnline(keyOf('massif', massif.id))).be.false();
      should(await manifestRow(keyOf('massif', massif.id))).be.undefined();
      // The listed type is published as usual
      should(isOnline(keyOf('cave', cave.id))).be.true();
      should(put.args.map(([key]) => key)).not.containEql(
        keyOf('massif', massif.id)
      );
      should(result.rows).be.aboveOrEqual(2);
    });

    it('still deletes the page of a type that left the list', async () => {
      const { massif } = await mkPublished();
      await BotPageGeneratorService.run({ adapter });
      await query('TRUNCATE t_bot_outbox');
      should(isOnline(keyOf('massif', massif.id))).be.true();
      await touchMassif(massif.id);

      const result = await BotOutboxService.run({
        adapter,
        entityTypes: ['cave', 'organization'],
      });

      should(isOnline(keyOf('massif', massif.id))).be.false();
      should(await manifestRow(keyOf('massif', massif.id))).be.undefined();
      should(result.deleted).be.aboveOrEqual(1);
    });

    it('takes the allow-list from the configuration when the queue service runs it', async () => {
      const run = sinon.stub(BotOutboxService, 'run').resolves({
        skipped: false,
        rows: 0,
        pages: 0,
        rendered: 0,
        uploaded: 0,
        redirected: 0,
        deleted: 0,
        unchanged: 0,
      });
      const original = sails.config.custom.botSurface;
      sails.config.custom.botSurface = {
        ...original,
        entityTypes: ['organization'],
      };
      try {
        await BotOutboxQueueService.processJob([{}]);
      } finally {
        sails.config.custom.botSurface = original;
      }
      should(run.firstCall.args[0].entityTypes).eql(['organization']);
    });
  });
});
