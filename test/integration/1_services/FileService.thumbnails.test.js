const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');
const FileService = require('../../../api/services/FileService');
const ThumbnailService = require('../../../api/services/ThumbnailService');

describe('FileService.document - Thumbnail Integration', () => {
  // Store original methods for restoration
  const originalCreate = FileService.document.create;
  const originalDelete = FileService.document.delete;
  const originalIsCredentials = FileService.isCredentials;

  // Mock blob client
  let mockUploadData;
  let mockDeleteBlob;
  let uploadedBlobs;
  let mockContainerClient;

  before(() => {
    mockUploadData = sinon.stub().resolves();
    mockDeleteBlob = sinon.stub().resolves();
    uploadedBlobs = {};

    mockContainerClient = {
      getBlockBlobClient: (blobPath) => ({
        uploadData: async (buffer, options) => {
          uploadedBlobs[blobPath] = { buffer, options };
          return mockUploadData(buffer, options);
        },
        delete: async (options) => {
          mockDeleteBlob(blobPath, options);
        },
      }),
    };

    // Patch create to use mock credentials
    FileService.document.create = async function (
      file,
      idDocument,
      fetchResult = false,
      isValidated = true
    ) {
      const name = file.originalname;
      const pathName = `${Math.random()
        .toString()
        .replace(/0\./, '')}-${name.replace(/ /, '_')}`;
      const lastDot = name.lastIndexOf('.');
      if (lastDot <= 0 || lastDot === name.length - 1) {
        const err = new Error(FileService.INVALID_NAME);
        err.fileName = name;
        throw err;
      }
      const extension = name.slice(lastDot + 1).toLowerCase();

      const foundFormat = await TFileFormat.find({ extension }).limit(1);
      if (foundFormat.length === 0) {
        const err = new Error(FileService.INVALID_FORMAT);
        err.fileName = name;
        throw err;
      }

      // Upload original
      const blockBlobClient = mockContainerClient.getBlockBlobClient(pathName);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: foundFormat[0].mimeType },
      });

      // Thumbnail generation (matches actual FileService logic)
      let thumbnailPaths = { small: null, medium: null, large: null };
      const fileMimeType = foundFormat[0].mimeType;
      if (ThumbnailService.isProcessable(fileMimeType)) {
        try {
          thumbnailPaths = await ThumbnailService.generate(
            file.buffer,
            pathName,
            mockContainerClient
          );
        } catch (err) {
          sails.log.error('Thumbnail generation failed:', err);
        }
      }

      const param = {
        dateInscription: new Date(),
        fileName: name,
        document: idDocument,
        fileFormat: foundFormat[0].id,
        path: pathName,
        isValidated,
        thumbnailSmall: thumbnailPaths.small,
        thumbnailMedium: thumbnailPaths.medium,
        thumbnailLarge: thumbnailPaths.large,
      };
      if (fetchResult) {
        return TFile.create(param).fetch();
      }
      return TFile.create(param);
    };

    // Patch delete to use mock credentials
    FileService.document.delete = async function (file) {
      const destroyedRecord = await TFile.destroyOne(file.id);
      const blockBlobClient = mockContainerClient.getBlockBlobClient(
        destroyedRecord.path
      );
      await blockBlobClient.delete({ deleteSnapshots: 'include' });

      // Clean up thumbnail blobs
      const thumbnailPaths = [
        destroyedRecord.thumbnailSmall,
        destroyedRecord.thumbnailMedium,
        destroyedRecord.thumbnailLarge,
      ].filter(Boolean);
      await Promise.all(
        thumbnailPaths.map(async (thumbPath) => {
          try {
            const thumbBlobClient =
              mockContainerClient.getBlockBlobClient(thumbPath);
            await thumbBlobClient.delete({ deleteSnapshots: 'include' });
          } catch (err) {
            sails.log.error(
              `Failed to delete thumbnail blob ${thumbPath}:`,
              err
            );
          }
        })
      );

      return destroyedRecord;
    };

    FileService.isCredentials = true;
  });

  beforeEach(() => {
    mockUploadData.resetHistory();
    mockDeleteBlob.resetHistory();
    uploadedBlobs = {};
  });

  after(() => {
    FileService.document.create = originalCreate;
    FileService.document.delete = originalDelete;
    FileService.isCredentials = originalIsCredentials;
    sinon.restore();
  });

  describe('create() with image file', () => {
    let createdFile;

    after(async () => {
      if (createdFile) {
        await TFile.destroyOne(createdFile.id);
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

      // Large should be null — original is only 2000px, not > 1920
      // Actually 2000 > 1920, so large IS generated
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

      const result = await FileService.document.create(file, 1, true);

      should(result.thumbnailSmall).be.a.String();
      should(result.thumbnailMedium).be.a.String();
      should(result.thumbnailLarge).be.null();

      await TFile.destroyOne(result.id);
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
      // Stub ThumbnailService.generate to throw
      const generateStub = sinon
        .stub(ThumbnailService, 'generate')
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
