const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const v8 = require('v8');
const should = require('should');

// Ids no fixture uses. A cave, a massif and an organization may share an id.
const FIRST_ID = 9000000;
const DAY = 24 * 3600;
const VERSION = 5;

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

describe('BotPageGeneratorService', () => {
  let Generator;
  let LocalStorageAdapter;
  let root;
  let adapter;
  let puts;
  let putOptions;
  let deletes;
  let records;

  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    Generator = require('../../../api/services/bot/BotPageGeneratorService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
  });

  // The rows v_bot_page would return, read by keyset like the view
  const record = (entityType, id, extra = {}) => ({
    entity_type: entityType,
    entity_id: id,
    language: 'fra',
    lastmod: new Date('2026-01-01T00:00:00Z'),
    page: { id, name: `${entityType} ${id}`, language: 'fra', ...extra },
  });

  const readBatch = async (entityType, afterId, limit) =>
    records
      .filter((r) => r.entity_type === entityType && r.entity_id > afterId)
      .sort((a, b) => a.entity_id - b.entity_id)
      .slice(0, limit);

  const run = (options = {}) =>
    Generator.run({
      adapter,
      readBatch,
      baseUrl: 'https://example.test/ui',
      ...options,
    });

  const keys = async () => {
    const found = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const key of adapter.list()) found.push(key);
    return found.sort();
  };

  const manifestPaths = async () =>
    (
      await query('SELECT path FROM t_bot_page_manifest ORDER BY path')
    ).rows.map((r) => r.path);

  const manifestRow = async (p) =>
    (await query('SELECT * FROM t_bot_page_manifest WHERE path = $1', [p]))
      .rows[0];

  // Wraps the adapter to record what the generator asks of it
  const recordingAdapter = (inner, hooks = {}) => ({
    async put(key, html, options) {
      if (hooks.beforePut) await hooks.beforePut(key);
      await inner.put(key, html, options);
      puts.push(key);
      putOptions[key] = options;
    },
    async delete(key) {
      if (hooks.beforeDelete) await hooks.beforeDelete(key);
      await inner.delete(key);
      deletes.push(key);
    },
    list: () => inner.list(),
  });

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-gen-'));
    puts = [];
    putOptions = {};
    deletes = [];
    adapter = recordingAdapter(new LocalStorageAdapter(root));
    records = [
      record('cave', FIRST_ID + 1),
      record('cave', FIRST_ID + 2),
      record('cave', FIRST_ID + 3),
      record('cave', FIRST_ID + 4),
      record('cave', FIRST_ID + 5),
      record('massif', FIRST_ID + 1),
      record('organization', FIRST_ID + 1, { url: null }),
    ];
    await query('TRUNCATE t_bot_page_manifest');
  });

  afterEach(async () => {
    fs.rmSync(root, { recursive: true, force: true });
    await query('TRUNCATE t_bot_page_manifest');
  });

  const expectedKeys = () =>
    [
      '404.html',
      ...records.map(
        (r) =>
          `${
            { cave: 'caves', massif: 'massifs', organization: 'organizations' }[
              r.entity_type
            ]
          }/${r.entity_id}.html`
      ),
    ].sort();

  describe('a run over the fixtures', () => {
    it('writes the expected files, one per record, and 404.html', async () => {
      const summary = await run({ batchSize: 2 });

      should(await keys()).deepEqual(expectedKeys());
      should(summary.uploaded).equal(8);
      should(summary.unchanged).equal(0);
      should(summary.deleted).equal(0);
      should(summary.byType.cave.uploaded).equal(5);
      should(summary.byType.massif.uploaded).equal(1);
      should(summary.byType.organization.uploaded).equal(1);
      const cave = fs.readFileSync(
        path.join(root, `caves/${FIRST_ID + 2}.html`),
        'utf8'
      );
      should(cave).containEql(`<h1>cave ${FIRST_ID + 2}</h1>`);
      should(cave).containEql(`https://example.test/ui/caves/${FIRST_ID + 2}`);
    });

    it('reads each page once whatever the batch size (no row skipped or repeated at a batch boundary)', async () => {
      await run({ batchSize: 2 });
      should(puts.sort()).deepEqual(expectedKeys());
    });

    it('records every page in the manifest with the sha256 of the file, and the type, id, lastmod', async () => {
      await run({ batchSize: 3 });

      should(await manifestPaths()).deepEqual(expectedKeys());
      const key = `caves/${FIRST_ID + 3}.html`;
      const row = await manifestRow(key);
      should(row.entity_type).equal('cave');
      should(row.entity_id).equal(FIRST_ID + 3);
      should(row.content_hash).equal(
        sha256(fs.readFileSync(path.join(root, key), 'utf8'))
      );
      should(row.lastmod.toISOString()).equal('2026-01-01T00:00:00.000Z');
      should(row.published_at).be.instanceOf(Date);

      const extra = await manifestRow('404.html');
      should(extra.entity_type).equal('static');
      should(extra.entity_id).be.null();
      should(extra.lastmod).be.null();
    });

    it('publishes 404.html with noindex', async () => {
      await run();
      const html = fs.readFileSync(path.join(root, '404.html'), 'utf8');
      should(html).containEql('<meta name="robots" content="noindex">');
    });

    it('keeps the three types apart when they share an id', async () => {
      await run();
      for (const dir of ['caves', 'massifs', 'organizations']) {
        const html = fs.readFileSync(
          path.join(root, `${dir}/${FIRST_ID + 1}.html`),
          'utf8'
        );
        const type = {
          caves: 'cave',
          massifs: 'massif',
          organizations: 'organization',
        }[dir];
        should(html).containEql(`<h1>${type} ${FIRST_ID + 1}</h1>`);
      }
    });

    it('bounds the uploads in flight to the concurrency, and does use it', async () => {
      let inFlight = 0;
      let peak = 0;
      adapter = recordingAdapter(new LocalStorageAdapter(root), {
        beforePut: async () => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise((resolve) => {
            setTimeout(resolve, 15);
          });
          inFlight -= 1;
        },
      });
      await run({ concurrency: 3 });
      should(peak).equal(3);
    });

    it('refuses to run without an adapter', async () => {
      await Generator.run({ readBatch }).should.be.rejectedWith(/adapter/);
    });

    it('refuses a concurrency or a batch size that is not a positive integer, before anything is published', async () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const bad of [NaN, 0, 2.5, '4']) {
        // eslint-disable-next-line no-await-in-loop
        await run({ concurrency: bad }).should.be.rejectedWith(RangeError, {
          message: /concurrency/,
        });
        // eslint-disable-next-line no-await-in-loop
        await run({ batchSize: bad }).should.be.rejectedWith(RangeError, {
          message: /batchSize/,
        });
      }
      should(puts).be.empty();
      should(await keys()).deepEqual([]);
      should(await manifestPaths()).deepEqual([]);
    });
  });

  describe('one run at a time', () => {
    // Holds the generator lock on its own connection, as another run would
    const holdingTheLock = (fn) =>
      sails.getDatastore().leaseConnection(async (db) => {
        await CommonService.query(
          'SELECT pg_advisory_lock($1)',
          [Generator.LOCK_KEY],
          db
        );
        try {
          return await fn();
        } finally {
          await CommonService.query(
            'SELECT pg_advisory_unlock($1)',
            [Generator.LOCK_KEY],
            db
          );
        }
      });

    it('rejects a run while another holds the lock, and publishes nothing', async () => {
      await holdingTheLock(async () => {
        await run().should.be.rejectedWith({ code: 'E_BOT_PAGES_RUNNING' });
      });
      should(puts).be.empty();
      should(await keys()).deepEqual([]);
      should(await manifestPaths()).deepEqual([]);
    });

    it('rejects a run started while one is in progress, which still finishes', async () => {
      let second;
      await run({
        batchSize: 2,
        onBatch: async () => {
          // The outcome is captured at once: the rejection comes while the
          // first run is still going, and must not go unhandled until then
          if (!second) {
            second = run().then(
              () => null,
              (error) => error
            );
          }
        },
      });
      should(await second).have.property('code', 'E_BOT_PAGES_RUNNING');
      should(await manifestPaths()).deepEqual(await keys());
    });

    // A session-level lock is re-entrant on the session that holds it, so a
    // lock left behind on a pooled connection would not stop the next run that
    // happens to get the same connection: look at pg_locks instead
    const lockHolders = async () =>
      (
        await query(
          `SELECT count(*)::int AS n FROM pg_locks
            WHERE locktype = 'advisory' AND objid = $1 AND granted`,
          [Generator.LOCK_KEY]
        )
      ).rows[0].n;

    it('releases the lock when a run ends, whether it succeeds or fails', async () => {
      await run();
      should(await lockHolders()).equal(0);
      await run({
        readBatch: async () => {
          throw new Error('view down');
        },
      }).should.be.rejectedWith('view down');
      should(await lockHolders()).equal(0);
      await run();
      should(await keys()).not.be.empty();
    });
  });

  describe('a second run', () => {
    it('uploads and deletes nothing when no data changed', async () => {
      await run({ batchSize: 2 });
      puts.length = 0;

      const summary = await run({ batchSize: 2 });

      should(puts).deepEqual([]);
      should(deletes).deepEqual([]);
      should(summary.uploaded).equal(0);
      should(summary.unchanged).equal(8);
      should(await keys()).deepEqual(expectedKeys());
    });

    it('does not upload a page whose only change is lastmod: the HTML decides, not the hint', async () => {
      await run();
      puts.length = 0;
      records = records.map((r) => ({
        ...r,
        lastmod: new Date('2030-06-01T00:00:00Z'),
      }));

      await run();

      should(puts).deepEqual([]);
    });
  });

  describe('a change', () => {
    it('re-uploads exactly the page that changed, and updates its manifest row', async () => {
      await run();
      const before = await manifestRow(`caves/${FIRST_ID + 4}.html`);
      puts.length = 0;
      records.find(
        (r) => r.entity_id === FIRST_ID + 4 && r.entity_type === 'cave'
      ).page.depth = 321;

      await run({ batchSize: 2 });

      should(puts).deepEqual([`caves/${FIRST_ID + 4}.html`]);
      const key = `caves/${FIRST_ID + 4}.html`;
      const after = await manifestRow(key);
      should(after.content_hash).not.equal(before.content_hash);
      should(after.content_hash).equal(
        sha256(fs.readFileSync(path.join(root, key), 'utf8'))
      );
      should(fs.readFileSync(path.join(root, key), 'utf8')).containEql('321 m');
    });

    it('publishes a record that enters the view', async () => {
      await run();
      puts.length = 0;
      records.push(record('cave', FIRST_ID + 6));

      await run({ batchSize: 2 });

      should(puts).deepEqual([`caves/${FIRST_ID + 6}.html`]);
      should(await manifestPaths()).deepEqual(expectedKeys());
    });
  });

  describe('a record that left the view', () => {
    const drop = (entityType, id) => {
      records = records.filter(
        (r) => !(r.entity_type === entityType && r.entity_id === id)
      );
    };

    it('has its file and its manifest row deleted, and nothing else is touched', async () => {
      await run();
      puts.length = 0;
      drop('cave', FIRST_ID + 3);

      const summary = await run({ batchSize: 2 });

      should(deletes).deepEqual([`caves/${FIRST_ID + 3}.html`]);
      should(puts).deepEqual([]);
      should(summary.deleted).equal(1);
      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(expectedKeys());
      should(await manifestRow(`caves/${FIRST_ID + 3}.html`)).be.undefined();
    });

    it('is found wherever it sits among the batches: the first, a middle one and the tail after the last row read', async () => {
      await run();
      drop('cave', FIRST_ID + 1);
      drop('cave', FIRST_ID + 3);
      drop('cave', FIRST_ID + 5);

      await run({ batchSize: 2 });

      should(deletes.sort()).deepEqual([
        `caves/${FIRST_ID + 1}.html`,
        `caves/${FIRST_ID + 3}.html`,
        `caves/${FIRST_ID + 5}.html`,
      ]);
      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(expectedKeys());
    });

    it('is found after the last row of a short final batch', async () => {
      await run();
      drop('cave', FIRST_ID + 4);
      drop('cave', FIRST_ID + 5);

      // Batches of 2: [1, 2] then [3], a short batch with two paths after it
      await run({ batchSize: 2 });

      should(deletes.sort()).deepEqual([
        `caves/${FIRST_ID + 4}.html`,
        `caves/${FIRST_ID + 5}.html`,
      ]);
      should(await manifestPaths()).deepEqual(expectedKeys());
    });

    it('is deleted when its whole type left the view, and the other types keep their pages', async () => {
      await run();
      records = records.filter((r) => r.entity_type !== 'cave');

      await run();

      should(await keys()).deepEqual([
        '404.html',
        `massifs/${FIRST_ID + 1}.html`,
        `organizations/${FIRST_ID + 1}.html`,
      ]);
      should(await manifestPaths()).deepEqual(await keys());
    });

    it('does not delete the page of another type that has the same id', async () => {
      await run();
      drop('massif', FIRST_ID + 1);

      await run();

      should(deletes).deepEqual([`massifs/${FIRST_ID + 1}.html`]);
      should(await keys()).containEql(`caves/${FIRST_ID + 1}.html`);
    });

    it('is deleted from the manifest even when the file is already gone', async () => {
      await run();
      fs.rmSync(path.join(root, `caves/${FIRST_ID + 2}.html`));
      drop('cave', FIRST_ID + 2);

      await run();

      should(await manifestRow(`caves/${FIRST_ID + 2}.html`)).be.undefined();
    });

    it('removes a static extra the run no longer produces', async () => {
      await run();
      await adapter.put('old-extra.html', 'x');
      await query(
        `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash)
         VALUES ('old-extra.html', 'static', NULL, 'abc')`
      );

      await run();

      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(expectedKeys());
    });
  });

  describe('a failure halfway', () => {
    it('leaves the manifest equal to what the adapter holds, after a failed upload', async () => {
      let count = 0;
      adapter = recordingAdapter(new LocalStorageAdapter(root), {
        beforePut: async () => {
          count += 1;
          if (count === 5) throw new Error('storage unavailable');
        },
      });

      await run({ concurrency: 2, batchSize: 2 }).should.be.rejectedWith(
        'storage unavailable'
      );

      const held = await keys();
      should(held.length).be.within(1, 7);
      should(await manifestPaths()).deepEqual(held);
    });

    it('then finishes the job on the next run, uploading only what is missing', async () => {
      let count = 0;
      const failing = recordingAdapter(new LocalStorageAdapter(root), {
        beforePut: async () => {
          count += 1;
          if (count === 5) throw new Error('storage unavailable');
        },
      });
      adapter = failing;
      await run({ concurrency: 1 }).should.be.rejected();
      const published = (await keys()).length;
      puts.length = 0;
      adapter = recordingAdapter(new LocalStorageAdapter(root));

      await run({ concurrency: 1 });

      should(puts.length).equal(8 - published);
      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(expectedKeys());
    });

    it('leaves the manifest equal to the adapter after a failed delete: the row is kept, so the delete is retried', async () => {
      await run();
      records = records.filter((r) => r.entity_type !== 'cave');
      let count = 0;
      adapter = recordingAdapter(new LocalStorageAdapter(root), {
        beforeDelete: async () => {
          count += 1;
          if (count === 3) throw new Error('delete refused');
        },
      });

      await run({ concurrency: 1 }).should.be.rejectedWith('delete refused');

      should(await manifestPaths()).deepEqual(await keys());
      should((await keys()).length).equal(8 - 2);

      adapter = recordingAdapter(new LocalStorageAdapter(root));
      await run();
      should(await manifestPaths()).deepEqual(expectedKeys());
      should(await keys()).deepEqual(expectedKeys());
    });

    it('lets the uploads in flight finish before it rejects', async () => {
      let started = 0;
      const inner = new LocalStorageAdapter(root);
      adapter = recordingAdapter(inner, {
        beforePut: async (key) => {
          started += 1;
          if (started === 1) throw new Error('first upload fails');
          // A slower sibling, started after the failure was not yet known
          await new Promise((resolve) => {
            setTimeout(resolve, 30);
          });
          return key;
        },
      });

      await run({ concurrency: 3 }).should.be.rejectedWith(
        'first upload fails'
      );

      should(await manifestPaths()).deepEqual(await keys());
      should((await keys()).length).be.aboveOrEqual(1);
    });

    it('rejects when the view cannot be read, leaving the manifest as it was', async () => {
      await run();
      const before = await manifestPaths();
      await Generator.run({
        adapter,
        readBatch: async () => {
          throw new Error('statement timeout');
        },
      }).should.be.rejectedWith('statement timeout');
      should(await manifestPaths()).deepEqual(before);
      should(await keys()).deepEqual(before);
    });
  });

  describe('reading v_bot_page', () => {
    const created = { organization: [], name: [] };
    const purge = async (model, ids) => {
      // histo_delete() makes the first DELETE of a live row a soft delete
      await model.destroy({ id: ids });
      await model.destroy({ id: ids });
    };

    afterEach(async () => {
      await query('TRUNCATE t_bot_admission, t_bot_text_scan');
      await query('UPDATE t_bot_config SET pattern_version = 0');
      await purge(TName, created.name);
      await purge(TGrotto, created.organization);
      Object.values(created).forEach((ids) => ids.splice(0));
    });

    it('publishes the pages of the view by default, and nothing from an empty view', async () => {
      await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
      const old = new Date(Date.now() - 100 * DAY * 1000);
      const organization = await TGrotto.create({
        author: 1,
        city: 'Lyon',
        url: 'https://example.org/club',
        dateInscription: old,
        dateReviewed: old,
      }).fetch();
      created.organization.push(organization.id);
      const name = await TName.create({
        author: 1,
        name: 'Spéléo Club Générateur',
        language: 'fra',
        isMain: true,
        grotto: organization.id,
        dateInscription: old,
        dateReviewed: old,
      }).fetch();
      created.name.push(name.id);
      await query(
        `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
         SELECT 't_name', id, md5(COALESCE(name, '')), $2, false FROM t_name WHERE id = $1`,
        [name.id, VERSION]
      );
      await query(
        `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
         VALUES ('organization', $1, now() - interval '60 days')`,
        [organization.id]
      );

      const summary = await Generator.run({
        adapter,
        baseUrl: 'https://example.test/ui',
      });

      const key = `organizations/${organization.id}.html`;
      should(await keys()).deepEqual(['404.html', key]);
      should(summary.byType.organization.uploaded).equal(1);
      const html = fs.readFileSync(path.join(root, key), 'utf8');
      should(html).containEql('Spéléo Club Générateur');
      should(html).containEql('rel="nofollow ugc"');
      // The language tags are read from t_language: fra is published as fr
      should(html).containEql('<html lang="fr">');
      should(await manifestPaths()).deepEqual(await keys());

      // The organization leaves the view: its page goes
      await query('TRUNCATE t_bot_admission');
      await Generator.run({ adapter });
      should(await keys()).deepEqual(['404.html']);
      should(await manifestPaths()).deepEqual(['404.html']);
    });
  });

  describe('redirect pages', () => {
    const TARGET = (type, id) => `https://example.test/ui/${type}s/${id}`;
    let redirects;
    const readRedirects = async (entityType) =>
      redirects
        .filter((r) => r.entity_type === entityType)
        .sort((a, b) => a.entity_id - b.entity_id)
        .map(({ entity_id: id, target_id: target }) => ({
          entity_id: id,
          target_id: target,
        }));
    const redirect = (entityType, id, target) => ({
      entity_type: entityType,
      entity_id: id,
      target_id: target,
    });
    const runWithRedirects = (options = {}) =>
      run({ readRedirects, ...options });
    const metadataOf = (key) => {
      const file = path.join(
        root,
        `${key}${LocalStorageAdapter.METADATA_SUFFIX}`
      );
      return fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, 'utf8'))
        : null;
    };
    const OLD = FIRST_ID + 50;

    beforeEach(() => {
      redirects = [];
    });

    it('publishes a page at the old path, pointing at the target, with the target as redirectto', async () => {
      redirects = [redirect('cave', OLD, FIRST_ID + 1)];

      const summary = await runWithRedirects();

      const key = `caves/${OLD}.html`;
      const html = fs.readFileSync(path.join(root, key), 'utf8');
      should(html).containEql(
        `<meta http-equiv="refresh" content="0; url=${TARGET('cave', FIRST_ID + 1)}">`
      );
      should(html).containEql(
        `<link rel="canonical" href="${TARGET('cave', FIRST_ID + 1)}">`
      );
      should(html).containEql('<meta name="robots" content="noindex">');
      should(putOptions[key]).deepEqual({
        metadata: { redirectto: TARGET('cave', FIRST_ID + 1) },
      });
      should(metadataOf(key)).deepEqual({
        redirectto: TARGET('cave', FIRST_ID + 1),
      });
      should(await keys()).deepEqual([...expectedKeys(), key].sort());
      should(summary.byType.cave.uploaded).equal(6);
    });

    it('records it in the manifest as a page of the old record, with the hash of the file', async () => {
      redirects = [redirect('massif', OLD, FIRST_ID + 1)];
      await runWithRedirects();

      const key = `massifs/${OLD}.html`;
      const row = await manifestRow(key);
      should(row.entity_type).equal('massif');
      should(row.entity_id).equal(OLD);
      should(row.content_hash).equal(
        sha256(fs.readFileSync(path.join(root, key), 'utf8'))
      );
      should(await manifestPaths()).deepEqual(await keys());
    });

    it('does not publish it again when nothing changed', async () => {
      redirects = [redirect('organization', OLD, FIRST_ID + 1)];
      await runWithRedirects();
      puts.length = 0;
      deletes.length = 0;

      const summary = await runWithRedirects();

      should(puts).deepEqual([]);
      should(deletes).deepEqual([]);
      should(summary.uploaded).equal(0);
    });

    it('publishes it again, with the new redirectto, when the target changes', async () => {
      redirects = [redirect('cave', OLD, FIRST_ID + 1)];
      await runWithRedirects();
      puts.length = 0;
      redirects = [redirect('cave', OLD, FIRST_ID + 2)];

      await runWithRedirects();

      should(puts).deepEqual([`caves/${OLD}.html`]);
      should(metadataOf(`caves/${OLD}.html`)).deepEqual({
        redirectto: TARGET('cave', FIRST_ID + 2),
      });
      should(
        fs.readFileSync(path.join(root, `caves/${OLD}.html`), 'utf8')
      ).containEql(TARGET('cave', FIRST_ID + 2));
    });

    it('keeps the redirects of the three types apart when they share an id', async () => {
      redirects = [
        redirect('cave', OLD, FIRST_ID + 1),
        redirect('massif', OLD, FIRST_ID + 1),
        redirect('organization', OLD, FIRST_ID + 1),
      ];
      await runWithRedirects();
      ['cave', 'massif', 'organization'].forEach((type) => {
        const key = `${type === 'organization' ? 'organizations' : `${type}s`}/${OLD}.html`;
        should(fs.readFileSync(path.join(root, key), 'utf8')).containEql(
          TARGET(type, FIRST_ID + 1)
        );
      });
    });

    it('is deleted, with its metadata and its manifest row, when it is no longer produced, and nothing else is touched', async () => {
      redirects = [
        redirect('cave', OLD, FIRST_ID + 1),
        redirect('cave', OLD + 1, FIRST_ID + 2),
      ];
      await runWithRedirects();
      deletes.length = 0;
      puts.length = 0;
      redirects = [redirect('cave', OLD + 1, FIRST_ID + 2)];

      await runWithRedirects();

      should(deletes).deepEqual([`caves/${OLD}.html`]);
      should(puts).deepEqual([]);
      should(metadataOf(`caves/${OLD}.html`)).be.null();
      should(await manifestRow(`caves/${OLD}.html`)).be.undefined();
      should(await keys()).deepEqual(
        [...expectedKeys(), `caves/${OLD + 1}.html`].sort()
      );
      should(await manifestPaths()).deepEqual(await keys());
    });

    it('is found wherever it sits among the batches, including after the last page of the view', async () => {
      // Pages are FIRST_ID+1..+5; with a batch of 2 the batches end at +2 and +4
      const ids = [
        FIRST_ID + 3, // also a page of the view, inside a batch
        FIRST_ID + 6, // after the last page of the type
        FIRST_ID + 9000,
      ];
      redirects = ids.map((id) => redirect('cave', id, FIRST_ID + 1));
      await runWithRedirects({ batchSize: 2 });
      const present = ids.map((id) => `caves/${id}.html`);
      // FIRST_ID+3 is a page of the view: the page wins
      should(await keys()).deepEqual(
        [...expectedKeys(), ...present.slice(1)].sort()
      );
      redirects = [];
      await runWithRedirects({ batchSize: 2 });
      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(await keys());
    });

    it('yields to a page: an id both in the view and in v_bot_redirect is published as the page', async () => {
      redirects = [redirect('cave', FIRST_ID + 1, FIRST_ID + 2)];
      await runWithRedirects();
      const html = fs.readFileSync(
        path.join(root, `caves/${FIRST_ID + 1}.html`),
        'utf8'
      );
      should(html).not.containEql('http-equiv="refresh"');
      should(metadataOf(`caves/${FIRST_ID + 1}.html`)).be.null();
    });

    it('is replaced by the page when the record comes back, and the redirectto is gone', async () => {
      redirects = [redirect('cave', FIRST_ID + 9, FIRST_ID + 1)];
      await runWithRedirects();
      should(metadataOf(`caves/${FIRST_ID + 9}.html`)).not.be.null();

      redirects = [];
      records.push(record('cave', FIRST_ID + 9));
      await runWithRedirects();

      should(metadataOf(`caves/${FIRST_ID + 9}.html`)).be.null();
      should(
        fs.readFileSync(path.join(root, `caves/${FIRST_ID + 9}.html`), 'utf8')
      ).not.containEql('http-equiv="refresh"');
      should(putOptions[`caves/${FIRST_ID + 9}.html`]).be.undefined();
    });

    it('replaces the page of a record that is merged', async () => {
      await runWithRedirects();
      records = records.filter((r) => r.entity_id !== FIRST_ID + 2);
      redirects = [redirect('cave', FIRST_ID + 2, FIRST_ID + 1)];

      await runWithRedirects();

      const key = `caves/${FIRST_ID + 2}.html`;
      should(fs.readFileSync(path.join(root, key), 'utf8')).containEql(
        'http-equiv="refresh"'
      );
      should(metadataOf(key)).deepEqual({
        redirectto: TARGET('cave', FIRST_ID + 1),
      });
    });

    it('leaves the manifest equal to the adapter when its upload fails, and finishes on the next run', async () => {
      redirects = [
        redirect('cave', OLD, FIRST_ID + 1),
        redirect('cave', OLD + 1, FIRST_ID + 1),
      ];
      adapter = recordingAdapter(new LocalStorageAdapter(root), {
        beforePut: (key) => {
          if (key === `caves/${OLD}.html`) throw new Error('503');
        },
      });

      await runWithRedirects({ concurrency: 1 }).should.be.rejectedWith('503');
      should(await manifestPaths()).deepEqual(await keys());
      should(await manifestRow(`caves/${OLD}.html`)).be.undefined();

      adapter = recordingAdapter(new LocalStorageAdapter(root));
      await runWithRedirects();
      should(await keys()).deepEqual(
        [...expectedKeys(), `caves/${OLD}.html`, `caves/${OLD + 1}.html`].sort()
      );
      should(await manifestPaths()).deepEqual(await keys());
    });

    it('leaves the manifest equal to the adapter when its delete fails: the row is kept, so the delete is retried', async () => {
      redirects = [redirect('cave', OLD, FIRST_ID + 1)];
      await runWithRedirects();
      redirects = [];
      adapter = recordingAdapter(new LocalStorageAdapter(root), {
        beforeDelete: () => {
          throw new Error('503');
        },
      });

      await runWithRedirects().should.be.rejectedWith('503');
      should(await manifestRow(`caves/${OLD}.html`)).not.be.undefined();
      should(await manifestPaths()).deepEqual(await keys());

      adapter = recordingAdapter(new LocalStorageAdapter(root));
      await runWithRedirects();
      should(await keys()).deepEqual(expectedKeys());
      should(await manifestPaths()).deepEqual(await keys());
    });
  });

  describe('redirect pages from v_bot_redirect', () => {
    const created = { organization: [], name: [] };
    const purge = async (model, ids) => {
      // histo_delete() makes the first DELETE of a live row a soft delete
      await model.destroy({ id: ids });
      await model.destroy({ id: ids });
    };

    afterEach(async () => {
      await query('TRUNCATE t_bot_admission, t_bot_text_scan');
      await query('UPDATE t_bot_config SET pattern_version = 0');
      await purge(TName, created.name);
      await purge(TGrotto, created.organization);
      Object.values(created).forEach((ids) => ids.splice(0));
    });

    it('points the first record of a two-step merge chain at the final published target', async () => {
      await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
      const old = new Date(Date.now() - 100 * DAY * 1000);
      const organization = async (extra = {}, name = null) => {
        const row = await TGrotto.create({
          author: 1,
          city: 'Lyon',
          dateInscription: old,
          dateReviewed: old,
          ...extra,
        }).fetch();
        created.organization.push(row.id);
        if (name) {
          const n = await TName.create({
            author: 1,
            name,
            language: 'fra',
            isMain: true,
            grotto: row.id,
            dateInscription: old,
            dateReviewed: old,
          }).fetch();
          created.name.push(n.id);
          await query(
            `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
             SELECT 't_name', id, md5(COALESCE(name, '')), $2, false FROM t_name WHERE id = $1`,
            [n.id, VERSION]
          );
        }
        await query(
          `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
           VALUES ('organization', $1, now() - interval '60 days')`,
          [row.id]
        );
        return row;
      };
      // C was merged into B, which was merged into A, the only one still published
      const final = await organization({}, 'Club final');
      const middle = await organization({
        isDeleted: true,
        redirectTo: final.id,
      });
      const first = await organization({
        isDeleted: true,
        redirectTo: middle.id,
      });

      await Generator.run({ adapter, baseUrl: 'https://example.test/ui' });

      const finalUrl = `https://example.test/ui/organizations/${final.id}`;
      const read = (id) =>
        fs.readFileSync(path.join(root, `organizations/${id}.html`), 'utf8');
      [first.id, middle.id].forEach((id) => {
        const html = read(id);
        should(html).containEql(
          `<meta http-equiv="refresh" content="0; url=${finalUrl}">`
        );
        should(html).containEql(`<link rel="canonical" href="${finalUrl}">`);
        should(html).not.containEql(`organizations/${middle.id}">`);
        should(putOptions[`organizations/${id}.html`]).deepEqual({
          metadata: { redirectto: finalUrl },
        });
      });
      should(read(final.id)).not.containEql('http-equiv="refresh"');
      should(await manifestPaths()).deepEqual(await keys());
    });
  });

  describe('memory', () => {
    // Fixed ceiling for the live heap that the generator retains while it
    // runs over a large synthetic view, above the heap before it started.
    const CEILING_MB = 32;
    const PAGES = 10000;
    const gc = (() => {
      v8.setFlagsFromString('--expose-gc');
      return vm.runInNewContext('gc');
    })();
    const liveHeapMb = () => {
      gc();
      return process.memoryUsage().heapUsed / 1024 / 1024;
    };

    // ~6 KB of description per cave, produced on demand and never kept
    const syntheticBatch = async (entityType, afterId, limit) => {
      if (entityType !== 'cave') return [];
      const rows = [];
      for (let id = afterId + 1; id <= PAGES && rows.length < limit; id += 1) {
        rows.push(
          record('cave', id, {
            descriptions: [
              {
                title: `Title ${id}`,
                body: `${'text '.repeat(1200)}${id}`,
                language: 'fra',
              },
            ],
          })
        );
      }
      return rows;
    };

    it(`retains less than ${CEILING_MB} MB of live heap over ${PAGES} pages`, async function measure() {
      this.timeout(300000);
      let published = 0;
      const discard = {
        put: async () => {
          published += 1;
        },
        delete: async () => {},
        list: async function* none() {
          yield* [];
        },
      };
      const baseline = liveHeapMb();
      let peak = baseline;

      await Generator.run({
        adapter: discard,
        readBatch: syntheticBatch,
        onBatch: () => {
          peak = Math.max(peak, liveHeapMb());
        },
      });

      const retained = peak - baseline;
      // eslint-disable-next-line no-console
      console.log(
        `      ${PAGES} pages: baseline ${baseline.toFixed(1)} MB, peak live heap ${peak.toFixed(1)} MB, retained ${retained.toFixed(1)} MB`
      );
      should(published).equal(PAGES + 1);
      should(retained).be.below(CEILING_MB);
    });
  });
});
