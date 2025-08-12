const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Records Controller with Pagination
 *
 * Retrieves complete bibliographic metadata records matching the specified OAI-PMH criteria
 * with support for pagination using limit and offset parameters.
 *
 * @route GET /api/v1/bibliographic-metadata/records
 * @param {string} [set] - Optional OAI-PMH set specification to filter records
 * @param {string} [from] - Optional start date (inclusive, filters on `lastUpdate`)
 * @param {string} [until] - Optional end date (inclusive, filters on `lastUpdate`)
 * @param {string} [includeDeleted] - Optional parameter: (default: false) when 'true', includes deleted records
 * @param {number} [limit=50] - Maximum number of records to return (pagination)
 * @param {number} [offset=0] - Number of records to skip (pagination)
 * @returns {Object} Response containing records array, total count, and pagination metadata
 */
module.exports = async (req, res) => {
  try {
    // Extract and structure OAI-PMH query parameters for record retrieval
    const parameters = {
      set: req.query.set,
      from: req.query.from,
      until: req.query.until,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const filter = {};
    if (req.query.includeDeleted !== 'true') {
      filter.metadataStatus = 'registered';
    }

    // Retrieve paginated bibliographic metadata records
    const result = await BibliographicMetadataService.getOAIRecordsPaginated(
      parameters,
      filter
    );

    // Localize parent descriptions for each record
    const localizedRecords = await Promise.all(
      result.records.map((record) =>
        sails.helpers.localizeParentDescriptions(record, req)
      )
    );

    // Structure response with records, pagination metadata, and applied parameters
    const response = {
      records: localizedRecords,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasNext: result.hasNext,
      },
      parameters,
    };

    const params = {
      controllerMethod: 'BibliographicMetadataController.getRecordsPaginated',
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
