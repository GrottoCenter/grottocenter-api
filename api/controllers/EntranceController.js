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
      isPublic: 'YES',
      // TODO before this : see how to materialize fact that
      // id of entry corresponds to id of linked single entry if exists
      // }).populate('author').populate('cave').populate('singleEntry').exec(function(err, found) {
    })
      .populate('author')
      .populate('cave')
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Entry of id ${req.params.id}`;
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

  findAll: (req, res, converter) => {
    const apiControl = req.options.api;
    const parameters = {};
    let { limit } = apiControl;
    let skip = 0;

    if (req.param('name')) {
      parameters.name = {
        like: `%${req.param('name')}%`,
      };
    }
    if (req.param('region')) {
      parameters.region = {
        like: `%${req.param('region')}%`,
      };
    }

    const maxRange = apiControl.limit;
    const range = req.param('range');

    if (range !== undefined) {
      const splitRange = range.split('-');
      limit = splitRange[1] - splitRange[0];
      skip = splitRange[0];
    }

    // TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    // TODO before this : see how to materialize fact that
    // id of entry corresponds to id of linked single entry if exists
    // TEntrance.find(parameters).populate('author').populate('cave').populate('singleEntry').sort('id ASC').limit(10).exec(function(err, found) {
    TEntrance.count(parameters).exec((error, total) => {
      TEntrance.find(parameters)
        .populate('author')
        .populate('cave')
        .sort('id ASC')
        .limit(limit)
        .skip(skip)
        .exec((err, found) => {
          const params = {
            controllerMethod: 'EntranceController.findAll',
            notFoundMessage: 'No entrances found.',
            searchedItem: apiControl.entity,
            total,
            url: req.originalUrl,
            maxRange,
            limit,
            skip,
          };

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
