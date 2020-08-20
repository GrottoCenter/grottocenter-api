/**
 * AdminController
 */

module.exports = {
  index: (req, res) => {
    TEntrance.find()
      .limit(10)
      .exec((err, found) => {
        return res.view({
          entrancelist: found,
        });
      });
  },

  find: (req, res) => {
    TEntrance.findOneById(req.params.id)
      .populate('author')
      .populate('cave')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'EntranceController.find';
        params.notFoundMessage = `Entrance of id ${req.params.id} not found.`;
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAll: (req, res) => {
    const parameters = {};
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

    TEntrance.find(parameters)
      .populate('author')
      .populate('cave')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'EntranceController.findAll';
        params.notFoundMessage = 'No entrances found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAllInterestEntrances: (req, res) => {
    EntranceService.findAllInterestEntrances().then(
      (results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(
          `EntranceController.findAllInterestEntrances error : ${err}`,
        );
      },
    );
  },
};
