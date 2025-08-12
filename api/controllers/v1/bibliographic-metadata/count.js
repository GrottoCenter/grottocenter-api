const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Count Controller
 *
 * Returns the total count of bibliographic metadata records that match the specified OAI-PMH parameters.
 * This endpoint supports standard OAI-PMH filtering by set, date range, and metadata status.
 *
 * @route GET /api/v1/bibliographic-metadata/count
 * @param {string} [set] - Optional OAI-PMH set specification to filter records (e.g. 'grottocenter:issue')
 * @param {string} [from] - Optional start date (inclusive, filters on `lastUpdate`) – format: YYYY-MM-DD
 * @param {string} [until] - Optional end date (inclusive, filters on `lastUpdate`) – format: YYYY-MM-DD
 * @param {string} [includeDeleted] - Optional parameter: (default: false) when set to 'true', includes records with metadataStatus = 'deleted'
 * @returns {Object} Response containing count and applied parameters
 * @returns {number} response.count - Total number of matching records
 * @returns {Object} response.parameters - Applied filter parameters
 */
module.exports = async (req, res) => {
  try {
    // Extract and structure OAI-PMH query parameters
    const parameters = {
      set: req.query.set,
      from: req.query.from,
      until: req.query.until,
    };

    const filter = {};
    if (req.query.includeDeleted !== 'true') {
      filter.metadataStatus = 'registered';
    }

    // Retrieve count of records matching the specified criteria
    const count = await BibliographicMetadataService.countRecords(
      parameters,
      filter
    );

    // Structure response with count and applied parameters
    const response = {
      count,
      parameters,
    };

    const params = {
      controllerMethod: 'BibliographicMetadataController.getCount',
      searchedItem: 'count of bibliographic records',
      notFoundMessage: 'No records found matching the criteria',
    };

    return ControllerService.treat(req, null, response, params, res);
  } catch (error) {
    sails.log.error('Error in get-count controller:', error);
    return res.serverError({
      message: 'Internal server error while counting records',
      error: error.message,
    });
  }
};
