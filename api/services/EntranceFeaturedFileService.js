/**
 * EntranceFeaturedFileService.js
 *
 * @description :: Featured picture of an entrance (#1701): one image file of a
 *   document linked to the entrance. Eligibility is checked when the selection
 *   is written and again whenever the entrance is served, so a file that
 *   became ineligible afterwards (file or document refused, deleted, merged,
 *   unlinked) is never exposed.
 */

const DocumentService = require('./DocumentService');
const isValidId = require('../utils/isValidId');

/**
 * Image formats every current browser displays in an <img>, as recorded in
 * t_file_format. TIFF is left out (Safari only), SVG too (vector documents
 * such as surveys, not photographs), as are PCX and DXF.
 */
const BROWSER_DISPLAYABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/x-ms-bmp',
  'image/bmp',
]);

// Why a file cannot be featured. NOT_FOUND maps to 404, the others to 400.
const REASONS = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_LINKED: 'NOT_LINKED',
  NOT_VALIDATED: 'NOT_VALIDATED',
  NOT_AN_IMAGE: 'NOT_AN_IMAGE',
  DOCUMENT_NOT_DISPLAYED: 'DOCUMENT_NOT_DISPLAYED',
};

const MESSAGES = {
  [REASONS.NOT_FOUND]: (fileId) => `File of id ${fileId} not found.`,
  [REASONS.NOT_LINKED]: (fileId) =>
    `File of id ${fileId} does not belong to a document linked to this entrance.`,
  [REASONS.NOT_VALIDATED]: (fileId) => `File of id ${fileId} is not validated.`,
  [REASONS.NOT_AN_IMAGE]: (fileId) =>
    `File of id ${fileId} is not an image a browser can display.`,
  [REASONS.DOCUMENT_NOT_DISPLAYED]: (fileId) =>
    `The document of file ${fileId} is deleted, merged or refused.`,
};

/**
 * Whether a document may be shown on an entrance: the same documents
 * GET /entrances/:id lists (refused ones are dropped), minus deleted and
 * merged ones.
 * @param {Object} document
 * @returns {boolean}
 */
const isDocumentDisplayed = (document) =>
  !document.isDeleted &&
  document.redirectTo == null &&
  !DocumentService.isRefused(document);

module.exports = {
  BROWSER_DISPLAYABLE_MIME_TYPES,
  REASONS,

  /**
   * Checks whether a file may be featured by an entrance.
   * @param {number} entranceId
   * @param {number} fileId
   * @returns {Promise<{file: Object|null, reason: string|null}>} the file with
   *   its format populated when eligible, otherwise the reason it is not.
   */
  async checkEligibility(entranceId, fileId) {
    const file = await TFile.findOne(fileId)
      .populate('fileFormat')
      .populate('document');
    if (!file || !file.document) {
      return { file: null, reason: REASONS.NOT_FOUND };
    }

    const linkCount = await JDocumentEntrance.count({
      document: file.document.id,
      entrance: entranceId,
    });
    if (linkCount === 0) return { file: null, reason: REASONS.NOT_LINKED };
    if (!isDocumentDisplayed(file.document)) {
      return { file: null, reason: REASONS.DOCUMENT_NOT_DISPLAYED };
    }
    if (file.isValidated !== true) {
      return { file: null, reason: REASONS.NOT_VALIDATED };
    }
    if (!BROWSER_DISPLAYABLE_MIME_TYPES.has(file.fileFormat?.mimeType)) {
      return { file: null, reason: REASONS.NOT_AN_IMAGE };
    }
    return { file, reason: null };
  },

  /**
   * The message explaining why a file was refused as featured file.
   * @param {string} reason one of REASONS
   * @param {number} fileId
   * @returns {string}
   */
  getMessage(reason, fileId) {
    return MESSAGES[reason](fileId);
  },

  /**
   * The featured file an entrance may display, or null.
   * @param {number} entranceId
   * @param {number|null|undefined} fileId the stored id_featured_file
   * @returns {Promise<Object|null>}
   */
  async getDisplayableFile(entranceId, fileId) {
    if (fileId == null) return null;
    const { file } = await module.exports.checkEligibility(entranceId, fileId);
    return file;
  },

  /**
   * Reads the featuredFile request field.
   * @param {*} value the raw body value
   * @returns {{value: number|null}|{error: string}} null clears the selection
   */
  parseRequestValue(value) {
    if (value === null) return { value: null };
    const isIntegerString = typeof value === 'string' && /^\d+$/.test(value);
    const id = isIntegerString ? Number(value) : value;
    // t_file.id is an int4: a larger id can only fail in PostgreSQL.
    if (isValidId(id)) return { value: id };
    return {
      error: 'featuredFile must be a positive integer file id or null.',
    };
  },

  /**
   * Parses the featuredFile request field and checks the file is eligible.
   * Every entrance write path calls it before writing anything, so a refused
   * selection never replaces the current one.
   * @param {number} entranceId
   * @param {*} value the raw body value
   * @returns {Promise<{value: number|null}|{notFound: string}|{badRequest: string}>}
   *   value is what to store (null clears the selection)
   */
  async resolveRequestValue(entranceId, value) {
    const parsed = module.exports.parseRequestValue(value);
    if (parsed.error) return { badRequest: parsed.error };
    if (parsed.value === null) return { value: null };

    const { reason } = await module.exports.checkEligibility(
      entranceId,
      parsed.value
    );
    if (!reason) return { value: parsed.value };
    const message = module.exports.getMessage(reason, parsed.value);
    return reason === REASONS.NOT_FOUND
      ? { notFound: message }
      : { badRequest: message };
  },
};
