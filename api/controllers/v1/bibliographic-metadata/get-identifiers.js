const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Identifiers Controller
 *
 * Retrieves OAI-PMH identifiers for bibliographic metadata records matching the specified criteria.
 * This endpoint implements the ListIdentifiers verb of the OAI-PMH protocol, returning only
 * the unique identifiers and header information without the full metadata content.
 *
 * @route GET /api/v1/bibliographic-metadata/identifiers
 * @param {string} [set] - Optional OAI-PMH set specification to filter records
 * @param {string} [from] - Optional start date (YYYY-MM-DD) for date range filtering
 * @param {string} [until] - Optional end date (YYYY-MM-DD) for date range filtering
 * @param {string} [includeDeleted] - Set to 'true' to include deleted records (default: false)
 * @returns {Object} Response containing identifiers array, count, and parameters
 * @returns {Array} response.identifiers - Array of OAI-PMH identifier objects
 * @returns {number} response.count - Total number of identifiers returned
 * @returns {Object} response.parameters - Applied filter parameters
 */
module.exports = async (req, res) => {
  try {
    // Extract and structure OAI-PMH query parameters for identifier retrieval
    const parameters = {
      set: req.query.set,
      from: req.query.from,
      until: req.query.until,
    };

    // Configure metadata status filter (exclude deleted records by default)
    const filter = {};
    if (req.query.includeDeleted !== 'true') {
      filter.metadataStatus = 'registered';
    }

    // Retrieve OAI-PMH identifiers matching the specified criteria
    const identifiers = await BibliographicMetadataService.getOAIIdentifiers(
      parameters,
      filter
    );

    // Structure response with identifiers, count, and applied parameters
    const response = {
      identifiers,
      count: identifiers.length,
      parameters,
    };

    // Configure controller service parameters for standardized response handling
    const params = {
      controllerMethod: 'BibliographicMetadataController.getIdentifiers',
      searchedItem: 'bibliographic identifiers',
      notFoundMessage: 'No identifiers found matching the criteria',
    };

    return ControllerService.treat(req, null, response, params, res);
  } catch (error) {
    sails.log.error('Error in get-identifiers controller:', error);
    return res.serverError({
      message: 'Internal server error while retrieving identifiers',
      error: error.message,
    });
  }
};
