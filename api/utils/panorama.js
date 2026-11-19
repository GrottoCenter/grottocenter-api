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
 *   It needs well-formed Google Photo Sphere (GPano) XMP metadata describing
 *   a complete equirectangular sphere (full size, cropped size and offsets
 *   all present), coherent with the image dimensions. A 2:1 aspect ratio
 *   alone never detects a panorama.
 * - checkManualPanorama: a contributor's explicit `true`. GPano metadata is
 *   optional, but the image must be a still image whose dimensions fit a
 *   complete sphere, and known incompatible metadata is rejected, even when
 *   the rest of the metadata is missing or malformed.
 *
 * Both work on the facts readImageInfo() reads from the original file, before
 * any transformation.
 */

const sharp = require('sharp');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

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

const xmpParser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  parseAttributeValue: false,
  // GPano values never need entities; leave them unexpanded.
  processEntities: false,
  ignoreDeclaration: true,
  ignorePiTags: true,
});

const ATTRIBUTES = ':@';
const TEXT = '#text';

const splitName = (qualified) => {
  const colon = qualified.indexOf(':');
  return colon === -1
    ? [null, qualified]
    : [qualified.slice(0, colon), qualified.slice(colon + 1)];
};

/**
 * Walks parsed XML nodes (fast-xml-parser preserveOrder form), resolving
 * namespace declarations by scope, and yields the GPano properties as
 * [name, value] pairs in document order.
 */
function* gpanoEntries(nodes, scope) {
  for (const node of nodes) {
    const tag = Object.keys(node).find((k) => k !== ATTRIBUTES);
    // eslint-disable-next-line no-continue
    if (tag === undefined || tag === TEXT) continue;
    const attributes = node[ATTRIBUTES] ?? {};
    const nodeScope = { ...scope };
    for (const [name, value] of Object.entries(attributes)) {
      if (name === 'xmlns') nodeScope[''] = value;
      else if (name.startsWith('xmlns:')) nodeScope[name.slice(6)] = value;
    }
    for (const [name, value] of Object.entries(attributes)) {
      const [prefix, local] = splitName(name);
      // Unprefixed attributes have no namespace.
      if (
        prefix !== null &&
        prefix !== 'xmlns' &&
        nodeScope[prefix] === GPANO_NAMESPACE
      )
        yield [local, String(value).trim()];
    }
    const children = node[tag];
    const [prefix, local] = splitName(tag);
    if (nodeScope[prefix ?? ''] === GPANO_NAMESPACE) {
      // A simple property holds text only.
      if (children.every((c) => TEXT in c))
        yield [
          local,
          children
            .map((c) => String(c[TEXT]))
            .join('')
            .trim(),
        ];
    } else {
      yield* gpanoEntries(children, nodeScope);
    }
  }
}

/**
 * GPano properties of an XMP packet, as raw strings, whatever prefix the
 * packet binds to the GPano namespace, in its scope. Both the attribute form
 * (`GPano:ProjectionType="equirectangular"`) and the element form
 * (`<GPano:ProjectionType>equirectangular</GPano:ProjectionType>`) are read.
 * A packet that is not well-formed XML gives no property.
 * @param {string|null|undefined} xmp
 * @returns {Object<string, string>|null} null when the packet has no GPano
 *   property or is malformed
 */
const readGPano = (xmp) => {
  if (typeof xmp !== 'string') return null;
  // XMP packets may be padded with NUL bytes by some writers.
  const packet = xmp.replace(/\0+$/, '').trim();
  if (packet.length === 0) return null;
  if (XMLValidator.validate(packet) !== true) return null;
  let nodes;
  try {
    nodes = xmpParser.parse(packet);
  } catch (err) {
    return null;
  }
  const properties = {};
  for (const [name, value] of gpanoEntries(nodes, {}))
    properties[name] ??= value;
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

// A GPano integer that is present and well formed.
const isKnown = (v) => v !== undefined && !Number.isNaN(v);

/**
 * Projection and coverage declared by GPano metadata.
 *
 * complete is:
 * - false as soon as one known value shows a partial or non-spherical
 *   coverage (nonzero offset, cropped size different from the full size,
 *   full size not 2:1), whatever the other values;
 * - true only when the full size, the cropped size and both offsets are all
 *   present, well formed and describe an uncropped 2:1 sphere;
 * - undefined otherwise: the coverage is not fully described.
 * @param {Object<string, string>} gpano
 * @returns {{ projection: string|undefined, malformed: boolean,
 *   complete: boolean|undefined }}
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

  const partial =
    (isKnown(left) && left !== 0) ||
    (isKnown(top) && top !== 0) ||
    (isKnown(fullWidth) &&
      isKnown(croppedWidth) &&
      croppedWidth !== fullWidth) ||
    (isKnown(fullHeight) &&
      isKnown(croppedHeight) &&
      croppedHeight !== fullHeight) ||
    (isKnown(fullWidth) &&
      isKnown(fullHeight) &&
      !isTwoToOne(fullWidth, fullHeight));
  if (partial) return { projection, malformed, complete: false };

  const complete = values.every(isKnown) ? true : undefined;
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

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Frame count of a PNG, from its animation control (acTL) chunk. sharp does
 * not report the pages of an animated PNG (APNG), which it reads as a still
 * image. The APNG specification puts acTL before the first IDAT chunk.
 * @param {Buffer} buffer
 * @returns {number} the acTL frame count, 1 without acTL
 */
const countPngFrames = (buffer) => {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 1;
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    if (type === 'IDAT' || type === 'IEND') return 1;
    if (type === 'acTL') {
      if (length < 8 || offset + 12 > buffer.length) return 1;
      return Math.max(buffer.readUInt32BE(offset + 8), 1);
    }
    offset += 12 + length; // length, type, data, CRC
  }
  return 1;
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
      pages: meta.pages ?? (meta.format === 'png' ? countPngFrames(buffer) : 1),
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
