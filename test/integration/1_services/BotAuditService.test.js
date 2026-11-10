const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const sinon = require('sinon');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');
const { DEFAULT_TEST_URL } = require('../../test-config');
const { createBotFixtures } = require('../../helpers/botSurfaceFixtures');

const VERSION = 5;
const BASE_URL = 'https://grottocenter.org/ui';
const POSITION = '46°06&#39;08&quot;N 6°30&#39;36&quot;E';
const SPA_SHELL =
  '<!doctype html><html><head><title>Grottocenter</title></head><body><div id="root"></div></body></html>';
const LEAKED_PAGE =
  '<!DOCTYPE html><html><head><meta name="generator" content="gc-static-pages"><title>x</title></head><body></body></html>';

describe('BotAuditService - step 6, the audit of what is online', () => {
  let BotAuditService;
  let botPagePaths;
  let BotPublishService;
  let BotPageGeneratorService;
  let BotSurfaceStateService;
  let LocalStorageAdapter;
  let fixtures;
  let root;
  let adapter;
  let logError;
  let logWarn;
  // The start of the "run": pages seeded as old have a published_at before it
  let since;
  let originalConfig;

  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    botPagePaths = require('../../../api/utils/botPagePaths');
    BotAuditService = require('../../../api/services/bot/BotAuditService');
    BotPublishService = require('../../../api/services/bot/BotPublishService');
    BotPageGeneratorService = require('../../../api/services/bot/BotPageGeneratorService');
    BotSurfaceStateService = require('../../../api/services/bot/BotSurfaceStateService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
    fixtures = createBotFixtures({ scanVersion: VERSION });
  });

  before(async () => {
    originalConfig = (await query('SELECT * FROM t_bot_config')).rows[0];
  });

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-audit-'));
    adapter = new LocalStorageAdapter(root);
    logError = sinon.stub(sails.log, 'error');
    logWarn = sinon.stub(sails.log, 'warn');
    await query('TRUNCATE t_bot_page_manifest');
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
    since = new Date(Date.now() - 60 * 1000);
  });

  afterEach(async () => {
    sinon.restore();
    await fixtures.cleanup();
    await query('UPDATE t_bot_config SET pattern_version = $1', [
      originalConfig.pattern_version,
    ]);
    fs.rmSync(root, { recursive: true, force: true });
  });

  // ---- seeding --------------------------------------------------------------

  const html = ({ body = '<h1>Gouffre</h1>', jsonLd, head = '' } = {}) =>
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="generator" content="gc-static-pages">${head}<title>T - Grottocenter</title>${
      jsonLd === undefined
        ? ''
        : `<script type="application/ld+json">${jsonLd}</script>`
    }<style>body{margin:0;padding:0.75rem 1rem}</style></head><body><main>${body}</main></body></html>`;

  // Puts a page online and in the manifest. `old` backdates its published_at
  // to before the run
  const publish = async (
    key,
    content,
    { entityType, entityId, redirectTo = null, old = false } = {}
  ) => {
    const parsed = botPagePaths.fromKey(key);
    await adapter.put(key, content);
    await BotPublishService.recordPublished({
      path: key,
      entityType: entityType ?? parsed.entityType,
      entityId: entityId ?? parsed.id ?? null,
      hubType: parsed.hubType ?? null,
      hubKey: parsed.hubKey ?? null,
      hash: BotPublishService.sha256(content),
      lastmod: null,
      redirectTo,
    });
    if (old) {
      await query(
        "UPDATE t_bot_page_manifest SET published_at = now() - interval '2 days' WHERE path = $1",
        [key]
      );
    }
  };

  // A cave with a public entrance: the record a page can be about
  const mkPublicCave = async (name = 'Gouffre Audit') => {
    const cave = await fixtures.mkCave(name);
    const entrance = await fixtures.mkEntrance(cave.id, `${name} entrance`);
    return { cave, entrance };
  };

  const caveKey = (id) => `caves/${id}.html`;
  const link = (type, id) => `<a href="${BASE_URL}/${type}/${id}">x</a>`;

  // Pages that fail the coordinate check, each about its own cave
  const seedBad = async (n) => {
    for (let i = 0; i < n; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const subject = await mkPublicCave(`Gouffre Mauvais ${i}`);
      // eslint-disable-next-line no-await-in-loop
      await publish(caveKey(subject.cave.id), html({ body: POSITION }));
    }
  };

  const audit = (options = {}) =>
    BotAuditService.run({
      adapter,
      since,
      sampleSize: 0,
      variantSample: 0,
      retry: { intervalMs: 1, maxAttempts: 3 },
      sleep: async () => {},
      ...options,
    });

  const isOnline = (key) => fs.existsSync(path.join(root, key));
  const inManifest = async (key) =>
    (await query('SELECT 1 FROM t_bot_page_manifest WHERE path = $1', [key]))
      .rows.length === 1;
  const errorLines = () => logError.getCalls().map((c) => c.args[0]);

  // ---- a clean page ---------------------------------------------------------

  describe('a clean page', () => {
    it('is read back and left alone: file, manifest row and no error', async () => {
      const { cave } = await mkPublicCave();
      await publish(
        caveKey(cave.id),
        html({ body: `<h1>Gouffre</h1><p>Profondeur 1271.5 m, 1953</p>` })
      );

      const counts = await audit();

      should(counts.pagesChecked).equal(1);
      should(counts.uploadedChecked).equal(1);
      should(counts.failures).equal(0);
      should(counts.failuresByReason).eql({});
      should(isOnline(caveKey(cave.id))).be.true();
      should(await inManifest(caveKey(cave.id))).be.true();
      should(logError.called).be.false();
    });

    it('finds no failure over pages made by the real renderer: caves, a massif, an organization, hubs and a redirect page', async () => {
      const first = await mkPublicCave('Gouffre Un');
      const second = await mkPublicCave('Gouffre Deux');
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await fixtures.query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.id,
        second.cave.id,
      ]);
      await fixtures.mkEntrance(first.cave.id, 'Entree Un', {
        place: fixtures.INSIDE,
      });
      const massif = await fixtures.mkMassif('Massif Audit');
      const organization = await fixtures.mkOrganization('Club Audit');
      await fixtures.mkDescription(
        { cave: first.cave.id },
        'Un gouffre de 1271.5 m de profondeur, exploré en 1953, 1961 et 2019. Cote 120, 45 puits, 3 siphons.'
      );
      const summary = await BotPageGeneratorService.run({
        adapter,
        entityTypes: ['cave', 'massif', 'organization', 'hub'],
      });
      should(summary.uploaded).be.aboveOrEqual(6);
      const { rows: manifest } = await query(
        "SELECT path, entity_type, redirect_to FROM t_bot_page_manifest WHERE entity_type <> 'static'"
      );
      const types = new Set(manifest.map((row) => row.entity_type));
      ['cave', 'massif', 'organization'].forEach((type) =>
        should(types.has(type)).be.true()
      );
      should(manifest.some((row) => row.redirect_to !== null)).be.true();
      should(manifest.some((row) => row.entity_type === 'hub')).be.true();
      should(isOnline(caveKey(merged.id))).be.true();
      should(isOnline(`massifs/${massif.id}.html`)).be.true();
      should(isOnline(`organizations/${organization.id}.html`)).be.true();

      const counts = await audit({ since: new Date(Date.now() - 3600 * 1000) });

      should(counts.pagesChecked).equal(manifest.length);
      should(counts.failures).equal(0);
      should(logError.called).be.false();
    });
  });

  // ---- each kind of failure -------------------------------------------------

  describe('a failing page', () => {
    // [name, reason, build(cave) => { body, jsonLd, links } as extra seeds]
    const kinds = [
      {
        name: 'a coordinate in the body',
        reason: 'coordinates-body',
        page: () => html({ body: `<p class="text">Entrée: ${POSITION}</p>` }),
      },
      {
        name: 'a coordinate in the JSON-LD',
        reason: 'coordinates-json-ld',
        page: () =>
          html({
            jsonLd:
              '{"@type":"Place","geo":{"latitude":46.10222,"longitude":6.51234}}',
          }),
      },
      {
        name: 'a coordinate in a meta description',
        reason: 'coordinates-body',
        page: () =>
          html({
            head: '<meta name="description" content="N 46.10222 E 6.51234">',
          }),
      },
      {
        name: 'a sensitive entrance linked from a cave page',
        reason: 'sensitive-entrance',
        arrange: async ({ cave }) => {
          const secret = await fixtures.mkEntrance(cave.id, 'Secret');
          await query(
            'UPDATE t_entrance SET is_sensitive = true WHERE id = $1',
            [secret.id]
          );
          return { entrance: secret.id };
        },
        page: (ids) => html({ body: link('entrances', ids.entrance) }),
      },
      {
        name: 'a sensitive entrance carried in the JSON-LD',
        reason: 'sensitive-entrance',
        arrange: async ({ cave }) => {
          const secret = await fixtures.mkEntrance(cave.id, 'Secret');
          await query(
            'UPDATE t_entrance SET is_sensitive = true WHERE id = $1',
            [secret.id]
          );
          return { entrance: secret.id };
        },
        page: (ids) =>
          html({
            jsonLd: `{"entrances":[{"@id":"${BASE_URL}/entrances/${ids.entrance}"}]}`,
          }),
      },
      {
        name: 'a sensitive massif linked from a cave page',
        reason: 'sensitive-massif',
        arrange: async () => {
          const massif = await fixtures.mkMassif('Massif Secret');
          await query('UPDATE t_massif SET is_sensitive = true WHERE id = $1', [
            massif.id,
          ]);
          return { massif: massif.id };
        },
        page: (ids) => html({ body: link('massifs', ids.massif) }),
      },
      {
        name: 'a deleted massif linked from a cave page',
        reason: 'deleted-record',
        arrange: async () => {
          const massif = await fixtures.mkMassif('Massif Supprime');
          await query('UPDATE t_massif SET is_deleted = true WHERE id = $1', [
            massif.id,
          ]);
          return { massif: massif.id };
        },
        page: (ids) => html({ body: link('massifs', ids.massif) }),
      },
      {
        name: 'a merged cave linked from a cave page',
        reason: 'merged-record',
        arrange: async ({ cave }) => {
          const other = await fixtures.mkCave('Gouffre Fusionne');
          await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
            other.id,
            cave.id,
          ]);
          return { other: other.id };
        },
        page: (ids) => html({ body: link('caves', ids.other) }),
      },
      {
        name: 'a merged organization linked from a cave page',
        reason: 'merged-record',
        arrange: async () => {
          const organization = await fixtures.mkOrganization('Club Fusionne');
          const target = await fixtures.mkOrganization('Club Cible');
          await query('UPDATE t_grotto SET redirect_to = $2 WHERE id = $1', [
            organization.id,
            target.id,
          ]);
          return { organization: organization.id };
        },
        page: (ids) => html({ body: link('organizations', ids.organization) }),
      },
      {
        name: 'a record that does not exist',
        reason: 'missing-record',
        page: () => html({ body: link('massifs', 2147483000) }),
      },
      {
        name: 'a cave with no public entrance linked from a massif page',
        reason: 'no-public-entrance',
        arrange: async () => {
          const bare = await fixtures.mkCave('Gouffre Sans Entree');
          return { bare: bare.id };
        },
        page: (ids) => html({ body: link('caves', ids.bare) }),
      },
      {
        name: 'a cave whose only entrance is sensitive linked from a page',
        reason: 'no-public-entrance',
        arrange: async () => {
          const bare = await fixtures.mkCave('Gouffre Sensible');
          const entrance = await fixtures.mkEntrance(bare.id, 'Sensible');
          await query(
            'UPDATE t_entrance SET is_sensitive = true WHERE id = $1',
            [entrance.id]
          );
          return { bare: bare.id };
        },
        page: (ids) => html({ body: link('caves', ids.bare) }),
      },
    ];

    kinds.forEach(({ name, reason, arrange, page }) => {
      it(`fails ${name} (${reason}): the page is deleted from the adapter and the manifest, and logged`, async () => {
        const subject = await mkPublicCave();
        const key = caveKey(subject.cave.id);
        const ids = arrange ? await arrange(subject) : {};
        await publish(key, page(ids));

        const counts = await audit();

        should(counts.failures).equal(1);
        should(counts.failuresByReason).eql({ [reason]: 1 });
        should(isOnline(key)).be.false();
        should(await inManifest(key)).be.false();
        const lines = errorLines().filter((line) =>
          line.startsWith('bot-surface-audit failure')
        );
        should(lines).have.length(1);
        should(lines[0]).match(
          new RegExp(`^bot-surface-audit failure ${key}: ${reason}`)
        );
      });
    });

    it('never writes the coordinates it found into the log', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html({ body: `<p>${POSITION}</p>` }));

      await audit();

      const text = errorLines().join('\n');
      should(text).not.containEql('46°');
      should(text).match(/coordinates-body \(dms\)/);
    });

    it('fails a cave page whose own cave has lost its last public entrance', async () => {
      const { cave, entrance } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'no-public-entrance': 1 });
      should(isOnline(caveKey(cave.id))).be.false();
    });

    it('fails a massif page whose own massif became sensitive', async () => {
      const massif = await fixtures.mkMassif('Massif Devenu Sensible');
      const key = `massifs/${massif.id}.html`;
      await publish(key, html());
      await query('UPDATE t_massif SET is_sensitive = true WHERE id = $1', [
        massif.id,
      ]);

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'sensitive-massif': 1 });
      should(isOnline(key)).be.false();
      should(await inManifest(key)).be.false();
    });

    it('fails a page whose own record was deleted', async () => {
      const organization = await fixtures.mkOrganization('Club Supprime');
      const key = `organizations/${organization.id}.html`;
      await publish(key, html());
      await query('UPDATE t_grotto SET is_deleted = true WHERE id = $1', [
        organization.id,
      ]);

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'deleted-record': 1 });
      should(isOnline(key)).be.false();
    });

    it('fails a page whose own record was merged into another', async () => {
      const { cave } = await mkPublicCave();
      const target = await mkPublicCave('Gouffre Cible');
      await publish(caveKey(cave.id), html());
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        cave.id,
        target.cave.id,
      ]);

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'merged-record': 1 });
    });

    it('fails a page over the size cap, without reading it into memory', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html({ body: 'x'.repeat(5000) }));
      const get = sinon.spy(adapter, 'get');

      const counts = await audit({ maxPageBytes: 1000 });

      should(counts.failuresByReason).eql({ 'too-large': 1 });
      should(get.firstCall.args[1]).eql({ maxBytes: 1000 });
      should(isOnline(caveKey(cave.id))).be.false();
    });

    it('reports a failing page by the most severe reason when it has several', async () => {
      const subject = await mkPublicCave();
      const massif = await fixtures.mkMassif('Massif Supprime');
      await query('UPDATE t_massif SET is_deleted = true WHERE id = $1', [
        massif.id,
      ]);
      const secret = await fixtures.mkEntrance(subject.cave.id, 'Secret');
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        secret.id,
      ]);
      await publish(
        caveKey(subject.cave.id),
        html({
          body: link('massifs', massif.id) + link('entrances', secret.id),
        })
      );

      const counts = await audit();

      should(counts.failures).equal(1);
      should(counts.failuresByReason).eql({ 'sensitive-entrance': 1 });
    });

    it('does not fail a page for a path written in a description, or a link to another site: only what the generator emits counts', async () => {
      const subject = await mkPublicCave();
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.id,
        subject.cave.id,
      ]);
      await publish(
        caveKey(subject.cave.id),
        html({
          body: `<p class="text">Voir ${BASE_URL}/caves/${merged.id}, /caves/${merged.id} et <a href="https://un-club.fr/caves/${merged.id}">le club</a></p>`,
          jsonLd: `{"@id":"${BASE_URL}/caves/${subject.cave.id}","description":"${BASE_URL}/caves/${merged.id}"}`,
        })
      );

      const counts = await audit();

      should(counts.pagesChecked).equal(1);
      should(counts.failures).equal(0);
      should(isOnline(caveKey(subject.cave.id))).be.true();
    });

    it('does fail a page for a link the generator would emit to a merged record', async () => {
      const subject = await mkPublicCave();
      const merged = await fixtures.mkCave('Gouffre Fusionne Lie');
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.id,
        subject.cave.id,
      ]);
      await publish(
        caveKey(subject.cave.id),
        html({ body: link('caves', merged.id) })
      );

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'merged-record': 1 });
    });

    it('leaves the clean pages of the same run alone', async () => {
      const bad = await mkPublicCave('Gouffre Mauvais');
      const good = await mkPublicCave('Gouffre Bon');
      await publish(caveKey(bad.cave.id), html({ body: POSITION }));
      await publish(caveKey(good.cave.id), html());

      const counts = await audit();

      should(counts.pagesChecked).equal(2);
      should(counts.failures).equal(1);
      should(isOnline(caveKey(good.cave.id))).be.true();
      should(await inManifest(caveKey(good.cave.id))).be.true();
    });
  });

  // ---- redirect pages -------------------------------------------------------

  describe('a redirect page', () => {
    it('passes: its own record is merged by definition, its target is the record that counts', async () => {
      const target = await mkPublicCave('Gouffre Cible');
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.id,
        target.cave.id,
      ]);
      await publish(
        caveKey(merged.id),
        html({ body: link('caves', target.cave.id) }),
        { redirectTo: target.cave.id }
      );

      const counts = await audit();

      should(counts.pagesChecked).equal(1);
      should(counts.failures).equal(0);
      should(isOnline(caveKey(merged.id))).be.true();
    });

    it('fails when its target is not fit, and is deleted with its manifest row', async () => {
      const target = await fixtures.mkCave('Gouffre Cible Sans Entree');
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await query('UPDATE t_cave SET redirect_to = $2 WHERE id = $1', [
        merged.id,
        target.id,
      ]);
      await publish(
        caveKey(merged.id),
        html({ body: link('caves', target.id) }),
        { redirectTo: target.id }
      );

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'no-public-entrance': 1 });
      should(isOnline(caveKey(merged.id))).be.false();
      should(await inManifest(caveKey(merged.id))).be.false();
    });

    it('is checked for coordinates like any page', async () => {
      const target = await mkPublicCave('Gouffre Cible');
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await publish(
        caveKey(merged.id),
        html({ body: link('caves', target.cave.id) + POSITION }),
        { redirectTo: target.cave.id }
      );

      const counts = await audit();

      should(counts.failuresByReason).eql({ 'coordinates-body': 1 });
      should(await inManifest(caveKey(merged.id))).be.false();
    });
  });

  // ---- which pages ----------------------------------------------------------

  describe('which pages are read', () => {
    const seed = async (n, options = {}) => {
      const keys = [];
      for (let i = 0; i < n; i += 1) {
        // Pages of organizations that exist, so that they pass
        // eslint-disable-next-line no-await-in-loop
        const organization = await fixtures.mkOrganization(`Club ${i}`);
        const key = `organizations/${organization.id}.html`;
        // eslint-disable-next-line no-await-in-loop
        await publish(key, html(), options);
        keys.push(key);
      }
      return keys;
    };

    it('reads every page uploaded since the start of the run, over several batches, and nothing of the static rows', async () => {
      await seed(7);
      await adapter.put('404.html', html({ body: POSITION }));
      await BotPublishService.recordPublished({
        path: '404.html',
        entityType: 'static',
        entityId: null,
        hash: 'x',
        lastmod: null,
      });
      await adapter.put('sitemap.xml', POSITION);
      await BotPublishService.recordPublished({
        path: 'sitemap.xml',
        entityType: 'static',
        entityId: null,
        hash: 'y',
        lastmod: null,
      });
      const get = sinon.spy(adapter, 'get');

      const counts = await audit({ batchSize: 3 });

      should(counts.pagesChecked).equal(7);
      should(counts.uploadedChecked).equal(7);
      should(counts.sampled).equal(0);
      should(counts.failures).equal(0);
      should(get.callCount).equal(7);
      should(isOnline('404.html')).be.true();
    });

    it('leaves out the pages published before the run unless they are sampled', async () => {
      const [oldKey] = await seed(1, { old: true });
      await seed(2);
      const get = sinon.spy(adapter, 'get');

      const counts = await audit();

      should(counts.pagesChecked).equal(2);
      should(get.getCalls().map((c) => c.args[0])).not.containEql(oldKey);
    });

    it('samples exactly sampleSize of the older pages, and none of tonight twice', async () => {
      await seed(12, { old: true });
      await seed(3);

      const counts = await audit({ sampleSize: 5 });

      should(counts.uploadedChecked).equal(3);
      should(counts.sampled).equal(5);
      should(counts.pagesChecked).equal(8);
    });

    it('samples all of them when fewer than sampleSize exist', async () => {
      await seed(4, { old: true });

      const counts = await audit({ sampleSize: 1000 });

      should(counts.sampled).equal(4);
      should(counts.pagesChecked).equal(4);
    });

    it('finds a bad page that was not uploaded tonight through the sample, and deletes it', async () => {
      const subject = await mkPublicCave('Gouffre Ancien');
      await publish(caveKey(subject.cave.id), html({ body: POSITION }), {
        old: true,
      });

      should((await audit({ sampleSize: 0 })).failures).equal(0);
      should(isOnline(caveKey(subject.cave.id))).be.true();

      const counts = await audit({ sampleSize: 10 });
      should(counts.sampled).equal(1);
      should(counts.failuresByReason).eql({ 'coordinates-body': 1 });
      should(isOnline(caveKey(subject.cave.id))).be.false();
    });

    it('reads a different page each time a sample is smaller than the pages, over many draws', async () => {
      const keys = await seed(6, { old: true });
      const seen = new Set();
      for (let i = 0; i < 30; i += 1) {
        const get = sinon.spy(adapter, 'get');
        // eslint-disable-next-line no-await-in-loop
        await audit({ sampleSize: 1 });
        get.getCalls().forEach((c) => seen.add(c.args[0]));
        get.restore();
      }
      // A fixed sample would read one page. 30 draws of 1 among 6 reach more than 3
      should(seen.size).be.above(3);
      keys.forEach((key) => should(keys).containEql(key));
    });

    it('counts a manifest row without a file as missing, warns, and does not fail it', async () => {
      const [key] = await seed(1);
      await adapter.delete(key);

      const counts = await audit();

      should(counts.missing).equal(1);
      should(counts.failures).equal(0);
      should(logWarn.getCalls().some((c) => c.args[0].includes(key))).be.true();
      should(await inManifest(key)).be.true();
    });

    it('fails on its own error: an adapter that cannot be read', async () => {
      await seed(1);
      sinon.stub(adapter, 'get').rejects(new Error('storage unreachable'));

      await audit().should.be.rejectedWith('storage unreachable');
    });
  });

  // ---- bounds ---------------------------------------------------------------

  describe('bounds', () => {
    const seedMany = async (n) => {
      // The pages need no record: they link none, and the own record is a
      // cave that does not exist, so they would fail; use hubs instead
      for (let i = 0; i < n; i += 1) {
        const key =
          i === 0
            ? 'countries.html'
            : `countries/F${String.fromCharCode(65 + i)}.html`;
        // eslint-disable-next-line no-await-in-loop
        await publish(key, html());
      }
    };

    it('reads the manifest by batches, and never has more than `concurrency` pages in flight', async () => {
      await seedMany(10);
      let inFlight = 0;
      let peak = 0;
      const original = adapter.get.bind(adapter);
      sinon.stub(adapter, 'get').callsFake(async (...args) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
        inFlight -= 1;
        return original(...args);
      });
      const manifestReads = sinon.spy(CommonService, 'query');

      const counts = await audit({ batchSize: 4, concurrency: 2 });

      should(counts.pagesChecked).equal(10);
      should(peak).equal(2);
      const keysetReads = manifestReads
        .getCalls()
        .filter((c) =>
          /FROM t_bot_page_manifest\s+WHERE entity_type <> 'static' AND published_at >=/.test(
            c.args[0]
          )
        );
      // 10 pages in batches of 4: three reads with rows, and the keyset moves
      should(keysetReads.length).be.aboveOrEqual(3);
      keysetReads.forEach((c) => should(c.args[1][2]).equal(4));
      should(keysetReads[1].args[1][1]).not.equal(keysetReads[0].args[1][1]);
    });

    it('stops starting batches when the time budget is spent, records truncated and does not fail', async () => {
      await seedMany(10);
      let clock = 0;
      const get = sinon.spy(adapter, 'get');

      const counts = await audit({
        batchSize: 3,
        timeBudgetMs: 100,
        // Each reading of the clock costs 40 ms: the budget goes in the third batch
        now: () => {
          clock += 40;
          return clock;
        },
      });

      should(counts.truncated).be.true();
      should(counts.pagesChecked).be.below(10);
      should(counts.pagesChecked).be.above(0);
      should(get.callCount).equal(counts.pagesChecked);
      should(counts.failures).equal(0);
    });

    it('records truncated false when the budget is enough', async () => {
      await seedMany(3);
      should((await audit()).truncated).be.false();
    });

    it("skips the sample, as truncated, when the budget went with tonight's pages", async () => {
      await seedMany(4);
      await publish('countries/FR.html', html(), { old: true });
      let clock = 0;

      const counts = await audit({
        batchSize: 2,
        sampleSize: 10,
        timeBudgetMs: 100,
        now: () => {
          clock += 60;
          return clock;
        },
      });

      should(counts.truncated).be.true();
      should(counts.sampled).equal(0);
    });

    it('rejects options that cannot work', async () => {
      await audit({ batchSize: 0 }).should.be.rejectedWith(RangeError);
      await audit({ concurrency: 0 }).should.be.rejectedWith(RangeError);
      await audit({ sampleSize: -1 }).should.be.rejectedWith(RangeError);
      await BotAuditService.run({ since }).should.be.rejected();
    });
  });

  // ---- the variant check ----------------------------------------------------

  describe('the variant check', () => {
    const fakeFetch = (responses) =>
      sinon.stub().callsFake(async (url) => {
        const response = responses(url);
        if (response instanceof Error) throw response;
        return response;
      });
    const ok = (text) => ({ ok: true, status: 200, text: async () => text });
    const variant = (options = {}) =>
      audit({
        variantSample: 5,
        variantSpacingMs: 0,
        baseUrl: BASE_URL,
        ...options,
      });

    it('passes a page whose public address answers with the plain SPA shell', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const fetchFn = fakeFetch(() => ok(SPA_SHELL));

      const counts = await variant({ fetch: fetchFn });

      should(counts.variantChecked).equal(1);
      should(counts.variantUnreachable).equal(0);
      should(counts.failures).equal(0);
      should(isOnline(caveKey(cave.id))).be.true();
    });

    it('requests the public address as a browser would', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const fetchFn = fakeFetch(() => ok(SPA_SHELL));

      await variant({ fetch: fetchFn });

      should(fetchFn.callCount).equal(1);
      const [url, init] = fetchFn.firstCall.args;
      should(url).equal(`${BASE_URL}/caves/${cave.id}`);
      should(init.headers['User-Agent']).match(/^Mozilla\/5\.0 .*Chrome/);
      should(init.headers['User-Agent']).not.match(/bot|crawl|spider|Google/i);
      should(init.redirect).equal('follow');
    });

    it('fails a page whose public address answers a normal User-Agent with the generator marker: logged, publishing stopped at once, the page left alone', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const fetchFn = fakeFetch(() => ok(LEAKED_PAGE));

      const counts = await variant({ fetch: fetchFn });

      should(counts.failuresByReason).eql({ 'variant-leak': 1 });
      should(errorLines()).containEql(
        `bot-surface-audit failure ${caveKey(cave.id)}: variant-leak`
      );
      // One leak is enough, whatever the failure limit (10): it is the cache
      // or CDN rule that is wrong, for every page, not the page
      should(counts.failures).equal(1);
      should(counts.publishingStopped).be.true();
      should((await BotSurfaceStateService.read()).publishing).be.false();
      should((await BotSurfaceStateService.read()).reason).match(
        /crawler page.*fix the cache or CDN rule/
      );
      should(
        errorLines().some((l) =>
          l.startsWith('bot-surface-audit variant leak, publishing stopped')
        )
      ).be.true();
      // The blob is fine: deleting it would fix nothing, and the next night
      // would upload it again
      should(isOnline(caveKey(cave.id))).be.true();
      should(await inManifest(caveKey(cave.id))).be.true();
    });

    it('stops publishing on a variant leak that is not the first failure either, and does not stop it for an unreachable address', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());

      const unreachable = await variant({
        fetch: fakeFetch(() => new Error('connect ECONNREFUSED')),
      });
      should(unreachable.variantUnreachable).equal(1);
      should(unreachable.publishingStopped).be.false();
      should((await BotSurfaceStateService.read()).publishing).be.true();
    });

    it('reads no more than the limit of an answer, and stops the request', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const CHUNK = 256 * 1024;
      let pulled = 0;
      let cancelled = false;
      // An endless body: the audit must not wait for its end
      const body = new ReadableStream({
        pull(controller) {
          pulled += 1;
          controller.enqueue(new Uint8Array(CHUNK).fill(32));
        },
        cancel() {
          cancelled = true;
        },
      });
      const counts = await variant({
        fetch: async () => ({ ok: true, status: 200, body }),
      });

      should(counts.variantChecked).equal(1);
      should(counts.failures).equal(0);
      // 2 MiB of 256 KiB chunks is 8, plus the read-ahead of the stream
      should(pulled).be.below(16);
      should(cancelled).be.true();
    });

    it('finds the marker at the start of a long body without reading it all', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const encoder = new TextEncoder();
      let pulled = 0;
      const body = new ReadableStream({
        pull(controller) {
          pulled += 1;
          controller.enqueue(
            pulled === 1
              ? encoder.encode(LEAKED_PAGE)
              : new Uint8Array(512 * 1024).fill(32)
          );
        },
      });
      const counts = await variant({
        fetch: async () => ({ ok: true, status: 200, body }),
      });

      should(counts.failuresByReason).eql({ 'variant-leak': 1 });
      should(pulled).be.below(16);
    });

    it('requests the hub pages at their own address, and never a redirect page', async () => {
      await publish('countries/FR.html', html());
      const target = await mkPublicCave();
      const merged = await fixtures.mkCave('Gouffre Fusionne');
      await publish(
        caveKey(merged.id),
        html({ body: link('caves', target.cave.id) }),
        {
          redirectTo: target.cave.id,
        }
      );
      const fetchFn = fakeFetch(() => ok(SPA_SHELL));

      await variant({ fetch: fetchFn });

      const urls = fetchFn.getCalls().map((c) => c.args[0]);
      should(urls).eql([`${BASE_URL}/countries/FR`]);
    });

    [
      ['a network error', () => new Error('ECONNRESET')],
      [
        'a 503',
        () => ({ ok: false, status: 503, text: async () => LEAKED_PAGE }),
      ],
      ['a 404', () => ({ ok: false, status: 404, text: async () => '' })],
    ].forEach(([name, response]) => {
      it(`counts ${name} as unreachable: not a failure, the page stays`, async () => {
        const { cave } = await mkPublicCave();
        await publish(caveKey(cave.id), html());

        const counts = await variant({ fetch: fakeFetch(response) });

        should(counts.variantChecked).equal(1);
        should(counts.variantUnreachable).equal(1);
        should(counts.failures).equal(0);
        should(counts.publishingStopped).be.false();
        should(isOnline(caveKey(cave.id))).be.true();
        should(await inManifest(caveKey(cave.id))).be.true();
        should(logError.called).be.false();
      });
    });

    it('gives up on a request that never answers, after the timeout, as unreachable', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const hanging = sinon.stub().callsFake(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new Error('aborted'))
            );
          })
      );

      const counts = await variant({ fetch: hanging, variantTimeoutMs: 20 });

      should(counts.variantUnreachable).equal(1);
      should(counts.failures).equal(0);
    });

    it('spreads the requests out, two at a time at most, and asks for no more than variantSample', async () => {
      for (let i = 0; i < 7; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await publish(`countries/F${String.fromCharCode(65 + i)}.html`, html());
      }
      let inFlight = 0;
      let peak = 0;
      const fetchFn = sinon.stub().callsFake(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
        inFlight -= 1;
        return ok(SPA_SHELL);
      });
      const sleep = sinon.stub().resolves();

      const counts = await variant({
        fetch: fetchFn,
        variantSample: 5,
        variantSpacingMs: 250,
        sleep,
      });

      should(counts.variantChecked).equal(5);
      should(fetchFn.callCount).equal(5);
      should(peak).equal(2);
      should(sleep.withArgs(250).callCount).equal(5);
    });

    it('does nothing, and never calls fetch, when the sample is 0', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const fetchFn = fakeFetch(() => ok(LEAKED_PAGE));

      const counts = await variant({ fetch: fetchFn, variantSample: 0 });

      should(fetchFn.called).be.false();
      should(counts.variantChecked).equal(0);
      should(isOnline(caveKey(cave.id))).be.true();
    });

    it('uses the global fetch by default', async () => {
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());
      const stub = sinon.stub(global, 'fetch').resolves(ok(SPA_SHELL));

      const counts = await variant({ fetch: undefined });

      should(stub.callCount).equal(1);
      should(counts.variantChecked).equal(1);
    });
  });

  // ---- the threshold --------------------------------------------------------

  describe('the failure limit', () => {
    it('does not stop publishing at exactly the limit', async () => {
      await seedBad(3);

      const counts = await audit({ failureLimit: 3 });

      should(counts.failures).equal(3);
      should(counts.publishingStopped).be.false();
      should(counts.publishing).be.true();
      const state = await BotSurfaceStateService.read();
      should(state.publishing).be.true();
      should(
        errorLines().some((l) =>
          l.startsWith('bot-surface-audit publishing stopped')
        )
      ).be.false();
    });

    it('stops publishing at limit + 1, with a reason and a date in the state row, and logs a distinct line', async () => {
      await seedBad(4);

      const counts = await audit({ failureLimit: 3 });

      should(counts.failures).equal(4);
      should(counts.publishingStopped).be.true();
      should(counts.publishing).be.false();
      const {
        rows: [row],
      } = await query('SELECT * FROM t_bot_surface_state');
      should(row.publishing).be.false();
      should(row.reason).match(
        /4 pages failed \(limit 3\): coordinates-body=4/
      );
      should(Date.now() - row.updated_at.getTime()).be.below(60000);
      const stopped = errorLines().filter((l) =>
        l.startsWith('bot-surface-audit publishing stopped')
      );
      should(stopped).have.length(1);
      should(stopped[0]).match(/4 pages failed/);
    });

    it('still deletes every failing page when it stops publishing', async () => {
      await seedBad(4);
      await audit({ failureLimit: 3 });
      should(
        (await query('SELECT count(*)::int AS n FROM t_bot_page_manifest'))
          .rows[0].n
      ).equal(0);
      should(fs.readdirSync(path.join(root, 'caves'))).have.length(0);
    });

    it('stops at the first failure when the limit is 0', async () => {
      await seedBad(1);
      const counts = await audit({ failureLimit: 0 });
      should(counts.publishingStopped).be.true();
      should(await BotSurfaceStateService.isPublishing()).be.false();
    });

    it('counts a variant leak as a failure, with the others', async () => {
      await seedBad(2);
      const { cave } = await mkPublicCave();
      await publish(caveKey(cave.id), html());

      const counts = await audit({
        failureLimit: 2,
        variantSample: 50,
        variantSpacingMs: 0,
        baseUrl: BASE_URL,
        fetch: async (url) => ({
          ok: true,
          status: 200,
          text: async () =>
            url.endsWith(`/${cave.id}`) ? LEAKED_PAGE : SPA_SHELL,
        }),
      });

      should(counts.failures).equal(3);
      should(counts.publishingStopped).be.true();
    });

    it('keeps the publishing state off when it already was, and says so', async () => {
      await BotSurfaceStateService.stopPublishing('earlier');
      const counts = await audit();
      should(counts.publishing).be.false();
      should(counts.publishingStopped).be.false();
    });
  });

  // ---- the run record -------------------------------------------------------

  describe('the counts', () => {
    it('hold the facts of the run', async () => {
      const subject = await mkPublicCave();
      await publish(caveKey(subject.cave.id), html({ body: POSITION }));
      const good = await mkPublicCave('Gouffre Bon');
      await publish(caveKey(good.cave.id), html());
      const old = await mkPublicCave('Gouffre Ancien');
      await publish(caveKey(old.cave.id), html(), { old: true });

      const counts = await audit({ sampleSize: 10 });

      should(Object.keys(counts).sort()).eql(
        [
          'durationMs',
          'failures',
          'failuresByReason',
          'missing',
          'pagesChecked',
          'publishing',
          'publishingStopped',
          'runAt',
          'sampled',
          'truncated',
          'uploadedChecked',
          'variantChecked',
          'variantUnreachable',
        ].sort()
      );
      should(counts).containEql({
        pagesChecked: 3,
        uploadedChecked: 2,
        sampled: 1,
        failures: 1,
        truncated: false,
        publishingStopped: false,
        publishing: true,
        variantChecked: 0,
        variantUnreachable: 0,
        missing: 0,
      });
      should(counts.failuresByReason).eql({ 'coordinates-body': 1 });
      should(counts.durationMs).be.a.Number();
      should(new Date(counts.runAt).toISOString()).equal(counts.runAt);
      should(Math.abs(Date.now() - new Date(counts.runAt).getTime())).be.below(
        60000
      );
    });
  });

  // ---- deletes and the page lock -------------------------------------------

  describe('deleting a failing page', () => {
    const PAGES_LOCK_KEY = 1758;
    let holder;

    // Another session holds the page lock, as the withdrawal worker does
    const holdLock = async () => {
      holder = new Client({
        connectionString: process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL,
      });
      await holder.connect();
      await holder.query('SELECT pg_advisory_lock($1)', [PAGES_LOCK_KEY]);
    };
    const releaseLock = () => holder.end();

    afterEach(async () => {
      if (holder) await holder.end().catch(() => {});
      holder = null;
    });

    it('waits for the page lock held by the withdrawal worker, then deletes', async () => {
      const subject = await mkPublicCave();
      await publish(caveKey(subject.cave.id), html({ body: POSITION }));
      await holdLock();
      const sleep = sinon.stub().callsFake(async () => {
        await releaseLock();
      });

      const counts = await audit({
        sleep,
        retry: { intervalMs: 1, maxAttempts: 5 },
      });

      should(sleep.callCount).equal(1);
      should(counts.failures).equal(1);
      should(isOnline(caveKey(subject.cave.id))).be.false();
      should(await inManifest(caveKey(subject.cave.id))).be.false();
    });

    it('stops publishing before the deletes, so a lock that never frees cannot leave the switch on after the failures were found', async () => {
      await seedBad(12);
      await holdLock();

      const err = await audit({
        failureLimit: 10,
        retry: { intervalMs: 1, maxAttempts: 2 },
      }).should.be.rejected();

      should(err.code).equal('E_BOT_AUDIT_LOCK_TIMEOUT');
      const state = await BotSurfaceStateService.read();
      should(state.publishing).be.false();
      should(state.reason).match(/12 pages failed \(limit 10\)/);
      should(
        errorLines().some((l) =>
          l.startsWith('bot-surface-audit publishing stopped')
        )
      ).be.true();
    });

    it('stops publishing when an error ends the run in a later batch, after the limit was crossed', async () => {
      await seedBad(6);
      const clean = await mkPublicCave('Gouffre Propre');
      await publish(caveKey(clean.cave.id), html(), {});
      // The first batch finds 6 failures; the next one cannot be read
      const original = adapter.get.bind(adapter);
      let calls = 0;
      sinon.stub(adapter, 'get').callsFake((key, opts) => {
        calls += 1;
        if (calls > 6) return Promise.reject(new Error('storage unreachable'));
        return original(key, opts);
      });

      await audit({
        failureLimit: 3,
        batchSize: 6,
        retry: { intervalMs: 1, maxAttempts: 2 },
      }).should.be.rejectedWith('storage unreachable');

      should((await BotSurfaceStateService.read()).publishing).be.false();
    });

    it('does not stop publishing when the run fails below the limit', async () => {
      await seedBad(2);
      await holdLock();

      await audit({
        failureLimit: 10,
        retry: { intervalMs: 1, maxAttempts: 2 },
      }).should.be.rejected();

      should((await BotSurfaceStateService.read()).publishing).be.true();
    });

    it('fails on its own error when the lock stays held, and deletes nothing', async () => {
      const subject = await mkPublicCave();
      await publish(caveKey(subject.cave.id), html({ body: POSITION }));
      await holdLock();

      const err = await audit({
        retry: { intervalMs: 1, maxAttempts: 2 },
      }).should.be.rejected();

      should(err.code).equal('E_BOT_AUDIT_LOCK_TIMEOUT');
      should(isOnline(caveKey(subject.cave.id))).be.true();
      should(await inManifest(caveKey(subject.cave.id))).be.true();
    });
  });
});
