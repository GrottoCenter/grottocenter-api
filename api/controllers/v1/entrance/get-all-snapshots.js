const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const EntranceService = require('../../../services/EntranceService');
const RiggingService = require('../../../services/RiggingService');
const HistoryService = require('../../../services/HistoryService');
const LocationService = require('../../../services/LocationService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const entranceId = req.params.id;
    // Get Ids of elements of an entrance
    const descriptionIds =
      await DescriptionService.getIdDescriptionsByEntranceId(entranceId);
    const documentsId = await DocumentService.getIdDocumentByEntranceId(
      entranceId
    );
    const historyIds = await HistoryService.getIdHistoriesByEntranceId(
      entranceId
    );
    const locationIds = await LocationService.getIdLocationsByEntranceId(
      entranceId
    );
    const riggingIds = await RiggingService.getIdRiggingsByEntranceId(
      entranceId
    );

    const hDescriptions = await Promise.all(
      descriptionIds.map(async (d) =>
        DescriptionService.getHDescriptionsById(d.id)
      )
    );

    const hDocuments = await Promise.all(
      documentsId.map(async (d) => {
        const documentsH = await DocumentService.getHDocumentById(d.id);
        return DocumentService.populateHDocumentsWithDescription(
          d.id,
          documentsH
        );
      })
    );

    const hEntrances = await EntranceService.getHEntrancesById(
      entranceId,
      req.query.isNetwork
    );

    const hHistories = await Promise.all(
      historyIds.map(async (h) => HistoryService.getHHistoriesById(h.id))
    );
    const hRiggings = await Promise.all(
      riggingIds.map(async (r) => RiggingService.getHRiggingById(r.id))
    );

    let hLocations = await Promise.all(
      locationIds.map(async (l) => {
        const result = await LocationService.getHLocationById(l.id);
        if (result.error === '401' || result.error === '403') {
          return null;
        }
        if (result.error !== null) {
          return {};
        }
        return result.hLocations;
      })
    );
    if (hLocations.includes(null)) {
      hLocations = [];
    }
    const filteredLocations = hLocations.filter(
      (location) => Object.keys(location).length !== 0
    );

    if (
      hDescriptions.length === 0 &&
      hDocuments.length === 0 &&
      hEntrances.length === 0 &&
      filteredLocations.length === 0 &&
      hRiggings.length === 0 &&
      hHistories.length === 0
    ) {
      return res.notFound('No snapshots for this entrance');
    }

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    return ControllerService.treat(
      req,
      null,
      {
        descriptions: hDescriptions.flat(),
        documents: hDocuments.flat(),
        entrances: hEntrances.flat(),
        locations: filteredLocations.flat(),
        riggings: hRiggings.flat(),
        histories: hHistories.flat(),
      },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
