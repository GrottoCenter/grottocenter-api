/**
 * Centralized Typesense error handling.
 * Duck-types on error.httpStatus to classify 4xx client errors.
 */

/**
 * Handle a Typesense client error by returning HTTP 400 if the error
 * has an httpStatus in the 4xx range.
 *
 * @param {Object} res - Sails response object
 * @param {Error} error - The caught error
 * @returns {boolean} true if the error was handled (4xx), false otherwise
 */
function handleTypesenseError(res, error) {
  const status = error?.httpStatus;
  const isClientError =
    typeof status === 'number' && status >= 400 && status < 500;
  const isAuthError = status === 401 || status === 403;
  if (isClientError && !isAuthError) {
    res.badRequest({ error: error.message });
    return true;
  }
  return false;
}

module.exports = { handleTypesenseError };
