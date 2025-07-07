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

  const results = await BibliographicMetadataService.searchMetadata(body);

  const response = {
    data: results,
  };

  const params = {
    controllerMethod: 'BibliographicMetadataController.search',
  };

  return ControllerService.treat(req, null, response, params, res);
};
