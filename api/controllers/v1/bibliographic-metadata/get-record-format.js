const BibliographicMetadataService = require('../../../services/BibliographicMetadataService');
const ControllerService = require('../../../services/ControllerService');
const MarcConvertorService = require('../../../services/MarcConvertorService');

/**
 * Get Bibliographic metadata by ID and format
 * GET /bibliographic-metadata/:id/format/:format
 */
module.exports = async (req, res) => {
  const { id, format } = req.params;

  if (!id || !format) {
    return res.badRequest({
      message: 'ID and format parameters are required',
    });
  }

  const bibliographicMetadata =
    await BibliographicMetadataService.getMetadata(id);

  if (!bibliographicMetadata) {
    return res.notFound({
      message: `Record with ID ${id} not found`,
    });
  }
  // Transform by the format selected
  const [marcFormat, country] = format.split('-');
  const [marcRecord, countrySelected] =
    await MarcConvertorService.documentToMarc(
      bibliographicMetadata,
      marcFormat,
      country
    );

  const response = {
    metadata: marcRecord,
    format: marcFormat,
    country: countrySelected,
  };

  const params = {
    controllerMethod: 'RecordController.getRecordByFormat',
    searchedItem: `Record ${id} in format ${format}`,
    notFoundMessage: `Record ${id} not found in format ${format}`,
  };

  // Use ControllerService to handle the response
  return ControllerService.treat(req, null, response, params, res);
};
