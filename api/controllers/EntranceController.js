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
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;
        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter,
        );
      });
  },

  findRandom: (req, res) => {
    EntranceService.findRandom().then(
      (results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(`EntranceController.findRandom error ${err}`);
      },
    );
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
