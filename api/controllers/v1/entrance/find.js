const DescriptionService = require('../../../services/DescriptionService');
const CaveService = require('../../../services/CaveService');
const CaverService = require('../../../services/CaverService');
const CommentService = require('../../../services/CommentService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const MappingV1Service = require('../../../services/MappingV1Service');
const NameService = require('../../../services/NameService');
const RiggingService = require('../../../services/RiggingService');
const RightService = require('../../../services/RightService');

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
        const notFoundMessage = `${params.searchedItem} not found`;
        sails.log.debug(notFoundMessage);
        res.status(404);
        return res.json({ error: notFoundMessage });
      }

      // Populate massif
      if (found.cave.id_massif) {
        // eslint-disable-next-line no-param-reassign
        found.cave.id_massif = await TMassif.findOne({
          id: found.cave.id_massif,
        })
          .populate('names')
          .populate('descriptions');
        await NameService.setNames([found.cave.id_massif], 'massif');
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
      await Promise.all(
        found.documents.map(async (d) => {
          await DescriptionService.setDocumentDescriptions(d, false);
          await DocumentService.setDocumentType(d);
          await DocumentService.setDocumentLicense(d);
          await DocumentService.setDocumentFiles(d);
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
        MappingV1Service.convertToEntranceModel
      );
    });
};
