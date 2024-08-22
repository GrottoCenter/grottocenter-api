const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const EntranceService = require('../../../services/EntranceService');
const RiggingService = require('../../../services/RiggingService');
const HistoryService = require('../../../services/HistoryService');
const LocationService = require('../../../services/LocationService');
const RightService = require('../../../services/RightService');
const {
  toDocument,
  toSimpleDescription,
  toEntrance,
  toSimpleLocation,
  toSimpleRigging,
  toSimpleHistory,
} = require('../../../services/mapping/converters');
const { getMetaFromRequest } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );
  const hasCompleteViewRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );

  const where = {};
  if (!hasRight) where.isDeleted = false;

  const entranceId = req.params.id;
  // Get Ids of elements of an entrance
  const documentsId =
    await DocumentService.getIdDocumentByEntranceId(entranceId);

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
    req.query.isNetwork,
    req.token
  );

  const hDescriptions = await DescriptionService.getEntranceHDescriptions(
    entranceId,
    where
  );
  const hHistories = await HistoryService.getEntranceHHistories(
    entranceId,
    where
  );
  const hRiggings = await RiggingService.getEntranceHRiggings(
    entranceId,
    where
  );
  const hLocations = await LocationService.getEntranceHLocations(
    entranceId,
    hasCompleteViewRight,
    where
  );

  // TODO No comments ?

  if (
    hDescriptions.length === 0 &&
    hDocuments.length === 0 &&
    hEntrances.length === 0 &&
    hLocations.length === 0 &&
    hRiggings.length === 0 &&
    hHistories.length === 0
  ) {
    return res.notFound('No snapshots for this entrance');
  }

  return ControllerService.treat(
    req,
    null,
    {
      documents: hDocuments.flat().map((d) => toDocument(d)),
      entrances: hEntrances
        .flat()
        .map((e) => toEntrance(e, getMetaFromRequest(req))),
      descriptions: hDescriptions.map((d) => toSimpleDescription(d)),
      locations: hLocations.map((l) => toSimpleLocation(l)),
      riggings: hRiggings.map((r) => toSimpleRigging(r)),
      histories: hHistories.map((h) => toSimpleHistory(h)),
    },
    { controllerMethod: 'EntranceController.getAllSnapshots' },
    res
  );
};
