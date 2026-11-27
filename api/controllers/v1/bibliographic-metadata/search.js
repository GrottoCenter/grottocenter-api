const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * POST Search bibliographic metadata
 * POST /bibliographic-metadata/search
 * @param {Object} req - Request object containing search criteria
 */
module.exports = async (req, res) => {
  const { body } = req;

  if (!body || typeof body !== 'object') {
    return res.badRequest({
      error: 'Invalid request body',
      message: 'Request body must be a valid JSON object',
    });
  }

  let result;
  try {
    result = await BibliographicMetadataService.searchMetadata(body);
  } catch (error) {
    // Let the caller report a diagnostic instead of returning a different result set
    if (error.code === 'UNSUPPORTED_SEARCH_FIELD') {
      return res.badRequest({
        error: error.code,
        field: error.field,
        message: error.message,
      });
    }
    throw error;
  }
  const { rows, total } = result;

  const response = {
    data: rows,
    total,
  };

  const params = {
    controllerMethod: 'BibliographicMetadataController.search',
  };

  return ControllerService.treat(req, null, response, params, res);
};
