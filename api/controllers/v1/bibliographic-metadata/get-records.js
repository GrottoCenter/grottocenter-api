const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Records Controller
 *
 * Retrieves complete bibliographic metadata records matching the specified OAI-PMH criteria.
 * This endpoint implements the ListRecords verb of the OAI-PMH protocol, returning full
 * metadata content including headers and record data for harvesting purposes.
 *
 * @route GET /api/v1/bibliographic-metadata/records
 * @param {string} [set] - Optional OAI-PMH set specification to filter records
 * @param {string} [from] - Optional start date (YYYY-MM-DD) for date range filtering
 * @param {string} [until] - Optional end date (YYYY-MM-DD) for date range filtering
 * @param {string} [includeDeleted] - Set to 'true' to include deleted records (default: false)
 * @returns {Object} Response containing records array, count, and parameters
 * @returns {Array} response.records - Array of complete bibliographic metadata records
 * @returns {number} response.count - Total number of records returned
 * @returns {Object} response.parameters - Applied filter parameters
 */
module.exports = async (req, res) => {
  try {
    // Extract and structure OAI-PMH query parameters for record retrieval
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

    // Retrieve complete bibliographic metadata records matching the specified criteria
    const records = await BibliographicMetadataService.getOAIRecords(
      parameters,
      filter
    );

    // Structure response with records, count, and applied parameters
    const response = {
      records,
      count: records.length,
      parameters,
    };

    // Configure controller service parameters for standardized response handling
    const params = {
      controllerMethod: 'BibliographicMetadataController.getRecords',
      searchedItem: 'bibliographic records',
      notFoundMessage: 'No records found matching the criteria',
    };

    return ControllerService.treat(req, null, response, params, res);
  } catch (error) {
    sails.log.error('Error in get-records controller:', error);
    return res.serverError({
      message: 'Internal server error while retrieving records',
      error: error.message,
    });
  }
};
