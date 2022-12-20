const CaveService = require('../../../services/CaveService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const DescriptionService = require('../../../services/DescriptionService');
const HistoryService = require('../../../services/HistoryService');
const LocationService = require('../../../services/LocationService');
const { toEntrance } = require('../../../services/mapping/converters');
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
    // TODO How to delete/restore entity ?
    if (!entrance || entrance.isDeleted)
      return res.notFound(`${params.searchedItem} not found`);

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

    [
      entrance.descriptions,
      entrance.locations,
      entrance.riggings,
      entrance.histories,
      entrance.comments,
      ...entrance.documents
    ] = await Promise.all([
      DescriptionService.getEntranceDescriptions(entrance.id),
      LocationService.getEntranceLocations(entrance.id),
      RiggingService.getEntranceRiggings(entrance.id),
      HistoryService.getEntranceHistories(entrance.id),
      CommentService.getEntranceComments(entrance.id),
      ...entrance.documents.map((d) => DocumentService.getDocument(d.id)),
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
