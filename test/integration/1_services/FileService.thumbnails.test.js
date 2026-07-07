const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');
const FileService = require('../../../api/services/FileService');

describe('FileService.document - Thumbnail Integration', () => {
  let mockUploadData;
  let mockDeleteBlob;
  let mockContainerClient;
  let originalIsCredentials;
  let originalCredentials;

  before(() => {
    // Save original state to restore later
    originalIsCredentials = FileService.isCredentials;
    originalCredentials = FileService.getCredentialsForTest();

    mockUploadData = sinon.stub().resolves();
    mockDeleteBlob = sinon.stub().resolves();

    mockContainerClient = {
      getBlockBlobClient: (blobPath) => ({
        uploadData: async (buffer, options) =>
          mockUploadData(blobPath, buffer, options),
        delete: async (options) => mockDeleteBlob(blobPath, options),
      }),
    };

    // Inject mock credentials so the real create/delete code paths run
    FileService.setCredentialsForTest({
      documentsBlobClient: mockContainerClient,
    });
  });

  beforeEach(() => {
    mockUploadData.resetHistory();
    mockDeleteBlob.resetHistory();
  });

  after(() => {
    // Restore original credentials state
    FileService.setCredentialsForTest(originalCredentials);
    FileService.isCredentials = originalIsCredentials;
    sinon.restore();
  });

  describe('create() with image file', () => {
    let createdFile;

    afterEach(async () => {
      if (createdFile) {
        await TFile.destroyOne(createdFile.id);
        createdFile = null;
      }
    });

    it('should generate thumbnail paths for a JPEG image', async () => {
      // Create a 2000x1000 JPEG test image
      const imageBuffer = await sharp({
        create: {
          width: 2000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const file = {
        originalname: 'test-cave.jpg',
        buffer: imageBuffer,
        size: imageBuffer.length,
      };

      createdFile = await FileService.document.create(file, 1, true);

      should(createdFile.thumbnailSmall).be.a.String();
      should(createdFile.thumbnailSmall).startWith('thumbnails/small/');
      should(createdFile.thumbnailSmall).endWith('.webp');

      should(createdFile.thumbnailMedium).be.a.String();
      should(createdFile.thumbnailMedium).startWith('thumbnails/medium/');
      should(createdFile.thumbnailMedium).endWith('.webp');

      // 2000 > 1920, so large IS generated
      should(createdFile.thumbnailLarge).be.a.String();
      should(createdFile.thumbnailLarge).startWith('thumbnails/large/');
      should(createdFile.thumbnailLarge).endWith('.webp');
    });

    it('should skip large variant when image width <= 1920', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 1500,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 128, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const file = {
        originalname: 'medium-cave.jpg',
        buffer: imageBuffer,
        size: imageBuffer.length,
      };

      createdFile = await FileService.document.create(file, 1, true);

      should(createdFile.thumbnailSmall).be.a.String();
      should(createdFile.thumbnailMedium).be.a.String();
      should(createdFile.thumbnailLarge).be.null();
    });
  });

  describe('create() with non-image file', () => {
    it('should have null thumbnails for PDF', async () => {
      const file = {
        originalname: 'document.pdf',
        buffer: Buffer.from('fake pdf content'),
        size: 16,
      };

      const result = await FileService.document.create(file, 1, true);

      should(result.thumbnailSmall).be.null();
      should(result.thumbnailMedium).be.null();
      should(result.thumbnailLarge).be.null();

      await TFile.destroyOne(result.id);
    });

    it('should have null thumbnails for SVG (not processable)', async () => {
      const file = {
        originalname: 'survey.svg',
        buffer: Buffer.from('<svg></svg>'),
        size: 11,
      };

      const result = await FileService.document.create(file, 1, true);

      should(result.thumbnailSmall).be.null();
      should(result.thumbnailMedium).be.null();
      should(result.thumbnailLarge).be.null();

      await TFile.destroyOne(result.id);
    });
  });

  describe('create() with thumbnail generation failure', () => {
    it('should still succeed with null thumbnails when sharp fails', async () => {
      // Stub the global ThumbnailService.generate (Sails auto-globalized)
      const generateStub = sinon
        .stub(global.ThumbnailService, 'generate')
        .rejects(new Error('sharp exploded'));
      const logStub = sinon.stub(sails.log, 'error');

      const imageBuffer = await sharp({
        create: {
          width: 2000,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      const file = {
        originalname: 'failing-image.jpg',
        buffer: imageBuffer,
        size: imageBuffer.length,
      };

      const result = await FileService.document.create(file, 1, true);

      should(result.thumbnailSmall).be.null();
      should(result.thumbnailMedium).be.null();
      should(result.thumbnailLarge).be.null();
      should(result.fileName).equal('failing-image.jpg');

      generateStub.restore();
      logStub.restore();
      await TFile.destroyOne(result.id);
    });
  });

  describe('delete() with thumbnails', () => {
    it('should delete thumbnail blobs when present', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 2000,
          height: 1000,
          channels: 3,
          background: { r: 128, g: 0, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const file = {
        originalname: 'to-delete.jpg',
        buffer: imageBuffer,
        size: imageBuffer.length,
      };

      const created = await FileService.document.create(file, 1, true);

      // Reset to track delete calls
      mockDeleteBlob.resetHistory();

      const deleted = await FileService.document.delete(created);

      should(deleted.id).equal(created.id);

      // Should have called delete for: original + 3 thumbnails = 4 calls
      // (small, medium, large all generated for 2000px wide image)
      should(mockDeleteBlob.callCount).equal(4);
    });

    it('should not attempt thumbnail deletion for non-image files', async () => {
      const file = {
        originalname: 'no-thumbs.pdf',
        buffer: Buffer.from('pdf content'),
        size: 11,
      };

      const created = await FileService.document.create(file, 1, true);
      mockDeleteBlob.resetHistory();

      await FileService.document.delete(created);

      // Only the original blob should be deleted
      should(mockDeleteBlob.callCount).equal(1);
    });
  });
});
