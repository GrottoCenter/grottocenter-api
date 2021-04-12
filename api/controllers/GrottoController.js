/**
 * GrottoController
 *
 * @description :: Server-side logic for managing grottos
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const esClient = require('../../config/elasticsearch').elasticsearchCli;
const ramda = require('ramda');

module.exports = {
  find: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToOrganizationModel,
  ) => {
    TGrotto.findOne(req.params.id)
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

  count: (req, res) => {
    TGrotto.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'GrottoController.count';
      params.notFoundMessage = 'Problem while getting number of organizations.';

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
        rightEntity: RightService.RightEntities.ORGANIZATION,
        rightAction: RightService.RightActions.CREATE,
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
    const newOrganizationPopulated = await sails
      .getDatastore()
      .transaction(async (db) => {
        const caver = await TCaver.findOne(req.token.id).usingConnection(db);

        const newOrganization = await TGrotto.create({
          address: req.param('address'),
          author: req.token.id,
          city: req.param('city'),
          country: ramda.pathOr(null, ['country', 'id'], req.body),
          county: req.param('county'),
          customMessage: req.param('customMessage'),
          dateInscription: new Date(),
          latitude: req.param('latitude'),
          longitude: req.param('longitude'),
          mail: req.param('mail'),
          postalCode: req.param('postalCode'),
          region: req.param('region'),
          url: req.param('url'),
          yearBirth: req.param('yearBirth'),
        })
          .fetch()
          .usingConnection(db);

        const name = await TName.create({
          author: req.token.id,
          dateInscription: new Date(),
          grotto: newOrganization.id,
          isMain: true,
          language:
            ramda.propOr(null, 'language', req.param('name')) !== null
              ? req.param('name').language
              : caver.language,
          name: req.param('name').text,
        })
          .fetch()
          .usingConnection(db);

        // Prepare data for Elasticsearch indexation
        const newOrganizationPopulated = await TGrotto.findOne(
          newOrganization.id,
        )
          .populate('country')
          .populate('names')
          .usingConnection(db);

        return newOrganizationPopulated;
      })
      .intercept('E_UNIQUE', (e) => {
        sails.log.error(e.message);
        return res.status(409).send(e.message);
      })
      .intercept({ name: 'UsageError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept({ name: 'AdapterError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept((e) => {
        sails.log.error(e.message);
        return res.serverError(e.message);
      });

    const {
      country,
      names,
      ...newOrganizationESData
    } = newOrganizationPopulated;

    try {
      esClient.create({
        index: `grottos-index`,
        type: 'data',
        id: newOrganizationPopulated.id,
        body: {
          ...newOrganizationESData,
          country: ramda.pathOr(
            null,
            ['country', 'nativeName'],
            newOrganizationPopulated,
          ),
          'country code': ramda.pathOr(
            null,
            ['country', 'id'],
            newOrganizationPopulated,
          ),
          name: names[0].name, // There is only one name right after the creation
          names: names.map((n) => n.name).join(', '),
          'nb cavers': 0,
          type: 'grotto',
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

    const params = {};
    params.controllerMethod = 'GrottoController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newOrganizationPopulated,
      params,
      res,
      converter,
    );
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ORGANIZATION,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete an organization.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete an organization.');
    }

    // Check if organization exists and if it's not already deleted
    const organizationId = req.param('id');
    const currentOrganization = await TGrotto.findOne(organizationId);
    if (currentOrganization) {
      if (currentOrganization.isDeleted) {
        return res.status(410).send({
          message: `The organization with id ${organizationId} has already been deleted.`,
        });
      }
    } else {
      return res.status(404).send({
        message: `Organization of id ${organizationId} not found.`,
      });
    }

    // Delete Organization
    const updatedOrganization = await TGrotto.destroyOne({
      id: organizationId,
    }).intercept((err) => {
      return res.serverError(
        `An unexpected error occured when trying to delete organization with id ${organizationId}.`,
      );
    });

    ElasticsearchService.deleteResource('grottos', organizationId);

    return res.sendStatus(204);
  },
};
