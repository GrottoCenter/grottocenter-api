/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  find: (req, res, converter) => {
    TEntrance.findOne({
      id: req.params.id,
      // TODO : to adapt when authentication will be implemented
      isPublic: true,
    })
      .populate('author')
      .populate('cave')
      .populate('names')
      .populate('descriptions')
      .populate('geology')
      .populate('locations')
      .populate('documents')
      .populate('riggings')
      .populate('comments')
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;

        // Populate stats
        const statsPromise = CommentService.getStats(req.params.id);
        statsPromise.then((stats) => {
          found.stats = stats;
          return ControllerService.treatAndConvert(
            req,
            err,
            found,
            params,
            res,
            converter,
          );
        });
      });
  },

  findRandom: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToEntranceModel,
  ) => {
    const params = {};
    params.searchedItem = `Random entrance`;
    EntranceService.findRandom()
      .then((result) => {
        if (!result) {
          return res.notFound();
        }
        return ControllerService.treatAndConvert(
          req,
          null,
          result,
          params,
          res,
          converter,
        );
      })
      .catch((err) => {
        return ControllerService.treatAndConvert(
          req,
          err,
          undefined,
          params,
          res,
          converter,
        );
      });
  },

  getPublicEntrancesNumber: (req, res, converter) => {
    EntranceService.getPublicEntrancesNumber()
      .then((count) => {
        if (!count) {
          return res.status(404).json({
            error: 'Problem while getting number of public entrances',
          });
        }
        return res.json(converter(count));
      })
      .catch((err) => {
        const errorMessage =
          'An internal error occurred when getting number of public entrances';
        sails.log.error(`${errorMessage}: ${err}`);
        return res.status(500).json({ error: errorMessage });
      });
  },

  getEntrancesNumber: (req, res) => {
    TEntrance.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntranceController.getEntrancesNumber';
      params.notFoundMessage = 'Problem while getting number of entrances.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
