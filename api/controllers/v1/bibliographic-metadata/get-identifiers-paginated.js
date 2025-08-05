const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Identifiers Controller with Pagination
 *
 * Retrieves OAI-PMH identifiers for bibliographic metadata records matching the specified criteria
 * with support for pagination using limit and offset parameters.
 *
 * @route GET /api/v1/bibliographic-metadata/identifiers
 * @param {string} [set] - Optional OAI-PMH set specification to filter records
 * @param {string} [from] - Optional start date (inclusive, filters on `lastUpdate`)
 * @param {string} [until] - Optional end date (inclusive, filters on `lastUpdate`)
 * @param {string} [includeDeleted] - Optional parameter: (default: false) when 'true', includes deleted records
 * @param {number} [limit=50] - Maximum number of identifiers to return (pagination)
 * @param {number} [offset=0] - Number of identifiers to skip (pagination)
 * @returns {Object} Response containing identifiers array, total count, and pagination metadata
 */
module.exports = async (req, res) => {
  try {
    // Extract and structure OAI-PMH query parameters for identifier retrieval
    const parameters = {
      set: req.query.set,
      from: req.query.from,
      until: req.query.until,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    // Configure metadata status filter (exclude deleted records by default)
    const filter = {};
    if (req.query.includeDeleted !== 'true') {
      filter.metadataStatus = 'registered';
    }

    // Retrieve paginated OAI-PMH identifiers
    const result =
      await BibliographicMetadataService.getOAIIdentifiersPaginated(
        parameters,
        filter
      );

    // Structure response with identifiers, pagination metadata, and applied parameters
    const response = {
      identifiers: result.identifiers,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasNext: result.hasNext,
      },
      parameters,
    };

    // Configure controller service parameters for standardized response handling
    const params = {
      controllerMethod:
        'BibliographicMetadataController.getIdentifiersPaginated',
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
