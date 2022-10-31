const CaveService = require('../../../services/CaveService');
const CaverService = require('../../../services/CaverService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const DescriptionService = require('../../../services/DescriptionService');
const HistoryService = require('../../../services/HistoryService');
const LocationService = require('../../../services/LocationService');

module.exports = async (req, res) => {
  TEntrance.findOne(req.params.id)
    .populate('author')
    .populate('cave')
    .populate('documents')
    .populate('geology')
    .populate('names')
    .exec(async (err, found) => {
      const params = {};
      const entrance = found;
      params.searchedItem = `Entrance of id ${req.params.id}`;

      if (err) {
        return res.serverError({
          error: err,
          message: `An unexpected server error occured when trying to get ${params.searchedItem}`,
        });
      }
      if (!entrance) {
        return res.notFound(`${params.searchedItem} not found`);
      }

      if (entrance.cave) {
        // Populate massif
        entrance.cave.massifs = await CaveService.getMassifs(entrance.cave.id);
        if (entrance.cave.massifs.length !== 0) {
          await NameService.setNames(entrance.cave.massifs, 'massif');
          const promiseArray = [];
          for (const massif of entrance.cave.massifs) {
            promiseArray.push(
              DescriptionService.getMassifDescriptions(massif.id)
            );
          }
          await Promise.all(promiseArray).then((descriptionsArray) => {
            descriptionsArray.forEach((descriptions, index) => {
              entrance.cave.massifs[index].descriptions = descriptions;
            });
          });
        }
        // Populate cave
        await CaveService.setEntrances([entrance.cave]);
        await NameService.setNames([entrance.cave], 'cave');
        entrance.cave.id_author = await CaverService.getCaver(
          entrance.cave.id_author,
          req
        ); // using id_author because of a bug in Sails ORM... See TCave() file for explaination
      }

      entrance.descriptions = await DescriptionService.getEntranceDescriptions(
        entrance.id
      );
      entrance.histories = await HistoryService.getEntranceHistories(
        entrance.id
      );
      entrance.locations = await LocationService.getEntranceLocations(
        entrance.id
      );
      entrance.comments = await CommentService.getEntranceComments(entrance.id);

      entrance.riggings = await RiggingService.getEntranceRiggings(entrance.id);

      // Populate document type, descriptions, files & license
      entrance.documents = await Promise.all(
        entrance.documents.map(
          // eslint-disable-next-line no-return-await
          async (d) => await DocumentService.getDocument(d.id)
        )
      );

      // Populate stats
      entrance.stats = await CommentService.getStats(req.params.id);

      return ControllerService.treatAndConvert(
        req,
        err,
        entrance,
        params,
        res,
        MappingService.convertToEntranceModel
      );
    });
};
