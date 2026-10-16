const should = require('should');
const sinon = require('sinon');
const { cubeGlb } = require('../../helpers/glbModels');

const GLB_FORMAT_ID = 104;

describe('GlbThumbnailQueueService', () => {
  let GlbThumbnailQueueService;
  let FileService;
  let originalBoss;
  let originalCredentials;

  before(() => {
    /* eslint-disable global-require */
    GlbThumbnailQueueService = require('../../../api/services/GlbThumbnailQueueService');
    /* eslint-enable global-require */
    // The instance the job calls: the module required here is not it
    FileService = sails.services.fileservice;
    originalBoss = sails.enrichmentBoss;
    originalCredentials = FileService.getCredentialsForTest();
  });

  afterEach(() => {
    sails.enrichmentBoss = originalBoss;
    FileService.setCredentialsForTest(originalCredentials);
    sinon.restore();
  });

  describe('start()', () => {
    it('creates the queue and registers its worker', async () => {
      const boss = {
        createQueue: sinon.stub().resolves(),
        work: sinon.stub().resolves('worker-id'),
      };
      sails.enrichmentBoss = boss;

      await GlbThumbnailQueueService.start();

      should(boss.createQueue.calledOnce).be.true();
      const [queueName, queueOptions] = boss.createQueue.firstCall.args;
      should(queueName).equal('glb-thumbnail');
      should(queueOptions).have.properties({ retryLimit: 2 });
      // Longer than the render worker timeout, with room for the transfers
      should(queueOptions.expireInSeconds).be.aboveOrEqual(5 * 60);
      should(boss.work.calledOnce).be.true();
      should(boss.work.firstCall.args).eql([
        'glb-thumbnail',
        GlbThumbnailQueueService.processJob,
      ]);
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      await should(GlbThumbnailQueueService.start()).be.fulfilled();
    });
  });

  describe('enqueue()', () => {
    it('sends one job per file', async () => {
      const boss = { send: sinon.stub().resolves('job-id') };
      sails.enrichmentBoss = boss;

      await GlbThumbnailQueueService.enqueue(42);

      should(boss.send.calledOnce).be.true();
      should(boss.send.firstCall.args).eql([
        'glb-thumbnail',
        { fileId: 42 },
        { singletonKey: 'file-42' },
      ]);
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      await should(GlbThumbnailQueueService.enqueue(42)).be.fulfilled();
    });
  });

  describe('processJob()', () => {
    it('processes the file of each job and skips jobs without one', async () => {
      const processFile = sinon
        .stub(GlbThumbnailQueueService, 'processFile')
        .resolves();
      sinon.stub(sails.log, 'warn');

      await GlbThumbnailQueueService.processJob([
        { id: 'a', data: { fileId: 1 } },
        { id: 'b' },
        { id: 'c', data: { fileId: 3 } },
      ]);

      should(processFile.args).eql([[1], [3]]);
    });

    it('rethrows a file failure so pg-boss retries the job', async () => {
      sinon
        .stub(GlbThumbnailQueueService, 'processFile')
        .rejects(new Error('storage down'));
      await should(
        GlbThumbnailQueueService.processJob([{ id: 'a', data: { fileId: 1 } }])
      ).be.rejectedWith('storage down');
    });
  });

  describe('processFile()', () => {
    let file;
    let blobs;
    let downloadToBuffer;
    let uploadData;

    beforeEach(async () => {
      file = await TFile.create({
        dateInscription: new Date(),
        fileName: 'cave-scan.glb',
        document: 1,
        fileFormat: GLB_FORMAT_ID,
        path: '123-cave-scan.glb',
        isValidated: true,
      }).fetch();

      blobs = { '123-cave-scan.glb': Buffer.from(await cubeGlb()) };
      downloadToBuffer = sinon.stub().callsFake(async function download() {
        if (!(this.path in blobs)) throw new Error('BlobNotFound');
        return blobs[this.path];
      });
      uploadData = sinon.stub().resolves();
      FileService.setCredentialsForTest({
        documentsBlobClient: {
          getBlockBlobClient: (blobPath) => ({
            path: blobPath,
            downloadToBuffer,
            uploadData: (buffer, options) => uploadData(blobPath, options),
          }),
        },
      });
    });

    afterEach(async () => {
      await TFile.destroyOne(file.id);
    });

    it('renders the model and stores its three thumbnails', async function renders() {
      this.timeout(20000);
      await GlbThumbnailQueueService.processFile(file.id);

      const updated = await TFile.findOne(file.id);
      should(updated).have.properties({
        thumbnailSmall: 'thumbnails/small/123-cave-scan.webp',
        thumbnailMedium: 'thumbnails/medium/123-cave-scan.webp',
        thumbnailLarge: 'thumbnails/large/123-cave-scan.webp',
      });
      should(uploadData.args.map(([blobPath]) => blobPath).sort()).eql([
        'thumbnails/large/123-cave-scan.webp',
        'thumbnails/medium/123-cave-scan.webp',
        'thumbnails/small/123-cave-scan.webp',
      ]);
      uploadData.args.forEach(([, options]) =>
        should(options.blobHTTPHeaders.blobContentType).equal('image/webp')
      );
    });

    it('gives up without error when the model cannot be rendered', async () => {
      blobs['123-cave-scan.glb'] = Buffer.from('not a model');
      sinon.stub(sails.log, 'error');

      await GlbThumbnailQueueService.processFile(file.id);

      const updated = await TFile.findOne(file.id);
      should(updated.thumbnailSmall).be.null();
      should(updated.thumbnailMedium).be.null();
      should(updated.thumbnailLarge).be.null();
      should(uploadData.called).be.false();
    });

    it('does nothing for a file that no longer exists', async () => {
      sinon.stub(sails.log, 'info');
      await GlbThumbnailQueueService.processFile(file.id + 1000000);
      should(downloadToBuffer.called).be.false();
    });

    it('throws when the model cannot be downloaded', async () => {
      delete blobs['123-cave-scan.glb'];
      await should(
        GlbThumbnailQueueService.processFile(file.id)
      ).be.rejectedWith('BlobNotFound');
    });

    it('throws when the thumbnails cannot be uploaded', async function uploadFails() {
      this.timeout(20000);
      uploadData.rejects(new Error('upload failed'));
      sinon.stub(sails.log, 'error');

      await should(
        GlbThumbnailQueueService.processFile(file.id)
      ).be.rejectedWith(/Thumbnail upload failed/);

      const updated = await TFile.findOne(file.id);
      should(updated.thumbnailSmall).be.null();
    });
  });
});
