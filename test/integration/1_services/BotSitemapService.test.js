const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const should = require('should');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

const NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const BASE_URL = 'https://example.test/ui';
// Ids no fixture uses: shard 180 holds [9000000, 9050000), shard 181 the next
// range
const FIRST_RANGE = 9000000;
const SECOND_RANGE = 9050000;

// W3C datetime (https://www.w3.org/TR/NOTE-datetime), the lastmod of the protocol
const W3C_DATETIME =
  /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$/;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

// Checks one sitemap file against the rules of the sitemaps 0.9 schemas
// (sitemap.xsd for a <urlset>, siteindex.xsd for a <sitemapindex>), and what
// this surface promises on top: no <changefreq>, no <priority>, no extension.
// Returns the entries, [{ loc, lastmod }].
const checkSitemap = (xml, root) => {
  const element = root === 'urlset' ? 'url' : 'sitemap';
  should(XMLValidator.validate(xml)).equal(true);
  should(Buffer.byteLength(xml, 'utf8')).be.belowOrEqual(50 * 1024 * 1024);
  should(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).be.true();

  const nodes = parser.parse(xml).filter((node) => !('?xml' in node));
  should(nodes).have.length(1);
  should(Object.keys(nodes[0]).filter((k) => k !== ':@')).deepEqual([root]);
  should(nodes[0][':@']).deepEqual({ '@_xmlns': NAMESPACE });

  const children = nodes[0][root];
  should(children.length).be.within(1, 50000);
  return children.map((child) => {
    should(Object.keys(child)).deepEqual([element]);
    const fields = child[element].map((field) => {
      const names = Object.keys(field);
      should(names).have.length(1);
      const [text] = field[names[0]];
      should(Object.keys(text)).deepEqual(['#text']);
      return [names[0], text['#text']];
    });
    const names = fields.map(([name]) => name);
    // <loc> once, first; <lastmod> at most once, after it; nothing else
    should(['loc', 'loc,lastmod']).containEql(names.join(','));
    const entry = Object.fromEntries(fields);
    should(entry.loc.length).be.within(12, 2048);
    should(entry.loc).match(/^https:\/\/[^\s]+$/);
    should(new URL(entry.loc).href).equal(entry.loc);
    if (entry.lastmod !== undefined) {
      should(entry.lastmod).match(W3C_DATETIME);
      should(Number.isNaN(Date.parse(entry.lastmod))).be.false();
    }
    return entry;
  });
};

