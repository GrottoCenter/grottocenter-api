const fs = require('fs');
const os = require('os');
const path = require('path');
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

    it('replaces a page and leaves no temporary file', async () => {
      await adapter.put('caves/1.html', 'one');
      await adapter.put('caves/1.html', 'two');
      should(fs.readFileSync(path.join(root, 'caves/1.html'), 'utf8')).equal(
        'two'
      );
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
