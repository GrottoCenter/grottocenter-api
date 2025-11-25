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

  const ids = id.includes(',') ? id.split(',').map((i) => i.trim()) : [id];
  const isMultipleIds = id.includes(',');
  const bibliographicMetadata =
    await BibliographicMetadataService.getMetadata(ids);

  if (
    !bibliographicMetadata ||
    (Array.isArray(bibliographicMetadata) && bibliographicMetadata.length === 0)
  ) {
    return res.notFound({
      message: `Record with ID ${id} not found`,
    });
  }
  // Transform by the format selected
  const [marcFormat, country] = format.split('-');

  if (Array.isArray(bibliographicMetadata)) {
    const response = await Promise.all(
      bibliographicMetadata.map(async (document) => {
        sails.log.info(document);
        const [marcRecord, countrySelected] =
          await MarcConvertorService.documentToMarc(
            document,
            marcFormat,
            country
          );
        return {
          id: document.id,
          metadata: marcRecord,
          format: marcFormat,
          country: countrySelected,
        };
      })
    );

    const params = {
      controllerMethod: 'RecordController.getRecordByFormat',
      searchedItem: `Record ${id} in format ${format}`,
      notFoundMessage: `Record ${id} not found in format ${format}`,
    };

    // Return array only if multiple IDs were requested
    return ControllerService.treat(
      req,
      null,
      isMultipleIds ? response : response[0],
      params,
      res
    );
  }

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
