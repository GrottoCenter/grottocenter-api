/**
 * AvatarService.js
 *
 * @description :: Avatars of cavers and organizations (#1730). An uploaded
 *   image is decoded and re-encoded as a square WebP before it is stored, so
 *   what is served is always a small raster image the server produced: no
 *   SVG, no script-bearing polyglot, no EXIF metadata (GPS position of a photo
 *   taken at home, for instance).
 */

const crypto = require('crypto');
const sharp = require('sharp');

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 50 * 1024 * 1024;
const AVATAR_SIZE = 512;
const AVATAR_MIME_TYPE = 'image/webp';
const WEBP_QUALITY = 80;

// sharp format names (metadata().format) accepted as input
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif']);

const OWNERS = {
  caver: { folder: 'cavers', getModel: () => TCaver },
  organization: { folder: 'organizations', getModel: () => TGrotto },
};

const INVALID_IMAGE = 'INVALID_IMAGE';

class AvatarError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Check an uploaded multer file before decoding it.
 * @param {object|null|undefined} file - multer file
 * @returns {string|null} an error message for a 400, or null
 */
const validateUpload = (file) => {
  if (!file) {
    return 'You must provide an image in the "file" field.';
  }
  if (!file.size || !file.buffer?.length) {
    return 'The uploaded image is empty.';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `The image must not exceed ${MAX_AVATAR_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
};

/**
 * Decode an image and re-encode it as a square WebP avatar.
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 * @throws {AvatarError} INVALID_IMAGE when the buffer is not an accepted image
 */
const encode = async (buffer) => {
  let metadata;
  try {
    metadata = await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch (err) {
    throw new AvatarError(INVALID_IMAGE, 'The file is not a readable image.');
  }
  if (!ACCEPTED_FORMATS.has(metadata.format)) {
    throw new AvatarError(
      INVALID_IMAGE,
      'The image must be a JPEG, PNG, WebP or GIF file.'
    );
  }
  // The square side is the short edge once oriented, capped at AVATAR_SIZE:
  // a cover resize to that side center-crops without ever enlarging.
  const { width, height } = metadata.autoOrient ?? metadata;
  const side = Math.min(AVATAR_SIZE, width, height);
  try {
    // Only the first frame of an animated image is kept
    return await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .autoOrient()
      .resize(side, side, { fit: 'cover' })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    throw new AvatarError(INVALID_IMAGE, 'The file is not a readable image.');
  }
};

const buildPath = (owner, id) =>
  `avatars/${OWNERS[owner].folder}/${id}-${crypto
    .randomBytes(8)
    .toString('hex')}.webp`;

module.exports = {
  MAX_AVATAR_BYTES,
  AVATAR_SIZE,
  INVALID_IMAGE,
  AvatarError,
  validateUpload,
  encode,

  /**
   * @param {string|null|undefined} avatarPath
   * @returns {string|null} the public URL of the avatar
   */
  getUrl: (avatarPath) =>
    avatarPath ? FileService.avatar.getUrl(avatarPath) : null,

  /**
   * Replace the avatar of a caver or an organization. The new image gets a
   * new path, so a cached URL never shows a stale image, and the previous one
   * is removed once the record points to the new one.
   * @param {'caver'|'organization'} owner
   * @param {number} id
   * @param {Buffer} buffer - The uploaded image
   * @param {object} [extraValues] - Other values set with the new path
   * @returns {Promise<string>} the new avatar path
   * @throws {AvatarError} when the image is not accepted
   */
  async setAvatar(owner, id, buffer, extraValues = {}) {
    const Model = OWNERS[owner].getModel();
    const encoded = await encode(buffer);
    const previous = await Model.findOne({ id }).select(['avatarPath']);
    const avatarPath = buildPath(owner, id);
    await FileService.avatar.upload(encoded, avatarPath, AVATAR_MIME_TYPE);
    try {
      await Model.updateOne({ id }).set({ ...extraValues, avatarPath });
    } catch (err) {
      await FileService.avatar.delete(avatarPath);
      sails.log.error(err);
      throw err;
    }
    if (previous?.avatarPath) {
      await FileService.avatar.delete(previous.avatarPath);
    }
    return avatarPath;
  },

  /**
   * Remove the avatar of a caver or an organization.
   * @param {'caver'|'organization'} owner
   * @param {number} id
   * @param {object} [extraValues] - Other values set with the cleared path
   * @returns {Promise<boolean>} false when there was no avatar to remove
   */
  async removeAvatar(owner, id, extraValues = {}) {
    const Model = OWNERS[owner].getModel();
    const previous = await Model.findOne({ id }).select(['avatarPath']);
    if (!previous?.avatarPath) return false;
    await Model.updateOne({ id }).set({ ...extraValues, avatarPath: null });
    await FileService.avatar.delete(previous.avatarPath);
    return true;
  },
};
