/**
 * GrottoController
 *
 * @description :: Server-side logic for managing grottos
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const esClient = require('../../config/elasticsearch').elasticsearchCli;

module.exports = {
  find: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToOrganizationModel,
  ) => {
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

  create: async (req, res, next, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.GROTTO,
        rightAction: RightService.RightActions.EDIT_ALL,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create an organization.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an organization.');
    }

    // Check params
    if (!req.param('name')) {
      return res.badRequest(
        `You must provide a name to create a new organization.`,
      );
    }

    // Launch creation request using transaction: it performs a rollback if an error occurs
    const newOrganization = await sails
      .getDatastore()
      .transaction(async (db) => {
        const caver = await TCaver.findOne({
          id: req.token.id,
        }).usingConnection(db);
        const name = await TName.create({
          author: req.token.id,
          dateInscription: new Date(),
          isMain: true,
          language: caver.language,
          name: req.param('name'),
        })
          .fetch()
          .usingConnection(db);

        const newOrganization = await TGrotto.create({
          author: req.token.id,
          dateInscription: new Date(),
        })
          .fetch()
          .usingConnection(db);

        await TGrotto.addToCollection(newOrganization.id, 'names')
          .members(name.id)
          .usingConnection(db);

        return newOrganization;
      })
      .intercept('E_UNIQUE', () => res.sendStatus(409))
      .intercept('UsageError', (e) => res.badRequest(e.cause.message))
      .intercept('AdapterError', (e) => res.badRequest(e.cause.message))
      .intercept((e) => res.serverError(e.message));

    try {
      esClient.create({
        index: `grottos-index`,
        type: 'data',
        id: newOrganization.id,
        body: {
          ...newOrganization,
          name: req.param('name'),
          names: req.param('name'),
          ['nb cavers']: 0,
          type: 'grotto',
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

    await NameService.setNames([newOrganization], 'grotto');

    const params = {};
    params.controllerMethod = 'GrottoController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newOrganization,
      params,
      res,
      converter,
    );
  },
};
