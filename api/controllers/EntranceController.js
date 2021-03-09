/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  find: (req, res, converter) => {
    TEntrance.findOne(req.params.id)
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

        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Populate stats
        const statsPromise = CommentService.getStats(req.params.id);
        statsPromise.then((stats) => {
          found.stats = stats;
          if (!found.isPublic) {
            // TODO: Some people (admin ? use RightHelper with a right in DB ?) should be able to get the full data even for the "not public" entrances.
            delete found.locations;
            delete found.longitude;
            delete found.latitude;
          }
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

  publicCount: (req, res, converter) => {
    TEntrance.count({ isPublic: true })
      .then((total) => {
        return res.json(converter({ count: total }));
      })
      .catch((err) => {
        const errorMessage =
          'An internal error occurred when getting number of public entrances';
        sails.log.error(`${errorMessage}: ${err}`);
        return res.status(500).json({ error: errorMessage });
      });
  },

  count: (req, res) => {
    TEntrance.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntranceController.count';
      params.notFoundMessage = 'Problem while getting number of entrances.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
