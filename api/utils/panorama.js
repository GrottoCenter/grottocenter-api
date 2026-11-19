/**
 * Panorama display settings of a document file (#2007).
 *
 * Supported: complete spherical, equirectangular still images (JPEG, PNG,
 * WebP), opened in a 360-degree viewer by the front end. Partial or
 * cylindrical panoramas, videos and virtual tours are not.
 *
 * Two different checks:
 *
 * - detectPanorama: the default of a new upload without an explicit choice.
 *   It needs Google Photo Sphere (GPano) XMP metadata describing a complete
 *   equirectangular sphere, coherent with the image dimensions. A 2:1 aspect
 *   ratio alone never detects a panorama.
 * - checkManualPanorama: a contributor's explicit `true`. GPano metadata is
 *   optional, but the image must be a still image whose dimensions fit a
 *   complete sphere, and known incompatible metadata is rejected.
 *
 * Both work on the facts readImageInfo() reads from the original file, before
 * any transformation.
 */

const sharp = require('sharp');

const INVALID = Symbol('parsePanoramaFlag.INVALID');

const GPANO_NAMESPACE = 'http://ns.google.com/photos/1.0/panorama/';

// Formats a browser displays as a still image and Pannellum can open.
const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

// Equirectangular images are exactly 2:1; one pixel absorbs an odd rounding.
const ASPECT_TOLERANCE_PX = 1;

const REASONS = {
  NOT_AN_IMAGE: 'NOT_AN_IMAGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  NOT_A_STILL_IMAGE: 'NOT_A_STILL_IMAGE',
  NOT_A_COMPLETE_SPHERE: 'NOT_A_COMPLETE_SPHERE',
  UNSUPPORTED_PROJECTION: 'UNSUPPORTED_PROJECTION',
  PARTIAL_COVERAGE: 'PARTIAL_COVERAGE',
  // A stored file that could not be downloaded to check a declaration.
  UNREADABLE_FILE: 'UNREADABLE_FILE',
};

const REASON_MESSAGES = {
  [REASONS.NOT_AN_IMAGE]: 'it is not a readable image',
  [REASONS.UNSUPPORTED_FORMAT]: 'only JPEG, PNG and WebP images are supported',
  [REASONS.NOT_A_STILL_IMAGE]: 'it is an animated image',
  [REASONS.NOT_A_COMPLETE_SPHERE]:
    'its dimensions are not those of a complete equirectangular sphere (width = 2 × height)',
  [REASONS.UNSUPPORTED_PROJECTION]:
    'its panorama metadata declares a projection other than equirectangular',
  [REASONS.PARTIAL_COVERAGE]:
    'its panorama metadata declares a partial panorama',
  [REASONS.UNREADABLE_FILE]: 'the stored file could not be read',
};

/**
 * Strict parsing of an isPanorama flag sent by a client.
 *
 * - `undefined`: not sent.
 * - `true` / `'true'`, `false` / `'false'`: the flag. Multipart bodies only
 *   carry strings, and the string 'false' is never read by truthiness.
 *
 * Anything else, `null` and `''` included, is invalid: there is no reset to
 * automatic detection.
 * @param {*} value
 * @returns {boolean | undefined | symbol} the flag, `undefined` when absent,
 *   or `parsePanoramaFlag.INVALID`
 */
const parsePanoramaFlag = (value) => {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return INVALID;
};
parsePanoramaFlag.INVALID = INVALID;

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GPano properties of an XMP packet, as raw strings, whatever prefix the
 * packet binds to the GPano namespace. Both the attribute form
 * (`GPano:ProjectionType="equirectangular"`) and the element form
 * (`<GPano:ProjectionType>equirectangular</GPano:ProjectionType>`) are read.
 * @param {string|null|undefined} xmp
 * @returns {Object<string, string>|null} null when the packet has no GPano
 *   property
 */
