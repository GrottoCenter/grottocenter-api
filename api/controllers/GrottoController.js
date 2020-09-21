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
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Grotto of id ${req.params.id}`;
        const expCavesPromise = NameService.setNames(
          found.exploredCaves,
          'cave',
        );
        expCavesPromise.then((expCavesPopulated) => {
          found.exploredCaves = expCavesPopulated;
          const partnCavesPromise = NameService.setNames(
            found.partneredCaves,
            'cave',
          );
          partnCavesPromise.then((partnCavesPopulated) => {
            found.partneredCaves = partnCavesPopulated;
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
    TGrotto.count({ isOfficialPartner: true })
      .then((total) => {
        return res.json(total);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `GrottoController.getOfficialPartnersNumber error : ${err}`,
        );
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
