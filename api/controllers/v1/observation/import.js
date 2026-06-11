/**
 * api/controllers/v1/observation/import.js
 *
 * POST /api/v1/observations/import
 *
 * Accepts a multipart/form-data request with:
 *   - `file`    — raw CSV/TSV/TXT data file (max 100 MB)
 *   - `profile` — JSON string describing how to parse the file
 *
 * On success returns HTTP 200 with a JSON import summary.
 * On failure returns HTTP 400 (bad input / validation), 409 (conflict), or 500 (server error).
 */

const ObservationImportService = require('../../../services/ObservationImportService');
const ControllerService = require('../../../services/ControllerService');

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

// Error codes that map to HTTP 400
const BAD_REQUEST_CODES = new Set([
  'IMPORT_VALIDATION_ERROR',
  'IMPORT_REFERENCE_ERROR',
  'IMPORT_PARSE_ERROR',
  'IMPORT_TIMESTAMP_ERROR',
  'IMPORT_CONVERSION_ERROR',
]);

/**
 * Returns true when the error came from the import pipeline.
 * Duck-typing is used instead of instanceof because Sails' service
 * wrapping may break the prototype chain across require() calls.
 */
const isImportError = (err) =>
  err !== null &&
  typeof err === 'object' &&
  err.name === 'ImportError' &&
  typeof err.code === 'string';

/**
 * Formats an ImportError into the standard structured error shape
 * used by `sails.helpers.formatStructuredError`:
 *   { code, message, metadata, reference_id }
 */
const formatImportError = (req, err) => ({
  code: err.code,
  message: err.message,
  metadata: { details: err.details || [] },
  reference_id: req.traceId || 'N/A',
});

module.exports = async (req, res) => {
  // -------------------------------------------------------------------------
  // 1. Extract file from req.files.file[0] (multer field name 'file')
  // -------------------------------------------------------------------------
  const file =
    req.files && req.files.file && req.files.file[0] ? req.files.file[0] : null;

  if (!file) {
    return res.badRequest(
      formatImportError(req, {
        code: 'IMPORT_MISSING_FILE',
        message:
          'A data file is required. Please attach a file using the "file" form field.',
        details: [],
      })
    );
  }

  // -------------------------------------------------------------------------
  // 2. Extract and validate profile JSON from req.body.profile
  // -------------------------------------------------------------------------
  const rawProfile = req.body && req.body.profile;

  if (rawProfile === undefined || rawProfile === null || rawProfile === '') {
    return res.badRequest(
      formatImportError(req, {
        code: 'IMPORT_MISSING_PROFILE',
        message:
          'A profile JSON is required. Please provide the "profile" form field.',
        details: [],
      })
    );
  }

  let profile;
  try {
    profile = JSON.parse(rawProfile);
  } catch (_parseErr) {
    return res.badRequest(
      formatImportError(req, {
        code: 'IMPORT_MALFORMED_PROFILE',
        message:
          'The "profile" field is not valid JSON. Please provide a valid JSON string.',
        details: [],
      })
    );
  }

  // -------------------------------------------------------------------------
  // 3. Check file size (> 100 MB → 400)
  // -------------------------------------------------------------------------
  if (file.size > MAX_FILE_SIZE) {
    return res.badRequest(
      formatImportError(req, {
        code: 'IMPORT_FILE_TOO_LARGE',
        message: `The uploaded file exceeds the maximum allowed size of 100 MB (received ${Math.round(file.size / (1024 * 1024))} MB).`,
        details: [],
      })
    );
  }

  // -------------------------------------------------------------------------
  // 4. Resolve the authenticated user ID
  //    tokenAuth policy ensures req.token is set.
  // -------------------------------------------------------------------------
  const requestAuthorId = req.token && req.token.id;

  // -------------------------------------------------------------------------
  // 5. Delegate to ObservationImportService
  // -------------------------------------------------------------------------
  let result;
  try {
    result = await ObservationImportService.execute(
      file,
      profile,
      requestAuthorId
    );
  } catch (err) {
    if (isImportError(err)) {
      const formatted = formatImportError(req, err);
      if (BAD_REQUEST_CODES.has(err.code)) {
        return res.badRequest(formatted);
      }
      if (err.code === 'IMPORT_CONFLICT_ERROR') {
        return res.conflict(formatted);
      }
      // IMPORT_TRANSACTION_ERROR or IMPORT_FILE_ARCHIVE_ERROR → 500
      return res.serverError(formatted);
    }
    // Unexpected error
    return res.serverError(err);
  }

  // -------------------------------------------------------------------------
  // 6. Return import summary via ControllerService.treat (HTTP 200)
  //    Follows project convention — all endpoints use ControllerService.treat.
  // -------------------------------------------------------------------------
  return ControllerService.treat(req, null, result, {}, res);
};