const readGPano = (xmp) => {
  if (typeof xmp !== 'string' || xmp.length === 0) return null;
  const prefixes = new Set();
  const nsRe = new RegExp(
    `xmlns:([A-Za-z_][\\w.-]*)\\s*=\\s*["']${escapeRegExp(GPANO_NAMESPACE)}["']`,
    'g'
  );
  for (const [, prefix] of xmp.matchAll(nsRe)) prefixes.add(prefix);
  if (prefixes.size === 0) return null;

  const properties = {};
  for (const prefix of prefixes) {
    const p = escapeRegExp(prefix);
    const attributeRe = new RegExp(
      `\\b${p}:(\\w+)\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
      'g'
    );
    for (const [, name, dq, sq] of xmp.matchAll(attributeRe))
      properties[name] ??= (dq ?? sq).trim();
    const elementRe = new RegExp(
      `<${p}:(\\w+)(?:\\s[^>]*)?>([^<]*)</${p}:\\1\\s*>`,
      'g'
    );
    for (const [, name, text] of xmp.matchAll(elementRe))
      properties[name] ??= text.trim();
  }
  return Object.keys(properties).length > 0 ? properties : null;
};

// A GPano integer: undefined when absent, NaN when malformed.
const readInteger = (properties, name) => {
  const raw = properties[name];
  if (raw === undefined) return undefined;
  return /^\d+$/.test(raw) ? Number(raw) : NaN;
};

const isTwoToOne = (width, height) =>
  Number.isInteger(width) &&
  Number.isInteger(height) &&
  height > 0 &&
  Math.abs(width - 2 * height) <= ASPECT_TOLERANCE_PX;

/**
 * Projection and coverage declared by GPano metadata.
 * @param {Object<string, string>} gpano
 * @returns {{ projection: string|undefined, malformed: boolean,
 *   complete: boolean|undefined }} complete is undefined when the coverage is
 *   not declared
 */
const readCoverage = (gpano) => {
  const projection = gpano.ProjectionType?.toLowerCase();
  const fullWidth = readInteger(gpano, 'FullPanoWidthPixels');
  const fullHeight = readInteger(gpano, 'FullPanoHeightPixels');
  const croppedWidth = readInteger(gpano, 'CroppedAreaImageWidthPixels');
  const croppedHeight = readInteger(gpano, 'CroppedAreaImageHeightPixels');
  const left = readInteger(gpano, 'CroppedAreaLeftPixels');
  const top = readInteger(gpano, 'CroppedAreaTopPixels');
  const values = [
    fullWidth,
    fullHeight,
    croppedWidth,
    croppedHeight,
    left,
    top,
  ];
  const malformed = values.some((v) => Number.isNaN(v));
  if (malformed || fullWidth === undefined || fullHeight === undefined)
    return { projection, malformed, complete: undefined };

  const complete =
    isTwoToOne(fullWidth, fullHeight) &&
    (croppedWidth ?? fullWidth) === fullWidth &&
    (croppedHeight ?? fullHeight) === fullHeight &&
    (left ?? 0) === 0 &&
    (top ?? 0) === 0;
  return { projection, malformed, complete };
};

const checkStillImage = (info) => {
  if (!info) return REASONS.NOT_AN_IMAGE;
  if (!SUPPORTED_FORMATS.has(info.format)) return REASONS.UNSUPPORTED_FORMAT;
  if (info.pages > 1) return REASONS.NOT_A_STILL_IMAGE;
  return null;
};

/**
 * Whether a new upload without an explicit choice opens in the 360-degree
 * viewer. Missing, malformed, inconsistent or unsupported metadata gives
 * false, never an error.
 * @param {Object|null} info from readImageInfo()
 * @returns {boolean}
 */
const detectPanorama = (info) => {
  if (checkStillImage(info) !== null) return false;
  const gpano = readGPano(info.xmp);
  if (!gpano) return false;
  if (gpano.UsePanoramaViewer !== undefined) {
    const use = gpano.UsePanoramaViewer.toLowerCase();
    if (use !== 'true') return false; // 'false', or malformed
  }
  if (gpano.ProjectionType?.toLowerCase() !== 'equirectangular') return false;
  const { malformed, complete } = readCoverage(gpano);
  if (malformed || complete !== true) return false;
  return isTwoToOne(info.width, info.height);
};

/**
 * Why a file cannot be declared a panorama by a contributor, or null when it
 * can. This validates a declaration; it never detects anything.
 * @param {Object|null} info from readImageInfo()
 * @returns {string|null} one of REASONS
 */
const checkManualPanorama = (info) => {
  const notStill = checkStillImage(info);
  if (notStill) return notStill;
  const gpano = readGPano(info.xmp);
  if (gpano) {
    const { projection, complete } = readCoverage(gpano);
    if (projection !== undefined && projection !== 'equirectangular')
      return REASONS.UNSUPPORTED_PROJECTION;
    if (complete === false) return REASONS.PARTIAL_COVERAGE;
  }
  if (!isTwoToOne(info.width, info.height))
    return REASONS.NOT_A_COMPLETE_SPHERE;
  return null;
};

/**
 * Facts the panorama checks need, read from the original file. Dimensions are
 * those displayed, after the EXIF orientation.
 * @param {Buffer} buffer
 * @returns {Promise<{ format: string, width: number, height: number,
 *   pages: number, xmp: string|null }|null>} null when the buffer is not an
 *   image sharp can read
 */
const readImageInfo = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  try {
    const meta = await sharp(buffer).metadata();
    return {
      format: meta.format,
      width: meta.autoOrient?.width ?? meta.width,
      height: meta.autoOrient?.height ?? meta.height,
      pages: meta.pages ?? 1,
      xmp: meta.xmpAsString ?? meta.xmp?.toString('utf8') ?? null,
    };
  } catch (err) {
    return null;
  }
};

module.exports = {
  REASONS,
  REASON_MESSAGES,
  parsePanoramaFlag,
  readGPano,
  detectPanorama,
  checkManualPanorama,
  readImageInfo,
};
