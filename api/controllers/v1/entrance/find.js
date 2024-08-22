const CaveService = require('../../../services/CaveService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const DescriptionService = require('../../../services/DescriptionService');
const HistoryService = require('../../../services/HistoryService');
const LocationService = require('../../../services/LocationService');
const RightService = require('../../../services/RightService');
const {
  toEntrance,
  toDeletedEntrance,
} = require('../../../services/mapping/converters');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const entrance = await TEntrance.findOne(req.params.id)
      .populate('author')
      .populate('reviewer')
      .populate('cave')
      .populate('documents')
      .populate('names');

    const params = { searchedItem: `Entrance of id ${req.params.id}` };

    if (!entrance) return res.notFound(`${params.searchedItem} not found`);
    if (entrance.isDeleted) {
      return ControllerService.treatAndConvert(
        req,
        null,
        entrance,
        params,
        res,
        toDeletedEntrance
      );
    }
    if (entrance.cave) {
      [entrance.cave.massifs, entrance.cave.entrances] = await Promise.all([
        CaveService.getMassifs(entrance.cave.id),
        TEntrance.find().where({ cave: entrance.cave.id }),
      ]);
      await Promise.all([
        NameService.setNames(entrance.cave.massifs, 'massif'),
        NameService.setNames([entrance.cave], 'cave'),
      ]);
    }

    const hasRight = RightService.hasGroup(
      req.token?.groups,
      RightService.G.MODERATOR
    );

    const where = {};
    if (!hasRight) where.isDeleted = false;

    [
      entrance.descriptions,
      entrance.locations,
      entrance.riggings,
      entrance.histories,
      entrance.comments,
      entrance.documents,
    ] = await Promise.all([
      DescriptionService.getEntranceDescriptions(entrance.id, where),
      LocationService.getEntranceLocations(entrance.id, where),
      RiggingService.getEntranceRiggings(entrance.id, where),
      HistoryService.getEntranceHistories(entrance.id, where),
      CommentService.getEntranceComments(entrance.id, where),
      DocumentService.getDocuments(entrance.documents.map((d) => d.id)),
    ]);
    entrance.stats = CommentService.getStatsFromComments(entrance.comments);

    return ControllerService.treatAndConvert(
      req,
      null,
      entrance,
      params,
      res,
      toEntrance
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
