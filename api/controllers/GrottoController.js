/**
 * GrottoController
 *
 * @description :: Server-side logic for managing grottos
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  find: (req, res, next, converter = MappingV1Service.convertToGrottoModel) => {
    TGrotto.findOne({
      id: req.params.id,
    })
      .populate('names')
      .populate('cavers')
      .populate('exploredCaves')
      .populate('partneredCaves')
      .exec(async (err, found) => {
        if (!found) {
          const message = `Grotto of id ${req.params.id} not found.`;
          sails.log.error(message);
          return res.status(404).send({ message });
        }
        if (err) {
          const message = `An internal server error occurred when trying to get grotto of id ${req.params.id}`;
          sails.log.error(message + ': ' + err);
          return res.status(500).send({ message });
        }
        const params = {};
        params.searchedItem = `Grotto of id ${req.params.id}`;
        try {
          await CaveService.setEntrances(found.exploredCaves);
          await CaveService.setEntrances(found.partneredCaves);
          await NameService.setNames(found.exploredCaves, 'cave');
          await NameService.setNames(found.partneredCaves, 'cave');
        } catch (e) {
          const message = `An internal server error occurred when trying to get information about grotto of id ${req.params.id}`;
          sails.log.error(message + ': ' + e.message);
          return res.status(500).send({ message });
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

    TGrotto.find(parameters)
      .populate('author')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'GrottoController.findAll';
        params.notFoundMessage = 'No grottos found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  getOfficialPartnersNumber: (req, res) => {
    TGrotto.count({ isOfficialPartner: true }).exec((err, found) => {
      const params = {
        controllerMethod: 'GrottoController.getOfficialPartnersNumber',
        notFoundMessage: 'Problem while getting number of official partners.',
      };
      const count = {
        count: found,
      };
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  getPartnersNumber: (req, res) => {
    TGrotto.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'GrottoController.getPartnersNumber';
      params.notFoundMessage = 'Problem while getting number of partners.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
