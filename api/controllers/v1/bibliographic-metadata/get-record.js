const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Single Record Controller
 *
 * Retrieves a specific bibliographic metadata record by its numeric ID.
 * Returns complete metadata content for a single record including headers and full bibliographic data.
 *
 * @route GET /api/v1/bibliographic-metadata/record/:id
 * @param {number} id - Required numeric ID for the specific record to retrieve
 * @returns {Object} Complete bibliographic metadata record
 */
module.exports = async (req, res) => {
  try {
    // Extract the required numeric ID from the URL parameter
    const id = req.param('id');

    // Validate that ID is provided
    if (!id || Number.isNaN(Number(id))) {
      return res.notFound({ message: `Record with ID ${id} not found.` });
    }

    // Retrieve the specific bibliographic metadata record by its ID
    // Note: No status filter - returns both registered and deleted records
    let record = await BibliographicMetadataService.getRecordById(id);

    // Localize parent descriptions if record has parents
    if (record) {
      record = await sails.helpers.localizeParentDescriptions(record, req);
    }

    const params = {
      controllerMethod: 'BibliographicMetadataController.getRecord',
      notFoundMessage: `Record with ID ${id} not found.`,
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
