const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const should = require('should');
const sinon = require('sinon');

const collect = async (iterable) => {
  const items = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const item of iterable) items.push(item);
  return items.sort();
};

describe('Bot storage adapters', () => {
  let LocalStorageAdapter;
  let AzureBlobStorageAdapter;
  let storage;

  before(() => {
    // Sails re-requires api/ when it lifts: require the modules here
    /* eslint-disable global-require */
    storage = require('../../../api/services/bot/storage');
    ({ LocalStorageAdapter, AzureBlobStorageAdapter } = storage);
    /* eslint-enable global-require */
  });

  describe('LocalStorageAdapter', () => {
    let root;
    let adapter;

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-local-'));
      adapter = new LocalStorageAdapter(root);
    });

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true });
    });

    it('writes a page under its key, creating the directory', async () => {
      await adapter.put('caves/1.html', '<p>é</p>');
      should(fs.readFileSync(path.join(root, 'caves/1.html'), 'utf8')).equal(
        '<p>é</p>'
      );
    });

    it('writes a Buffer body byte for byte (a gzip sitemap shard)', async () => {
      const bytes = Buffer.from([
        0x1f, 0x8b, 0x08, 0x00, 0xff, 0xfe, 0x00, 0x80,
      ]);
      await adapter.put('sitemap-caves-0.xml.gz', bytes, {
        contentType: 'application/gzip',
      });
      should(
        fs.readFileSync(path.join(root, 'sitemap-caves-0.xml.gz'))
      ).deepEqual(bytes);
      should(await collect(adapter.list())).deepEqual([
        'sitemap-caves-0.xml.gz',
      ]);
    });

    it('replaces a page and leaves no temporary file', async () => {
      await adapter.put('caves/1.html', 'one');
      await adapter.put('caves/1.html', 'two');
      should(fs.readFileSync(path.join(root, 'caves/1.html'), 'utf8')).equal(
        'two'
      );
      // On disk, not through list(), which skips temporary files
      should(fs.readdirSync(path.join(root, 'caves'))).deepEqual(['1.html']);
    });

    it('does not list a temporary file left by a write that was killed', async () => {
      await adapter.put('caves/1.html', 'x');
      fs.writeFileSync(path.join(root, 'caves/2.html.123.abc.part'), 'half');
      should(await collect(adapter.list())).deepEqual(['caves/1.html']);
    });

    it('lists every key, in subdirectories too, and nothing when the root does not exist', async () => {
      await adapter.put('404.html', 'x');
      await adapter.put('caves/1.html', 'x');
      await adapter.put('massifs/2.html', 'x');
      should(await collect(adapter.list())).deepEqual([
        '404.html',
        'caves/1.html',
        'massifs/2.html',
      ]);
      should(
        await collect(
          new LocalStorageAdapter(path.join(root, 'missing')).list()
        )
      ).deepEqual([]);
    });

    it('deletes a page, and does not fail when it is already gone', async () => {
      await adapter.put('caves/1.html', 'x');
      await adapter.delete('caves/1.html');
      await adapter.delete('caves/1.html');
      should(await collect(adapter.list())).deepEqual([]);
    });

    describe('get', () => {
      it('returns the bytes of a page, byte for byte', async () => {
        const bytes = Buffer.from([0x1f, 0x8b, 0x00, 0xff, 0xfe]);
        await adapter.put('a.bin', bytes);
        await adapter.put('caves/1.html', '<p>é</p>');
        should(await adapter.get('a.bin')).deepEqual(bytes);
        should((await adapter.get('caves/1.html')).toString('utf8')).equal(
          '<p>é</p>'
        );
      });

      it('returns null for a page that is not there', async () => {
        should(await adapter.get('caves/404.html')).be.null();
      });

      it('rejects with E_BOT_PAGE_TOO_LARGE, unread, over the size cap, and reads a page exactly at the cap', async () => {
        await adapter.put('caves/1.html', 'x'.repeat(10));
        const err = await adapter
          .get('caves/1.html', { maxBytes: 9 })
          .should.be.rejected();
        should(err.code).equal('E_BOT_PAGE_TOO_LARGE');
        should(
          (await adapter.get('caves/1.html', { maxBytes: 10 })).length
        ).equal(10);
      });

      it('refuses a key that leaves the root', async () => {
        await adapter.get('../x.html').should.be.rejectedWith(RangeError);
      });
    });

    it('refuses a key that leaves the root', async () => {
      // The adapter root is a subdirectory, so an escape lands in the temp dir that is cleaned up
      const inner = new LocalStorageAdapter(path.join(root, 'site'));
      await Promise.all(
        ['../outside.html', '/etc/passwd', '', 'a/../../x.html', '.'].map(
          (key) => inner.put(key, 'x').should.be.rejectedWith(RangeError)
        )
      );
      should(fs.existsSync(path.join(root, 'outside.html'))).be.false();
    });

    describe('metadata', () => {
      const sidecar = (key) =>
        path.join(root, `${key}${LocalStorageAdapter.METADATA_SUFFIX}`);

      it('keeps the metadata of a page next to it, and does not list it as a page', async () => {
        await adapter.put('caves/1.html', 'x', {
          metadata: { redirectto: 'https://example.test/ui/caves/2' },
        });
        should(
          JSON.parse(fs.readFileSync(sidecar('caves/1.html'), 'utf8'))
        ).deepEqual({
          redirectto: 'https://example.test/ui/caves/2',
        });
        should(await collect(adapter.list())).deepEqual(['caves/1.html']);
      });

      it('drops the metadata when the page is put again without any', async () => {
        await adapter.put('caves/1.html', 'x', {
          metadata: { redirectto: 'u' },
        });
        await adapter.put('caves/1.html', 'y');
        should(fs.existsSync(sidecar('caves/1.html'))).be.false();
        await adapter.put('caves/1.html', 'z', { metadata: {} });
        should(fs.existsSync(sidecar('caves/1.html'))).be.false();
      });

      it('replaces the metadata, and deletes it with the page', async () => {
        await adapter.put('caves/1.html', 'x', {
          metadata: { redirectto: 'a' },
        });
        await adapter.put('caves/1.html', 'x', {
          metadata: { redirectto: 'b' },
        });
        should(
          JSON.parse(fs.readFileSync(sidecar('caves/1.html'), 'utf8'))
        ).deepEqual({
          redirectto: 'b',
        });
        await adapter.delete('caves/1.html');
        should(fs.existsSync(sidecar('caves/1.html'))).be.false();
        should(await collect(adapter.list())).deepEqual([]);
      });
    });

    it('needs a directory', () => {
      should(() => new LocalStorageAdapter('')).throw();
    });
  });

  describe('AzureBlobStorageAdapter', () => {
    const makeContainer = () => {
      const blob = {
        upload: sinon.stub().resolves(),
        deleteIfExists: sinon.stub().resolves({ succeeded: true }),
      };
      return {
        blob,
        getBlockBlobClient: sinon.stub().returns(blob),
        listBlobsFlat: sinon.stub().callsFake(async function* list() {
          yield { name: 'caves/2.html' };
          yield { name: 'caves/1.html' };
        }),
      };
    };

    it('uploads a page as text/html; charset=utf-8, with the byte length of the UTF-8 body', async () => {
      const container = makeContainer();
      await new AzureBlobStorageAdapter(container).put(
        'caves/1.html',
        '<p>é</p>'
      );

      should(
        container.getBlockBlobClient.calledOnceWithExactly('caves/1.html')
      ).be.true();
      sinon.assert.calledOnceWithExactly(
        container.blob.upload,
        '<p>é</p>',
        Buffer.byteLength('<p>é</p>', 'utf8'),
        { blobHTTPHeaders: { blobContentType: 'text/html; charset=utf-8' } }
      );
      should(Buffer.byteLength('<p>é</p>', 'utf8')).equal(9);
    });

    it('uploads a Buffer with its byte length and the content type it is given', async () => {
      const container = makeContainer();
      const bytes = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0xc3, 0xa9]);
      await new AzureBlobStorageAdapter(container).put(
        'sitemap-caves-0.xml.gz',
        bytes,
        { contentType: 'application/gzip' }
      );
      sinon.assert.calledOnceWithExactly(container.blob.upload, bytes, 6, {
        blobHTTPHeaders: { blobContentType: 'application/gzip' },
      });
    });

    it('uploads the metadata of a page (redirectto) with it', async () => {
      const container = makeContainer();
      await new AzureBlobStorageAdapter(container).put('caves/1.html', 'x', {
        metadata: { redirectto: 'https://example.test/ui/caves/2' },
      });
      sinon.assert.calledOnceWithExactly(container.blob.upload, 'x', 1, {
        blobHTTPHeaders: { blobContentType: 'text/html; charset=utf-8' },
        metadata: { redirectto: 'https://example.test/ui/caves/2' },
      });
    });

    it('sends no metadata option when there is none, so an upload clears what the blob had', async () => {
      const container = makeContainer();
      const adapter = new AzureBlobStorageAdapter(container);
      await adapter.put('caves/1.html', 'x', { metadata: {} });
      await adapter.put('caves/1.html', 'x', {});
      container.blob.upload
        .getCalls()
        .forEach((call) => should(call.args[2]).not.have.property('metadata'));
    });

    it('propagates an upload failure', async () => {
      const container = makeContainer();
      container.blob.upload.rejects(new Error('503'));
      await new AzureBlobStorageAdapter(container)
        .put('caves/1.html', 'x')
        .should.be.rejectedWith('503');
    });

    it('deletes a blob with deleteIfExists, so an absent blob is not an error', async () => {
      const container = makeContainer();
      await new AzureBlobStorageAdapter(container).delete('caves/1.html');
      should(
        container.getBlockBlobClient.calledOnceWithExactly('caves/1.html')
      ).be.true();
      should(container.blob.deleteIfExists.calledOnce).be.true();
    });

    describe('get', () => {
      const downloadOf = (text, contentLength = Buffer.byteLength(text)) => {
        const stream = Readable.from([Buffer.from(text, 'utf8')]);
        sinon.spy(stream, 'destroy');
        return { contentLength, readableStreamBody: stream };
      };

      it('downloads the blob from the start and returns its bytes', async () => {
        const container = makeContainer();
        container.blob.download = sinon.stub().resolves(downloadOf('<p>é</p>'));
        const body = await new AzureBlobStorageAdapter(container).get(
          'caves/1.html'
        );
        should(body.toString('utf8')).equal('<p>é</p>');
        should(
          container.getBlockBlobClient.calledOnceWithExactly('caves/1.html')
        ).be.true();
        should(container.blob.download.calledOnceWithExactly(0)).be.true();
      });

      it('returns null on a 404', async () => {
        const container = makeContainer();
        container.blob.download = sinon
          .stub()
          .rejects(
            Object.assign(new Error('BlobNotFound'), { statusCode: 404 })
          );
        should(
          await new AzureBlobStorageAdapter(container).get('caves/1.html')
        ).be.null();
      });

      it('lets any other error through', async () => {
        const container = makeContainer();
        container.blob.download = sinon
          .stub()
          .rejects(Object.assign(new Error('boom'), { statusCode: 503 }));
        await new AzureBlobStorageAdapter(container)
          .get('caves/1.html')
          .should.be.rejectedWith('boom');
      });

      it('rejects with E_BOT_PAGE_TOO_LARGE from the announced length, without reading the body', async () => {
        const container = makeContainer();
        const download = downloadOf('x'.repeat(10));
        container.blob.download = sinon.stub().resolves(download);
        const err = await new AzureBlobStorageAdapter(container)
          .get('caves/1.html', { maxBytes: 9 })
          .should.be.rejected();
        should(err.code).equal('E_BOT_PAGE_TOO_LARGE');
        should(download.readableStreamBody.destroy.calledOnce).be.true();
        should(download.readableStreamBody.readableDidRead).be.false();
      });

      it('also stops a body longer than the length it announced', async () => {
        const container = makeContainer();
        const download = downloadOf('x'.repeat(10), 1);
        container.blob.download = sinon.stub().resolves(download);
        const err = await new AzureBlobStorageAdapter(container)
          .get('caves/1.html', { maxBytes: 9 })
          .should.be.rejected();
        should(err.code).equal('E_BOT_PAGE_TOO_LARGE');
      });
    });

    it('lists the names of the blobs', async () => {
      const adapter = new AzureBlobStorageAdapter(makeContainer());
      should(await collect(adapter.list())).deepEqual([
        'caves/1.html',
        'caves/2.html',
      ]);
    });

    it('needs a container client', () => {
      should(() => new AzureBlobStorageAdapter(null)).throw();
    });

    describe('fromConnectionString', () => {
      it('refuses a missing connection string or container: nothing is hardcoded', () => {
        should(() =>
          AzureBlobStorageAdapter.fromConnectionString('', 'c')
        ).throw();
        should(() =>
          AzureBlobStorageAdapter.fromConnectionString('cs', '')
        ).throw();
        should(() =>
          AzureBlobStorageAdapter.fromConnectionString(undefined, undefined)
        ).throw();
      });

      it('targets the container it is given', () => {
        const adapter = AzureBlobStorageAdapter.fromConnectionString(
          'DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=a2V5;EndpointSuffix=core.windows.net',
          '$web'
        );
        should(adapter.container.containerName).equal('$web');
        should(adapter.container.accountName).equal('acct');
      });
    });
  });

  describe('createStorageAdapter', () => {
    it('builds the local adapter', () => {
      const adapter = storage.createStorageAdapter({
        driver: 'local',
        localDir: os.tmpdir(),
      });
      should(adapter).be.instanceOf(LocalStorageAdapter);
    });

    it('builds the Azure adapter from the connection string and container', () => {
      const adapter = storage.createStorageAdapter({
        driver: 'azure',
        azureConnectionString:
          'DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=a2V5;EndpointSuffix=core.windows.net',
        azureContainer: 'pages',
      });
      should(adapter).be.instanceOf(AzureBlobStorageAdapter);
      should(adapter.container.containerName).equal('pages');
    });

    it('refuses the local driver in production, where it would forget pages that stay online, and nowhere else', () => {
      const local = { driver: 'local', localDir: os.tmpdir() };
      should(() =>
        storage.createStorageAdapter(local, { env: 'production' })
      ).throw(/BOT_PAGES_STORAGE=azure/);
      ['development', 'test', undefined].forEach((env) =>
        should(storage.createStorageAdapter(local, { env })).be.instanceOf(
          LocalStorageAdapter
        )
      );
      // Azure is fine in production
      should(
        storage.createStorageAdapter(
          {
            driver: 'azure',
            azureConnectionString:
              'DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=a2V5;EndpointSuffix=core.windows.net',
            azureContainer: 'pages',
          },
          { env: 'production' }
        )
      ).be.instanceOf(AzureBlobStorageAdapter);
    });

    it('refuses an unknown driver and an Azure driver without its settings', () => {
      should(() => storage.createStorageAdapter({ driver: 's3' })).throw(/s3/);
      should(() => storage.createStorageAdapter({})).throw();
      should(() => storage.createStorageAdapter({ driver: 'azure' })).throw();
    });

    it('has a public base URL and a storage driver in the configuration', () => {
      const { botSurface } = sails.config.custom;
      should(botSurface.publicBaseUrl).be.a.String().and.not.be.empty();
      should(['local', 'azure']).containEql(botSurface.storage.driver);
    });
  });
});
