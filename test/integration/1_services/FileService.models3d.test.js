const should = require('should');
const sinon = require('sinon');
const FileService = require('../../../api/services/FileService');

describe('FileService.document - 3D model formats', () => {
  let mockUploadData;
  let enqueue;
  let originalCredentials;
  const createdIds = [];

  before(() => {
    originalCredentials = FileService.getCredentialsForTest();
    mockUploadData = sinon.stub().resolves();
    // Inject mock credentials so the real create code path runs
    FileService.setCredentialsForTest({
      documentsBlobClient: {
        getBlockBlobClient: (blobPath) => ({
          uploadData: async (buffer, options) =>
            mockUploadData(blobPath, buffer, options),
        }),
      },
    });
  });

  beforeEach(() => {
    mockUploadData.resetHistory();
    enqueue = sinon.stub(global.GlbThumbnailQueueService, 'enqueue').resolves();
  });

  afterEach(async () => {
    enqueue.restore();
    await Promise.all(createdIds.map((id) => TFile.destroyOne(id)));
    createdIds.length = 0;
  });

  after(() => {
    FileService.setCredentialsForTest(originalCredentials);
    sinon.restore();
  });

  const upload = async (originalname) => {
    const buffer = Buffer.from('model content');
    const created = await FileService.document.create(
      { originalname, buffer, size: buffer.length },
      1,
      true
    );
    createdIds.push(created.id);
    return created;
  };

  const storedContentType = () =>
    mockUploadData.firstCall.args[2].blobHTTPHeaders.blobContentType;

  it('should accept a GLB file and store it as model/gltf-binary', async () => {
    const created = await upload('cave-scan.glb');
    should(created.fileName).equal('cave-scan.glb');
    should(created.path).endWith('-cave-scan.glb');
    should(storedContentType()).equal('model/gltf-binary');
  });

  it('should accept a glTF file and store it as model/gltf+json', async () => {
    const created = await upload('cave-scan.gltf');
    should(created.fileName).equal('cave-scan.gltf');
    should(storedContentType()).equal('model/gltf+json');
  });

  it('should match the extension case-insensitively', async () => {
    await upload('CAVE-SCAN.GLB');
    should(storedContentType()).equal('model/gltf-binary');
  });

  it('should still reject an unsupported 3D extension', async () => {
    try {
      await upload('cave-scan.fbx');
      should.fail('Should have thrown INVALID_FORMAT');
    } catch (err) {
      should(err.message).equal(FileService.INVALID_FORMAT);
      should(err.fileName).equal('cave-scan.fbx');
    }
    should(mockUploadData.called).be.false();
  });

  describe('GLB preview thumbnails', () => {
    it('enqueues the thumbnail generation of a GLB file', async () => {
      const created = await upload('cave-scan.glb');
      should(enqueue.calledOnce).be.true();
      should(enqueue.firstCall.args).eql([created.id]);
      // Rendering happens later: the upload returns without thumbnails
      should(created.thumbnailSmall).be.null();
    });

    it('does not enqueue anything for a glTF file', async () => {
      await upload('cave-scan.gltf');
      should(enqueue.called).be.false();
    });

    it('does not enqueue anything for other files', async () => {
      await upload('survey.pdf');
      should(enqueue.called).be.false();
    });

    it('still creates the file when the job cannot be enqueued', async () => {
      enqueue.rejects(new Error('queue down'));
      const logError = sinon.stub(sails.log, 'error');
      const created = await upload('cave-scan.glb');
      logError.restore();
      should(created.fileName).equal('cave-scan.glb');
      should(await TFile.findOne(created.id)).be.ok();
    });

    it('does not enqueue a file created inside a transaction', async () => {
      const buffer = Buffer.from('model content');
      await sails.getDatastore().transaction(async (db) => {
        const created = await FileService.document.create(
          { originalname: 'cave-scan.glb', buffer, size: buffer.length },
          1,
          true,
          true,
          db
        );
        createdIds.push(created.id);
      });
      should(enqueue.called).be.false();
    });
  });
});
