const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Single Record Controller
 *
 * Retrieves a specific bibliographic metadata record by its unique OAI-PMH identifier.
 * This endpoint implements the GetRecord verb of the OAI-PMH protocol, returning complete
 * metadata content for a single record including headers and full bibliographic data.
 *
 * @route GET /api/v1/bibliographic-metadata/record/:identifier
 * @param {string} identifier - Required OAI-PMH identifier for the specific record to retrieve
 * @returns {Object} Complete bibliographic metadata record
 */
module.exports = async (req, res) => {
  try {
    // Extract the required OAI-PMH identifier from the URL parameter
    const identifier = req.param('identifier');

    // Retrieve the specific bibliographic metadata record by its identifier
    const record = await BibliographicMetadataService.getOAIRecord(identifier);

    // Configure controller service parameters for standardized response handling
    const params = {
      controllerMethod: 'BibliographicMetadataController.getRecord',
      notFoundMessage: `Record with identifier ${identifier} not found.`,
    };

    return ControllerService.treat(req, null, record, params, res);
  } catch (error) {
    sails.log.error('Error in get-record controller:', error);
    return res.serverError({
      message: 'Internal server error while retrieving record',
      error: error.message,
    });
  }
};
