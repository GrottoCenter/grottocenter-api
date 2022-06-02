const CaveService = require('../../../services/CaveService');
const CaverService = require('../../../services/CaverService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const DescriptionService = require('../../../services/DescriptionService');

module.exports = async (req, res) => {
  TEntrance.findOne(req.params.id)
    .populate('author')
    .populate('cave')
    .populate('comments')
    .populate('descriptions')
    .populate('documents')
    .populate('geology')
    .populate('histories')
    .populate('locations')
    .populate('names')
    .populate('riggings')
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

      // ===== Populate all authors
      /* eslint-disable no-return-assign */
      /* eslint-disable no-param-reassign */
      entrance.comments.map(
        async (c) => (c.author = await CaverService.getCaver(c.author, req))
      );
      entrance.descriptions.map(
        async (d) => (d.author = await CaverService.getCaver(d.author, req))
      );
      entrance.histories.map(
        async (h) => (h.author = await CaverService.getCaver(h.author, req))
      );
      entrance.locations.map(
        async (l) => (l.author = await CaverService.getCaver(l.author, req))
      );
      entrance.riggings.map(
        async (r) => (r.author = await CaverService.getCaver(r.author, req))
      );
      /* eslint-enable no-param-reassign */
      /* eslint-enable no-return-assign */

      // Populate document type, descriptions, files & license
      entrance.documents = await Promise.all(
        entrance.documents.map(
          // eslint-disable-next-line no-return-await
          async (d) => await DocumentService.getDocument(d.id)
        )
      );

      // Populate locations
      entrance.locations = await Promise.all(
        entrance.locations.map(async (l) => {
          const language = await TLanguage.findOne(l.language);
          return {
            ...l,
            language,
          };
        })
      );

      // Populate stats
      entrance.stats = await CommentService.getStats(req.params.id);

      // Format rigging obstacle
      await RiggingService.formatRiggings(entrance.riggings);

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
