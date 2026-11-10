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
// Compare-and-swap attempts before giving up on a contended record
const MAX_SWAP_ATTEMPTS = 5;

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

/**
 * Point a record to a new avatar path with a compare-and-swap: the update only
 * applies if the record still holds the path just read, and is retried
 * otherwise. Concurrent replacements and removals, possibly on different API
 * instances, then each replace a distinct path, so every image that stops
 * being referenced is returned to exactly one caller, which deletes it.
 * @param {object} Model - TCaver or TGrotto
 * @param {number} id
 * @param {string|null} avatarPath - The new path, null to clear it
 * @param {object} extraValues - Other values set with the new path
 * @param {number} [attempt]
 * @returns {Promise<{found: boolean, previous: string|null}>} whether the
 *   record exists, and the path it held before the swap
 */
const swapAvatarPath = async (
  Model,
  id,
  avatarPath,
  extraValues,
  attempt = 1
) => {
  const current = await Model.findOne({ id }).select(['avatarPath']);
  if (!current) return { found: false, previous: null };
  const previous = current.avatarPath ?? null;
  if (previous === avatarPath) return { found: true, previous: null };
  const updated = await Model.update({ id, avatarPath: previous })
    .set({ ...extraValues, avatarPath })
    .fetch();
  if (updated.length > 0) return { found: true, previous };
  if (attempt >= MAX_SWAP_ATTEMPTS) {
    throw new Error(
      `The avatar of record ${id} changed ${attempt} times during the update.`
    );
  }
  return swapAvatarPath(Model, id, avatarPath, extraValues, attempt + 1);
};

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
   * new path, so a cached URL never shows a stale image, and the image it
   * replaced is removed once the record points to the new one.
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
    const avatarPath = buildPath(owner, id);
    await FileService.avatar.upload(encoded, avatarPath, AVATAR_MIME_TYPE);
    let swap;
    try {
      swap = await swapAvatarPath(Model, id, avatarPath, extraValues);
      if (!swap.found) {
        throw new Error(`No ${owner} of id ${id} to set an avatar on.`);
      }
    } catch (err) {
      await FileService.avatar.delete(avatarPath);
      sails.log.error(err);
      throw err;
    }
    if (swap.previous) {
      await FileService.avatar.delete(swap.previous);
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
    const { previous } = await swapAvatarPath(Model, id, null, extraValues);
    if (!previous) return false;
    await FileService.avatar.delete(previous);
    return true;
  },
};
