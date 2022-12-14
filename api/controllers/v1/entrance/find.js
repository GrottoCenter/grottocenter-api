const CaveService = require('../../../services/CaveService');
const CaverService = require('../../../services/CaverService');
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
      // Populate massif
      entrance.cave.massifs = await CaveService.getMassifs(entrance.cave.id);
      if (entrance.cave.massifs.length !== 0) {
        await NameService.setNames(entrance.cave.massifs, 'massif');
        const promiseArray = entrance.cave.massifs.map((massif) =>
          DescriptionService.getMassifDescriptions(massif.id)
        );
        const descriptions = await Promise.all(promiseArray);
        for (let i = 0; i < descriptions.length; i += 1) {
          entrance.cave.massifs[i] = descriptions[i];
        }
      }
      // Populate cave
      await CaveService.setEntrances([entrance.cave]);
      await NameService.setNames([entrance.cave], 'cave');
      entrance.cave.id_author = await CaverService.getCaver(
        entrance.cave.id_author,
        req
      ); // using id_author because of a bug in Sails ORM... See TCave() file for explaination
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