describe('BotSitemapService', () => {
  let Sitemaps;
  let Generator;
  let LocalStorageAdapter;
  let root;
  let adapter;
  let puts;
  let putOptions;
  let deletes;

  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    Sitemaps = require('../../../api/services/bot/BotSitemapService');
    Generator = require('../../../api/services/bot/BotPageGeneratorService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
  });

  const recordingAdapter = (inner) => ({
    async put(key, body, options) {
      await inner.put(key, body, options);
      puts.push(key);
      putOptions[key] = { ...options, isBuffer: Buffer.isBuffer(body) };
    },
    async delete(key) {
      await inner.delete(key);
      deletes.push(key);
    },
    list: () => inner.list(),
  });

  const run = (options = {}) =>
    Sitemaps.run({ adapter, baseUrl: BASE_URL, ...options });

  // A manifest row, as the generator writes it
  const page = (entityType, id, lastmod, { redirectTo = null } = {}) =>
    query(
      `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash, lastmod, redirect_to)
       VALUES ($1, $2, $3, 'hash', $4, $5)`,
      [
        `${
          { cave: 'caves', massif: 'massifs', organization: 'organizations' }[
            entityType
          ]
        }/${id}.html`,
        entityType,
        id,
        lastmod,
        redirectTo,
      ]
    );

  const hub = (hubType, hubKey, blobKey, lastmod) =>
    query(
      `INSERT INTO t_bot_page_manifest (path, entity_type, hub_type, hub_key, content_hash, lastmod)
       VALUES ($1, 'hub', $2, $3, 'hash', $4)`,
      [blobKey, hubType, hubKey, lastmod]
    );

  const keys = async () => {
    const found = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const key of adapter.list()) found.push(key);
    return found.sort();
  };

  const readIndex = () =>
    checkSitemap(
      fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'),
      'sitemapindex'
    );

  const readShard = (key) =>
    checkSitemap(
      zlib.gunzipSync(fs.readFileSync(path.join(root, key))).toString('utf8'),
      'urlset'
    );

  // Every URL of every shard listed by the index: { loc: { shard, lastmod } }
  const readAll = () => {
    const urls = {};
    readIndex().forEach(({ loc }) => {
      const key = loc.slice('https://example.test/'.length);
      readShard(key).forEach((entry) => {
        should(urls).not.have.property(entry.loc);
        urls[entry.loc] = { shard: key, lastmod: entry.lastmod };
      });
    });
    return urls;
  };

  const manifestRow = async (p) =>
    (await query('SELECT * FROM t_bot_page_manifest WHERE path = $1', [p]))
      .rows[0];

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-sitemaps-'));
    puts = [];
    putOptions = {};
    deletes = [];
    adapter = recordingAdapter(new LocalStorageAdapter(root));
    await query('TRUNCATE t_bot_page_manifest');
    await page('cave', FIRST_RANGE + 2, '2026-03-02 10:00:00.123456+00');
    await page('cave', FIRST_RANGE + 1, '2026-03-01 12:00:00+02');
    await page('cave', SECOND_RANGE + 7, '2026-02-01 00:00:00+00');
    // A redirect page: noindex, never in a sitemap
    await page('cave', FIRST_RANGE + 3, null, { redirectTo: FIRST_RANGE + 1 });
    await page('massif', FIRST_RANGE + 1, '2026-04-01 00:00:00+00');
    await page('organization', FIRST_RANGE + 1, '2026-01-15 08:30:00+00');
    await hub(
      'region',
      'FR-01',
      'countries/FR/regions/01.html',
      '2026-05-03 00:00:00+00'
    );
    await hub('country', 'FR', 'countries/FR.html', '2026-05-02 00:00:00+00');
    await hub('index', 'ALL', 'countries.html', '2026-05-01 00:00:00+00');
    await hub('country', 'BE', 'countries/BE.html', '2026-05-04 00:00:00+00');
    // Sorted by key alone it would come before FR: by hub type, after it
    await hub(
      'region',
      'BE-BRU',
      'countries/BE/regions/BRU.html',
      '2026-05-01 00:00:00+00'
    );
    // A static extra: not a page of the sitemaps
    await query(
      `INSERT INTO t_bot_page_manifest (path, entity_type, content_hash)
       VALUES ('404.html', 'static', 'hash')`
    );
    puts = [];
  });

  afterEach(async () => {
    fs.rmSync(root, { recursive: true, force: true });
    await query('TRUNCATE t_bot_page_manifest');
  });

  const EXPECTED_URLS = {
    'https://example.test/ui/caves/9000001': {
      shard: 'sitemap-caves-180.xml.gz',
      lastmod: '2026-03-01T10:00:00.000000Z',
    },
    'https://example.test/ui/caves/9000002': {
      shard: 'sitemap-caves-180.xml.gz',
      lastmod: '2026-03-02T10:00:00.123456Z',
    },
    'https://example.test/ui/caves/9050007': {
      shard: 'sitemap-caves-181.xml.gz',
      lastmod: '2026-02-01T00:00:00.000000Z',
    },
    'https://example.test/ui/massifs/9000001': {
      shard: 'sitemap-massifs-180.xml.gz',
      lastmod: '2026-04-01T00:00:00.000000Z',
    },
    'https://example.test/ui/organizations/9000001': {
      shard: 'sitemap-organizations-180.xml.gz',
      lastmod: '2026-01-15T08:30:00.000000Z',
    },
    'https://example.test/ui/countries': {
      shard: 'sitemap-hubs.xml.gz',
      lastmod: '2026-05-01T00:00:00.000000Z',
    },
    'https://example.test/ui/countries/BE': {
      shard: 'sitemap-hubs.xml.gz',
      lastmod: '2026-05-04T00:00:00.000000Z',
    },
    'https://example.test/ui/countries/FR': {
      shard: 'sitemap-hubs.xml.gz',
      lastmod: '2026-05-02T00:00:00.000000Z',
    },
    'https://example.test/ui/countries/BE/regions/BRU': {
      shard: 'sitemap-hubs.xml.gz',
      lastmod: '2026-05-01T00:00:00.000000Z',
    },
    'https://example.test/ui/countries/FR/regions/01': {
      shard: 'sitemap-hubs.xml.gz',
      lastmod: '2026-05-03T00:00:00.000000Z',
    },
  };

  describe('a run over the manifest', () => {
    it('writes the index and one shard per type and id range, each valid', async () => {
      const summary = await run();

      // Every file at the root of the site, next to the index
      should(await keys()).deepEqual([
        'sitemap-caves-180.xml.gz',
        'sitemap-caves-181.xml.gz',
        'sitemap-hubs.xml.gz',
        'sitemap-massifs-180.xml.gz',
        'sitemap-organizations-180.xml.gz',
        'sitemap.xml',
      ]);
      should(summary).deepEqual({
        uploaded: 6,
        unchanged: 0,
        deleted: 0,
        shards: 5,
        urls: 10,
      });
    });

    it('lists every shard in the index, with the time it was uploaded as its lastmod', async () => {
      const startedAt = new Date().toISOString();
      await run();
      const index = readIndex();
      should(index.map((entry) => entry.loc)).deepEqual([
        'https://example.test/sitemap-caves-180.xml.gz',
        'https://example.test/sitemap-caves-181.xml.gz',
        'https://example.test/sitemap-massifs-180.xml.gz',
        'https://example.test/sitemap-organizations-180.xml.gz',
        'https://example.test/sitemap-hubs.xml.gz',
      ]);
      // One run, one time: later than every entry of the fixture
      const [first] = index;
      should(first.lastmod >= startedAt.replace(/\.\d+Z$/, '')).be.true();
      index.forEach((entry) => should(entry.lastmod).equal(first.lastmod));
    });

    it('takes the latest entry as the lastmod of a shard when it is later than the run', async () => {
      await query(
        `UPDATE t_bot_page_manifest SET lastmod = '2099-01-01T00:00:00Z' WHERE path = $1`,
        [`caves/${SECOND_RANGE + 7}.html`]
      );
      await run();
      should(readIndex()[1].lastmod).equal('2099-01-01T00:00:00.000000Z');
      should(readIndex()[0].lastmod < '2099').be.true();
    });

    it('lists exactly the content pages of the manifest, each with its lastmod', async () => {
      await run();
      should(readAll()).deepEqual(EXPECTED_URLS);
    });

    it('lists every manifest row that is not a redirect or a static file, and nothing else', async () => {
      await run();
      const urls = readAll();
      const { rows } = await query(
        `SELECT path, entity_type, redirect_to,
                to_char(lastmod AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS lastmod
           FROM t_bot_page_manifest`
      );
      const listed = rows.filter(
        (row) => row.entity_type !== 'static' && row.redirect_to === null
      );
      // Manifest -> sitemaps: the page key and the URL name the same path
      listed.forEach((row) => {
        const loc = `${BASE_URL}/${row.path.replace(/\.html$/, '')}`;
        should(urls).have.property(loc);
        should(urls[loc].lastmod).equal(row.lastmod);
      });
      // Sitemaps -> manifest
      should(Object.keys(urls)).have.length(listed.length);
      should(urls).not.have.property('https://example.test/ui/caves/9000003');
      should(Object.keys(urls).some((loc) => loc.includes('404'))).be.false();
    });

    it('sorts the hubs by hub type, then by key', async () => {
      await run();
      should(readShard('sitemap-hubs.xml.gz').map((e) => e.loc)).deepEqual([
        'https://example.test/ui/countries',
        'https://example.test/ui/countries/BE',
        'https://example.test/ui/countries/FR',
        'https://example.test/ui/countries/BE/regions/BRU',
        'https://example.test/ui/countries/FR/regions/01',
      ]);
    });

    it('sorts the records of a shard by id', async () => {
      await run();
      should(readShard('sitemap-caves-180.xml.gz').map((e) => e.loc)).deepEqual(
        [
          'https://example.test/ui/caves/9000001',
          'https://example.test/ui/caves/9000002',
        ]
      );
    });

    it('uploads the shards gzipped as application/gzip and the index as XML', async () => {
      await run();
      should(putOptions['sitemap-caves-180.xml.gz']).deepEqual({
        contentType: 'application/gzip',
        isBuffer: true,
      });
      should(putOptions['sitemap.xml']).deepEqual({
        contentType: 'application/xml; charset=utf-8',
        isBuffer: false,
      });
    });

    it('uploads the shards before the index', async () => {
      await run();
      should(puts[puts.length - 1]).equal('sitemap.xml');
    });

    it('keeps each file in the manifest as a static row with its hash and latest lastmod', async () => {
      await run();
      const shard = await manifestRow('sitemap-caves-180.xml.gz');
      should(shard.entity_type).equal('static');
      should(shard.entity_id).be.null();
      should(shard.content_hash).match(/^[0-9a-f]{64}$/);
      // The time the file was uploaded, which the index publishes
      const index = readIndex();
      should(`${shard.lastmod.toISOString().slice(0, 23)}`).equal(
        index[0].lastmod.slice(0, 23)
      );
      should(
        (await manifestRow('sitemap.xml')).lastmod.toISOString().slice(0, 23)
      ).equal(index[0].lastmod.slice(0, 23));
    });

    it('gives the same files when the manifest is read one row at a time', async () => {
      await run();
      const expected = readAll();
      await query(
        `DELETE FROM t_bot_page_manifest WHERE path = 'sitemap.xml' OR path LIKE 'sitemap-%.xml.gz'`
      );
      puts = [];
      await run({ batchSize: 1 });
      should(puts).have.length(6);
      should(readAll()).deepEqual(expected);
    });

    it('serves the files at the site origin unless told otherwise', async () => {
      await run({ siteUrl: 'https://files.example.test/' });
      should(readIndex()[0].loc).equal(
        'https://files.example.test/sitemap-caves-180.xml.gz'
      );
    });

    it('holds a full id range of 50,000 records in one valid shard', async function fullRange() {
      this.timeout(60000);
      await query(
        `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash, lastmod)
         SELECT 'caves/' || id || '.html', 'cave', id, 'hash', '2026-01-01Z'
           FROM generate_series($1::int, $2::int) AS id
         ON CONFLICT (path) DO NOTHING`,
        [SECOND_RANGE, SECOND_RANGE + 49999]
      );
      await query(
        `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash, lastmod)
         VALUES ('caves/9100000.html', 'cave', 9100000, 'hash', '2026-01-01Z')`
      );
      await run();
      const shard = readShard('sitemap-caves-181.xml.gz');
      should(shard).have.length(50000);
      should(shard[0].loc).equal('https://example.test/ui/caves/9050000');
      should(shard[49999].loc).equal('https://example.test/ui/caves/9099999');
      should(readShard('sitemap-caves-182.xml.gz')).deepEqual([
        {
          loc: 'https://example.test/ui/caves/9100000',
          lastmod: '2026-01-01T00:00:00.000000Z',
        },
      ]);
    });
  });

  describe('stable shards', () => {
    it('moves no URL when records are added to the first range', async () => {
      await run();
      const before = readAll();
      await page('cave', FIRST_RANGE + 4, '2026-03-03 00:00:00+00');
      await page('cave', 9049999, '2026-03-04 00:00:00+00');
      puts = [];

      await run();
      const after = readAll();
      Object.entries(before).forEach(([loc, entry]) => {
        should(after[loc]).deepEqual(entry);
      });
      should(after['https://example.test/ui/caves/9049999'].shard).equal(
        'sitemap-caves-180.xml.gz'
      );
      // Only the shard that changed, and the index whose lastmod moved
      should(puts).deepEqual(['sitemap-caves-180.xml.gz', 'sitemap.xml']);
    });

    it('uploads nothing when nothing changed, and keeps the index lastmod', async () => {
      await run();
      const before = readIndex();
      const published = await manifestRow('sitemap-caves-181.xml.gz');
      puts = [];

      const summary = await run();
      should(puts).deepEqual([]);
      should(deletes).deepEqual([]);
      should(summary.uploaded).equal(0);
      should(summary.unchanged).equal(6);
      should(readIndex()).deepEqual(before);
      should(
        (await manifestRow('sitemap-caves-181.xml.gz')).published_at
      ).deepEqual(published.published_at);
    });

    it('uploads a shard again when only a lastmod changed, and moves its date in the index', async () => {
      await run();
      const before = readIndex();
      await query(
        `UPDATE t_bot_page_manifest SET lastmod = '2026-06-01Z' WHERE path = $1`,
        [`caves/${SECOND_RANGE + 7}.html`]
      );
      puts = [];
      await run();
      should(puts).deepEqual(['sitemap-caves-181.xml.gz', 'sitemap.xml']);
      const after = readIndex();
      should(after[1].lastmod > before[1].lastmod).be.true();
      // The other shards keep their date
      [0, 2, 3, 4].forEach((i) =>
        should(after[i].lastmod).equal(before[i].lastmod)
      );
    });

    it('moves the date of a shard forward when a URL leaves it, even one that was not its newest', async () => {
      // Two URLs in the first cave range: drop the older one
      await run();
      should(readShard('sitemap-caves-180.xml.gz').length).be.above(1);
      const before = readIndex();
      const { rows } = await query(
        `SELECT path FROM t_bot_page_manifest
          WHERE entity_type = 'cave' AND redirect_to IS NULL
            AND entity_id >= $1 AND entity_id < $2
          ORDER BY lastmod LIMIT 1`,
        [FIRST_RANGE, FIRST_RANGE + 50000]
      );
      await query('DELETE FROM t_bot_page_manifest WHERE path = $1', [
        rows[0].path,
      ]);
      puts = [];
      await run();
      should(puts).deepEqual(['sitemap-caves-180.xml.gz', 'sitemap.xml']);
      const after = readIndex();
      should(after[0].lastmod > before[0].lastmod).be.true();
      [1, 2, 3, 4].forEach((i) =>
        should(after[i].lastmod).equal(before[i].lastmod)
      );
    });

    it('deletes a shard that became empty, after the index stops listing it', async () => {
      await run();
      await query('DELETE FROM t_bot_page_manifest WHERE path = $1', [
        `caves/${SECOND_RANGE + 7}.html`,
      ]);
      puts = [];

      const summary = await run();
      should(puts).deepEqual(['sitemap.xml']);
      should(deletes).deepEqual(['sitemap-caves-181.xml.gz']);
      should(summary.deleted).equal(1);
      should(await keys()).not.containEql('sitemap-caves-181.xml.gz');
      should(await manifestRow('sitemap-caves-181.xml.gz')).be.undefined();
      should(readIndex().map((e) => e.loc)).not.containEql(
        'https://example.test/sitemap-caves-181.xml.gz'
      );
    });

    it('deletes the index first, then the shards, when nothing is left to list', async () => {
      await run();
      await query(
        `DELETE FROM t_bot_page_manifest WHERE entity_type <> 'static'`
      );

      await run();
      should(deletes[0]).equal('sitemap.xml');
      should(deletes.slice(1).sort()).deepEqual([
        'sitemap-caves-180.xml.gz',
        'sitemap-caves-181.xml.gz',
        'sitemap-hubs.xml.gz',
        'sitemap-massifs-180.xml.gz',
        'sitemap-organizations-180.xml.gz',
      ]);
      should(await keys()).deepEqual([]);
      should(
        (await query('SELECT path FROM t_bot_page_manifest')).rows
      ).deepEqual([{ path: '404.html' }]);
    });
  });

  describe('entity types', () => {
    it('lists only the types asked for, and deletes the shards of the others', async () => {
      await run();
      await run({ entityTypes: ['cave'] });
      should(await keys()).deepEqual([
        'sitemap-caves-180.xml.gz',
        'sitemap-caves-181.xml.gz',
        'sitemap.xml',
      ]);
      should(readIndex()).have.length(2);
    });

    it('refuses an unknown type or a bad batch size before anything is read', async () => {
      await run({ entityTypes: ['entrance'] }).should.be.rejectedWith(
        RangeError
      );
      await run({ entityTypes: 'cave' }).should.be.rejectedWith(TypeError);
      await run({ batchSize: 0 }).should.be.rejectedWith(RangeError);
      await Sitemaps.run({}).should.be.rejectedWith(/needs an adapter/);
      should(await keys()).deepEqual([]);
    });
  });

  describe('the generator lock', () => {
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

    it('rejects a run while a generation run holds the lock, and writes nothing', async () => {
      await holdingTheLock(async () => {
        await run().should.be.rejectedWith({ code: 'E_BOT_PAGES_RUNNING' });
      });
      should(puts).be.empty();
      should(await keys()).deepEqual([]);
    });

    it('rejects a run started while a generation run is in progress', async () => {
      let sitemapRun;
      await Generator.run({
        adapter,
        baseUrl: BASE_URL,
        readBatch: async () => [],
        readRedirects: async () => [],
        readHubs: async () => [],
        languageTags: new Map(),
        countryNames: new Map(),
        onBatch: async () => {
          if (!sitemapRun) {
            sitemapRun = run().then(
              () => null,
              (error) => error
            );
          }
        },
      });
      should(await sitemapRun).have.property('code', 'E_BOT_PAGES_RUNNING');
      should(puts).not.containEql('sitemap.xml');
    });

    it('leaves the sitemap files alone when the generator removes static paths', async () => {
      await run();
      const before = await keys();
      await Generator.run({
        adapter,
        baseUrl: BASE_URL,
        readBatch: async () => [],
        readRedirects: async () => [],
        readHubs: async () => [],
        languageTags: new Map(),
        countryNames: new Map(),
      });
      // The generator deleted every page (its view is empty) and kept the
      // sitemap files and their rows
      should(deletes).containEql('caves/9000001.html');
      before.forEach((key) => should(deletes).not.containEql(key));
      should(await manifestRow('sitemap.xml')).be.ok();
      should(await manifestRow('sitemap-hubs.xml.gz')).be.ok();
    });
  });
});
