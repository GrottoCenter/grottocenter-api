/**
 * Returns true if an error passed on by the multer middleware was caused by the
 * request body itself: a multer limit (MulterError) or a malformed or truncated
 * body rejected by busboy. Such a request deserves a 400, not a 500.
 *
 * Busboy errors are plain Errors, so they are recognised by message. A client
 * that disconnects mid-upload ('Request aborted', 'Request closed') is not
 * covered: there is no one left to answer.
 *
 * @param {*} err
 * @returns {boolean}
 */
const BUSBOY_PARSE_ERRORS = new Set([
  'Unexpected end of form',
  'Unexpected end of file',
  'Malformed part header',
  'Multipart: Boundary not found',
  'Malformed content type',
  'Malformed urlencoded form',
]);

const isMultipartClientError = (err) =>
  err instanceof Error &&
  (err.name === 'MulterError' || BUSBOY_PARSE_ERRORS.has(err.message));

module.exports = isMultipartClientError;
