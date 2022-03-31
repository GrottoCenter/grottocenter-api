/**
 * GrottoController
 *
 * @description :: Server-side logic for managing grottos
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const ramda = require('ramda');
const ControllerService = require('../services/ControllerService');
const ElasticsearchService = require('../services/ElasticsearchService');
const ErrorService = require('../services/ErrorService');
const GrottoService = require('../services/GrottoService');
const MappingV1Service = require('../services/MappingV1Service');
const NameService = require('../services/NameService');
const RightService = require('../services/RightService');

// Extract everything from the request body except id
const getConvertedDataFromClientRequest = (req) => ({
  address: req.param('address'),
  city: req.param('city'),
  country: ramda.pathOr(null, ['country', 'id'], req.body),
  county: req.param('county'),
  customMessage: req.param('customMessage'),
  latitude: req.param('latitude'),
  longitude: req.param('longitude'),
  mail: req.param('mail'),
  postalCode: req.param('postalCode'),
  region: req.param('region'),
  url: req.param('url'),
  yearBirth: req.param('yearBirth'),
});

module.exports = {
  find: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToOrganizationModel
  ) => {
    try {
      const organization = await TGrotto.findOne(req.params.id)
        .populate('names')
        .populate('cavers')
        .populate('exploredCaves')
        .populate('partnerCaves');
      if (!organization) {
        const message = `Organization of id ${req.params.id} not found.`;
        sails.log.error(message);
        return res.status(404).send({ message });
      }
      const params = {};
      params.searchedItem = `Organization of id ${req.params.id}`;
      await GrottoService.populateOrganization(organization);
      return ControllerService.treatAndConvert(
        req,
        null,
        organization,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findAll: async (req, res) => {
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

    try {
      const organizations = await TGrotto.find(parameters)
        .populate('author')
        .sort('id ASC')
        .limit(10);
      const params = {};
      params.controllerMethod = 'GrottoController.findAll';
      params.notFoundMessage = 'No organizations found.';
      return ControllerService.treat(
        req,
        undefined,
        organizations,
        params,
        res
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  count: async (req, res) => {
    try {
      const countResult = await TGrotto.count();
      const params = {};
      params.controllerMethod = 'GrottoController.count';
      params.notFoundMessage = 'Problem while getting number of organizations.';

      const count = { count: countResult };
      return ControllerService.treat(req, null, count, params, res);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  create: async (req, res, next, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ORGANIZATION,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to create an organization.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an organization.');
    }

    // Check params
    if (!req.param('name')) {
      return res.badRequest(
        'You must provide a name to create a new organization.'
      );
    }

    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      author: req.token.id,
      dateInscription: new Date(),
    };

    const nameData = {
      author: req.token.id,
      language: ramda.propOr(undefined, 'language', req.param('name')),
      text: req.param('name').text,
    };

    try {
      const newOrganizationPopulated = await GrottoService.createGrotto(
        cleanedData,
        nameData
      );
      const params = {};
      params.controllerMethod = 'GrottoController.create';
      return ControllerService.treatAndConvert(
        req,
        null,
        newOrganizationPopulated,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ORGANIZATION,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to delete an organization.'
        )
      );
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
    await TGrotto.destroyOne({
      id: organizationId,
    }).intercept(() =>
      res.serverError(
        `An unexpected error occured when trying to delete organization with id ${organizationId}.`
      )
    );

    ElasticsearchService.deleteResource('grottos', organizationId);

    return res.sendStatus(204);
  },

  // eslint-disable-next-line consistent-return
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ORGANIZATION,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update an organization.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update an organization.');
    }

    // Check if organization exists
    const organizationId = req.param('id');
    const currentOrganization = await TGrotto.findOne(organizationId);
    if (!currentOrganization) {
      return res.status(404).send({
        message: `Organization of id ${organizationId} not found.`,
      });
    }

    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      id: organizationId,
    };

    // Launch update request using transaction: it performs a rollback if an error occurs
    try {
      await sails.getDatastore().transaction(async (db) => {
        const updatedOrganization = await TGrotto.updateOne({
          id: organizationId,
        })
          .set(cleanedData)
          .usingConnection(db);

        await NameService.setNames([updatedOrganization], 'grotto');

        const params = {};
        params.controllerMethod = 'OrganizationController.update';
        return ControllerService.treatAndConvert(
          req,
          null,
          updatedOrganization,
          params,
          res,
          converter
        );
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },
};
