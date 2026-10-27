/**
 * PDF page offsets (#1936): the signed difference between a position in a PDF
 * and the page number printed on that page.
 *
 *   pdf position = printed page number + offset
 *
 * One offset is kept per PDF source: the PDF URL of a document identifier, and
 * each attached PDF file. Null means no offset is configured; 0 is a
 * configured offset and must survive every round trip.
 */

// The column is a PostgreSQL int4. -2147483648 is left out so that the range
// is symmetric, as the API contract states it.
const MAX_PDF_PAGE_OFFSET = 2147483647;

const INTEGER_STRING = /^[+-]?\d+$/;

const PDF_MIME_TYPE = 'application/pdf';

const RANGE_MESSAGE = `an integer between -${MAX_PDF_PAGE_OFFSET} and ${MAX_PDF_PAGE_OFFSET}, or empty to clear it`;

/**
 * Parse an offset sent by a client, as a JSON value or a multipart string.
 *
 *   undefined        → omitted: leave the stored offset unchanged
 *   null or ''       → explicitly cleared
 *   integer (string) → the configured offset
 *
 * Fractional, malformed and out-of-range values are rejected, as is anything
 * that is neither a number nor a string (a repeated multipart field arrives
 * as an array).
 *
 * @param {*} raw
 * @param {string} fieldName - named in the error message
 * @returns {{ value: number|null|undefined }|{ error: string }}
 */
const parsePdfPageOffset = (raw, fieldName) => {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: null };

  let offset;
  if (typeof raw === 'number') offset = raw;
  else if (typeof raw === 'string' && INTEGER_STRING.test(raw.trim())) {
    offset = Number(raw.trim());
  }

  if (!Number.isInteger(offset) || Math.abs(offset) > MAX_PDF_PAGE_OFFSET) {
    return {
      error: `Invalid ${fieldName} ${JSON.stringify(raw)}: it must be ${RANGE_MESSAGE}.`,
    };
  }
  // Number('-0') is -0, which JSON renders as 0 but strict equality keeps apart
  return { value: offset === 0 ? 0 : offset };
};

/**
 * Whether a URL points to a PDF, judged by the extension of its path: the
 * query string and the fragment are ignored.
 * @param {*} url
 * @returns {boolean}
 */
const isPdfUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    return new URL(url.trim()).pathname.toLowerCase().endsWith('.pdf');
  } catch (err) {
    return false;
  }
};

/**
 * Whether a file name has the PDF extension. Uploaded files get their format
 * from their extension (FileService.document.create), so this is the format
 * they will be stored with.
 * @param {*} fileName
 * @returns {boolean}
 */
const isPdfFileName = (fileName) =>
  typeof fileName === 'string' && /\.pdf$/i.test(fileName.trim());

/**
 * Whether a TFileFormat row is the PDF format.
 * @param {object|undefined} fileFormat
 * @returns {boolean}
 */
const isPdfFileFormat = (fileFormat) =>
  fileFormat?.mimeType?.trim().toLowerCase() === PDF_MIME_TYPE;

module.exports = {
  MAX_PDF_PAGE_OFFSET,
  parsePdfPageOffset,
  isPdfUrl,
  isPdfFileName,
  isPdfFileFormat,
};
