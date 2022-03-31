/**
 * LocationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ControllerService = require('../services/ControllerService');
const ErrorService = require('../services/ErrorService');
const RightService = require('../services/RightService');

module.exports = {
  create: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.LOCATION,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to create a location.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a location.');
    }

    // Check mandatory params
    const mandatoryParams = ['body', 'entrance', 'language'];
    const paramsNameAndValue = mandatoryParams.map((p) => ({
      name: p,
      value: req.param(p),
    }));
    const missingParam = paramsNameAndValue.find((p) => !p.value);
    if (missingParam) {
      return res.badRequest(
        `You must provide a${missingParam.name === 'entrance' ? 'n' : ''} ${
          missingParam.name
        } to create a location.`
      );
    }

    // Entrance not found check
    const entranceId = paramsNameAndValue.find(
      (p) => p.name === 'entrance'
    ).value;
    const doesEntranceExists = await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: entranceId,
      sailsModel: TEntrance,
    });
    if (!doesEntranceExists) {
      return res.status(404).send({
        message: `The entrance with id ${entranceId} was not found.`,
      });
    }

    // Unwrap values
    const body = paramsNameAndValue.find((p) => p.name === 'body').value;
    const language = paramsNameAndValue.find(
      (p) => p.name === 'language'
    ).value;

    try {
      const newLocation = await TLocation.create({
        author: req.token.id,
        body,
        dateInscription: new Date(),
        entrance: entranceId,
        language,
        title: req.param('title', null),
      }).fetch();
      const newLocationPopulated = await TLocation.findOne(newLocation.id)
        .populate('author')
        .populate('entrance')
        .populate('language');

      const params = {};
      params.controllerMethod = 'LocationController.create';
      return ControllerService.treatAndConvert(
        req,
        null,
        newLocationPopulated,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.LOCATION,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update any location.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any location.');
    }

    // Check if location exists
    const locationId = req.param('id');
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: locationId,
        sailsModel: TLocation,
      }))
    ) {
      return res.status(404).send({
        message: `Location of id ${locationId} not found.`,
      });
    }

    const newBody = req.param('body');
    const newTitle = req.param('title');
    const cleanedData = {
      ...(newBody && { body: newBody }),
      ...(newTitle && { title: newTitle }),
    };

    try {
      await TLocation.updateOne({
        id: locationId,
      }).set(cleanedData);
      const populatedLocation = await TLocation.findOne(locationId)
        .populate('author')
        .populate('entrance')
        .populate('language')
        .populate('reviewer');

      const params = {};
      params.controllerMethod = 'LocationController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        populatedLocation,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },
};
