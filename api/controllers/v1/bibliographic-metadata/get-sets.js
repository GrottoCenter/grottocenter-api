const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');

/**
 * Bibliographic Metadata Sets Controller
 *
 * Retrieves all distinct OAI-PMH sets available in the bibliographic metadata repository.
 * This endpoint implements the ListSets verb of the OAI-PMH protocol, providing a complete
 * list of sets that can be used for selective harvesting and filtering operations.
 *
 * @route GET /api/v1/bibliographic-metadata/sets
 * @returns {Object} Response containing sets array and count
 * @returns {Array} response.sets - Array of distinct OAI-PMH set specifications
 * @returns {number} response.count - Total number of sets available
 */
module.exports = async (req, res) => {
  try {
    // Retrieve all distinct sets from the bibliographic metadata repository
    const sets = await BibliographicMetadataService.getDistinctSets();

    // Structure response with sets and count information
    const response = {
      sets,
      count: sets.length,
    };

    // Configure controller service parameters for standardized response handling
    const params = {
      controllerMethod: 'BibliographicMetadataController.getSets',
      searchedItem: 'distinct sets',
      notFoundMessage: 'No sets found',
    };

    return ControllerService.treat(req, null, response, params, res);
  } catch (error) {
    sails.log.error('Error in get-sets controller:', error);
    return res.serverError({
      message: 'Internal server error while retrieving sets',
      error: error.message,
    });
  }
};
