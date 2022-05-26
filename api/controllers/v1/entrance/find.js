const CaveService = require('../../../services/CaveService');
const CaverService = require('../../../services/CaverService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const RightService = require('../../../services/RightService');
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
      params.searchedItem = `Entrance of id ${req.params.id}`;

      if (err) {
        sails.log.error(err);
        return res.serverError(
          `An unexpected server error occured when trying to get ${params.searchedItem}`
        );
      }
      if (!found) {
        return res.notFound(`${params.searchedItem} not found`);
      }

      if (found.cave) {
        // Populate massif
        // eslint-disable-next-line no-param-reassign
        found.cave.massifs = await CaveService.getMassifs(found.cave.id);
        if (found.cave.massifs.length !== 0) {
          await NameService.setNames(found.cave.massifs, 'massif');
          const promiseArray = [];
          for (const massif of found.cave.massifs) {
            promiseArray.push(
              DescriptionService.getMassifDescriptions(massif.id)
            );
          }
          await Promise.all(promiseArray).then((descriptionsArray) => {
            descriptionsArray.forEach((descriptions, index) => {
              // eslint-disable-next-line no-param-reassign
              found.cave.massifs[index].descriptions = descriptions;
            });
          });
        }
      }

      // ===== Populate all authors
      // eslint-disable-next-line no-param-reassign
      found.cave.id_author = await CaverService.getCaver(
        found.cave.id_author,
        req
      ); // using id_author because of a bug in Sails ORM... See TCave() file for explaination

      /* eslint-disable no-return-assign */
      /* eslint-disable no-param-reassign */
      found.comments.map(
        async (c) => (c.author = await CaverService.getCaver(c.author, req))
      );
      found.descriptions.map(
        async (d) => (d.author = await CaverService.getCaver(d.author, req))
      );
      found.histories.map(
        async (h) => (h.author = await CaverService.getCaver(h.author, req))
      );
      found.locations.map(
        async (l) => (l.author = await CaverService.getCaver(l.author, req))
      );
      found.riggings.map(
        async (r) => (r.author = await CaverService.getCaver(r.author, req))
      );
      /* eslint-enable no-param-reassign */
      /* eslint-enable no-return-assign */

      // Populate cave
      await CaveService.setEntrances([found.cave]);
      await NameService.setNames([found.cave], 'cave');

      // Populate document type, descriptions, files & license
      // eslint-disable-next-line no-param-reassign
      found.documents = await Promise.all(
        found.documents.map(
          // eslint-disable-next-line no-return-await
          async (d) => await DocumentService.getDocument(d.id)
        )
      );

      // Populate locations
      // eslint-disable-next-line no-param-reassign
      found.locations = await Promise.all(
        found.locations.map(async (l) => {
          const language = await TLanguage.findOne(l.language);
          return {
            ...l,
            language,
          };
        })
      );

      // Populate stats
      // eslint-disable-next-line no-param-reassign
      found.stats = await CommentService.getStats(req.params.id);

      // Format rigging obstacle
      await RiggingService.formatRiggings(found.riggings);

      // Sensitive entrance special treatment
      if (found.isSensitive) {
        const hasCompleteViewRight = req.token
          ? await sails.helpers.checkRight
              .with({
                groups: req.token.groups,
                rightEntity: RightService.RightEntities.ENTRANCE,
                rightAction: RightService.RightActions.VIEW_COMPLETE,
              })
              .intercept('rightNotFound', () =>
                res.serverError(
                  'A server error occured when checking your right to entirely view an entrance.'
                )
              )
          : false;

        const hasLimitedViewRight = req.token
          ? await sails.helpers.checkRight
              .with({
                groups: req.token.groups,
                rightEntity: RightService.RightEntities.ENTRANCE,
                rightAction: RightService.RightActions.VIEW_LIMITED,
              })
              .intercept('rightNotFound', () =>
                res.serverError(
                  'A server error occured when checking your right to have a limited view of a sensible entrance.'
                )
              )
          : false;
        if (!hasLimitedViewRight && !hasCompleteViewRight) {
          return res.forbidden(
            'You are not authorized to view this sensible entrance.'
          );
        }
        if (!hasCompleteViewRight) {
          delete found.locations; // eslint-disable-line no-param-reassign
          delete found.longitude; // eslint-disable-line no-param-reassign
          delete found.latitude; // eslint-disable-line no-param-reassign
        }
      }
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        MappingService.convertToEntranceModel
      );
    });
};
