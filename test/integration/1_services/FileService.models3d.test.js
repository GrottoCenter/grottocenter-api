const should = require('should');
const sinon = require('sinon');
const FileService = require('../../../api/services/FileService');

describe('FileService.document - 3D model formats', () => {
  let mockUploadData;
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
  });

  afterEach(async () => {
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
});
