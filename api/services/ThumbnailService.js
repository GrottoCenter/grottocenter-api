/**
 * ThumbnailService.js
 *
 * @description :: Service for generating image thumbnails using sharp.
 *   Encapsulates resize + WebP conversion logic and Azure upload for variants.
 */

const sharp = require('sharp');
const path = require('path');

/**
 * MIME types that sharp can process for thumbnail generation.
 * Excludes SVG (rasterization unreliable), PCX, DXF (unsupported by sharp).
 * Note: image/webp is excluded because webp is not registered in t_file_format,
 * so webp uploads are rejected before reaching this code.
 */
const PROCESSABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/tiff',
  'image/x-ms-bmp',
]);

const VARIANTS = [
  { name: 'small', width: 480 },
  { name: 'medium', width: 1280 },
  { name: 'large', width: 1920 },
];

const WEBP_QUALITY = 80;

module.exports = {
  PROCESSABLE_MIME_TYPES,
  VARIANTS,
  WEBP_QUALITY,

  /**
   * Determine if a MIME type is processable for thumbnails.
   * @param {string} mimeType
   * @returns {boolean}
   */
  isProcessable(mimeType) {
    return PROCESSABLE_MIME_TYPES.has(mimeType);
  },

  /**
   * Compute the thumbnail blob path for a given variant and original path.
   * @param {string} variant - 'small' | 'medium' | 'large'
   * @param {string} originalPath - e.g. '12345-cave-entrance.jpg'
   * @returns {string} e.g. 'thumbnails/small/12345-cave-entrance.webp'
   */
  computeThumbnailPath(variant, originalPath) {
    const ext = path.extname(originalPath);
    const stem = originalPath.slice(0, originalPath.length - ext.length);
    return `thumbnails/${variant}/${stem}.webp`;
  },

  /**
   * Determine which variants should be generated based on original width.
   * Only returns variants whose target width is strictly less than the original.
   * @param {number} originalWidth - Width of the source image in pixels
   * @returns {Array<{name: string, width: number}>}
   */
  getApplicableVariants(originalWidth) {
    return VARIANTS.filter((v) => v.width < originalWidth);
  },

  /**
   * Resize an image buffer to the target width, output as WebP.
   * Preserves aspect ratio (no crop, no upscaling).
   * Preserves alpha channel for PNG inputs and animation for GIF inputs.
   * Applies EXIF orientation before resizing so portrait photos shot on a
   * phone are not stored rotated. The orientation tag is dropped from the
   * output (the pixels are already upright, so browsers need no correction).
   * @param {Buffer} inputBuffer - The original image buffer
   * @param {number} targetWidth - The target width in pixels
   * @returns {Promise<Buffer>} The resized WebP buffer
   */
  async resize(inputBuffer, targetWidth) {
    return sharp(inputBuffer, { animated: true })
      .autoOrient() // rotate/flip pixels per EXIF Orientation, then drop the tag
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  },

  /**
   * Generate all applicable thumbnail variants for an image.
   * Uses an all-or-nothing approach: generates all buffers first, then uploads.
   * If any step fails, returns all nulls with hadError: true.
   *
   * Variant selection is based on the upright (post-EXIF-orientation) width so
   * that portrait photos stored in landscape pixel layout are measured correctly.
   *
   * @param {Buffer} imageBuffer - The original image file buffer
   * @param {string} originalPath - The blob path of the original
   * @param {object} blobClient - Azure container client for uploading
   * @returns {Promise<{small: string|null, medium: string|null, large: string|null, hadError: boolean}>}
   */
  async generate(imageBuffer, originalPath, blobClient) {
    const result = { small: null, medium: null, large: null, hadError: false };

    try {
      const metadata = await sharp(imageBuffer, {
        limitInputPixels: 100 * 1024 * 1024, // 100 megapixels max
      }).metadata();
      // Use the oriented (upright) width so portrait photos whose stored pixels
      // are landscape (e.g. EXIF Orientation 6/8) are measured correctly.
      // metadata.autoOrient is available since sharp 0.34 and falls back to
      // the stored dimensions when no orientation tag is present.
      const originalWidth = (metadata.autoOrient || metadata).width;

      if (!originalWidth) {
        return result;
      }

      const applicableVariants = this.getApplicableVariants(originalWidth);

      if (applicableVariants.length === 0) {
        return result;
      }

      // Generate all buffers first (fail-fast before uploading)
      const buffers = await Promise.all(
        applicableVariants.map(async (variant) => ({
          name: variant.name,
          buffer: await this.resize(imageBuffer, variant.width),
          path: this.computeThumbnailPath(variant.name, originalPath),
        }))
      );

      // Upload all variants
      // NOTE: If a subset of uploads succeeds before one fails, the successful
      // uploads become orphaned blobs in Azure (the catch block returns all-null,
      // so the DB never stores those paths and FileService.document.delete won't
      // clean them up). This is a known trade-off: orphaned blobs are rare and
      // low-cost compared to the complexity of per-variant rollback. A periodic
      // storage cleanup job could address this if it becomes a concern.
      await Promise.all(
        buffers.map(async ({ path: blobPath, buffer }) => {
          const blockBlobClient = blobClient.getBlockBlobClient(blobPath);
          await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: 'image/webp' },
          });
        })
      );

      // All uploads succeeded — populate result
      buffers.forEach(({ name, path: blobPath }) => {
        result[name] = blobPath;
      });
    } catch (err) {
      sails.log.error('ThumbnailService.generate failed:', err);
      return { small: null, medium: null, large: null, hadError: true };
    }

    return result;
  },
};
