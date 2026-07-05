const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');
const ThumbnailService = require('../../../api/services/ThumbnailService');

describe('ThumbnailService', () => {
  describe('isProcessable', () => {
    it('should return true for image/jpeg', () => {
      should(ThumbnailService.isProcessable('image/jpeg')).be.true();
    });

    it('should return true for image/png', () => {
      should(ThumbnailService.isProcessable('image/png')).be.true();
    });

    it('should return true for image/gif', () => {
      should(ThumbnailService.isProcessable('image/gif')).be.true();
    });

    it('should return true for image/tiff', () => {
      should(ThumbnailService.isProcessable('image/tiff')).be.true();
    });

    it('should return true for image/x-ms-bmp', () => {
      should(ThumbnailService.isProcessable('image/x-ms-bmp')).be.true();
    });

    it('should return false for image/svg+xml', () => {
      should(ThumbnailService.isProcessable('image/svg+xml')).be.false();
    });

    it('should return false for image/pcx', () => {
      should(ThumbnailService.isProcessable('image/pcx')).be.false();
    });

    it('should return false for image/vnd.dxf', () => {
      should(ThumbnailService.isProcessable('image/vnd.dxf')).be.false();
    });

    it('should return false for application/pdf', () => {
      should(ThumbnailService.isProcessable('application/pdf')).be.false();
    });

    it('should return false for text/plain', () => {
      should(ThumbnailService.isProcessable('text/plain')).be.false();
    });

    it('should return false for undefined', () => {
      should(ThumbnailService.isProcessable(undefined)).be.false();
    });

    it('should return false for null', () => {
      should(ThumbnailService.isProcessable(null)).be.false();
    });
  });

  describe('computeThumbnailPath', () => {
    it('should replace extension with .webp and prepend thumbnails/<variant>/', () => {
      const result = ThumbnailService.computeThumbnailPath(
        'small',
        '12345-cave-entrance.jpg'
      );
      should(result).equal('thumbnails/small/12345-cave-entrance.webp');
    });

    it('should handle png extension', () => {
      const result = ThumbnailService.computeThumbnailPath(
        'medium',
        '99999-photo.png'
      );
      should(result).equal('thumbnails/medium/99999-photo.webp');
    });

    it('should handle multiple dots in path (replace only last extension)', () => {
      const result = ThumbnailService.computeThumbnailPath(
        'large',
        '12345-file.name.with.dots.tiff'
      );
      should(result).equal('thumbnails/large/12345-file.name.with.dots.webp');
    });

    it('should handle all three variant names', () => {
      const variants = ['small', 'medium', 'large'];
      variants.forEach((variant) => {
        const result = ThumbnailService.computeThumbnailPath(
          variant,
          'test.jpg'
        );
        should(result).startWith(`thumbnails/${variant}/`);
        should(result).endWith('.webp');
      });
    });
  });

  describe('getApplicableVariants', () => {
    it('should return all 3 variants for width > 1920', () => {
      const result = ThumbnailService.getApplicableVariants(2000);
      should(result.length).equal(3);
      should(result.map((v) => v.name)).deepEqual(['small', 'medium', 'large']);
    });

    it('should return small and medium for width between 1281 and 1920', () => {
      const result = ThumbnailService.getApplicableVariants(1500);
      should(result.length).equal(2);
      should(result.map((v) => v.name)).deepEqual(['small', 'medium']);
    });

    it('should return only small for width between 481 and 1280', () => {
      const result = ThumbnailService.getApplicableVariants(800);
      should(result.length).equal(1);
      should(result[0].name).equal('small');
    });

    it('should return empty array for width <= 480', () => {
      const result = ThumbnailService.getApplicableVariants(480);
      should(result.length).equal(0);
    });

    it('should return empty array for width = 1', () => {
      const result = ThumbnailService.getApplicableVariants(1);
      should(result.length).equal(0);
    });

    it('should return empty array for width exactly equal to small variant', () => {
      const result = ThumbnailService.getApplicableVariants(480);
      should(result.length).equal(0);
    });

    it('should return small for width = 481', () => {
      const result = ThumbnailService.getApplicableVariants(481);
      should(result.length).equal(1);
      should(result[0].name).equal('small');
    });
  });

  describe('resize', () => {
    it('should produce a smaller WebP buffer from a JPEG input', async () => {
      // Create a test JPEG image (2000x1000 red rectangle)
      const inputBuffer = await sharp({
        create: {
          width: 2000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ThumbnailService.resize(inputBuffer, 480);

      // Result should be a Buffer
      should(result).be.an.instanceOf(Buffer);

      // Verify it's WebP
      const metadata = await sharp(result).metadata();
      should(metadata.format).equal('webp');
      should(metadata.width).equal(480);
      // Height should be proportional: 480/2000 * 1000 = 240
      should(metadata.height).equal(240);
    });

    it('should preserve alpha channel from PNG input', async () => {
      // Create a PNG with alpha channel
      const inputBuffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer();

      const result = await ThumbnailService.resize(inputBuffer, 480);

      const metadata = await sharp(result).metadata();
      should(metadata.format).equal('webp');
      should(metadata.hasAlpha).be.true();
      should(metadata.width).equal(480);
    });

    it('should produce output smaller than or equal to target width', async () => {
      const inputBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 0, g: 128, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ThumbnailService.resize(inputBuffer, 480);

      const metadata = await sharp(result).metadata();
      should(metadata.width).be.belowOrEqual(480);
    });
  });

  describe('generate', () => {
    let mockBlobClient;
    let uploadedBlobs;

    beforeEach(() => {
      uploadedBlobs = {};
      mockBlobClient = {
        getBlockBlobClient: (blobPath) => ({
          uploadData: async (buffer, options) => {
            uploadedBlobs[blobPath] = { buffer, options };
          },
        }),
      };
    });

    it('should return all-null when image width <= 480', async () => {
      // Create a tiny image (200x100)
      const inputBuffer = await sharp({
        create: {
          width: 200,
          height: 100,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ThumbnailService.generate(
        inputBuffer,
        'tiny-image.jpg',
        mockBlobClient
      );

      should(result.small).be.null();
      should(result.medium).be.null();
      should(result.large).be.null();
      should(Object.keys(uploadedBlobs).length).equal(0);
    });

    it('should skip large variant when width is 1500px', async () => {
      const inputBuffer = await sharp({
        create: {
          width: 1500,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 0, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ThumbnailService.generate(
        inputBuffer,
        '12345-photo.jpg',
        mockBlobClient
      );

      should(result.small).equal('thumbnails/small/12345-photo.webp');
      should(result.medium).equal('thumbnails/medium/12345-photo.webp');
      should(result.large).be.null();
      should(Object.keys(uploadedBlobs).length).equal(2);
    });

    it('should generate all three variants for a wide image', async () => {
      const inputBuffer = await sharp({
        create: {
          width: 3000,
          height: 2000,
          channels: 3,
          background: { r: 255, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ThumbnailService.generate(
        inputBuffer,
        '99999-cave.jpg',
        mockBlobClient
      );

      should(result.small).equal('thumbnails/small/99999-cave.webp');
      should(result.medium).equal('thumbnails/medium/99999-cave.webp');
      should(result.large).equal('thumbnails/large/99999-cave.webp');
      should(Object.keys(uploadedBlobs).length).equal(3);

      // Verify content type headers
      Object.values(uploadedBlobs).forEach(({ options }) => {
        should(options.blobHTTPHeaders.blobContentType).equal('image/webp');
      });
    });

    it('should return all-null when upload fails (all-or-nothing)', async () => {
      const inputBuffer = await sharp({
        create: {
          width: 2000,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const failingBlobClient = {
        getBlockBlobClient: () => ({
          uploadData: async () => {
            throw new Error('Azure upload failed');
          },
        }),
      };

      // Stub sails.log.error to suppress test noise
      const logStub = sinon.stub(sails.log, 'error');

      const result = await ThumbnailService.generate(
        inputBuffer,
        'fail-test.jpg',
        failingBlobClient
      );

      should(result.small).be.null();
      should(result.medium).be.null();
      should(result.large).be.null();

      logStub.restore();
    });

    it('should return all-null for a corrupted buffer', async () => {
      const corruptedBuffer = Buffer.from('not an image at all');

      const logStub = sinon.stub(sails.log, 'error');

      const result = await ThumbnailService.generate(
        corruptedBuffer,
        'corrupted.jpg',
        mockBlobClient
      );

      should(result.small).be.null();
      should(result.medium).be.null();
      should(result.large).be.null();

      logStub.restore();
    });
  });
});
