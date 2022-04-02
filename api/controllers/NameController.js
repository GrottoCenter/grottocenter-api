/**
 * NameController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ControllerService = require('../services/ControllerService');
const ErrorService = require('../services/ErrorService');
const RightService = require('../services/RightService');

module.exports = {
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.NAME,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update any name.'
        )
      );

    if (!hasRight) {
      return res.forbidden('You are not authorized to update any name.');
    }

    // Check if name exists
    const nameId = req.param('id');
    const currentName = await TName.findOne(nameId);
    if (!currentName) {
      return res.status(404).send({
        message: `Name of id ${nameId} not found.`,
      });
    }

    const cleanedData = {
      name: req.param('name'),
    };

    try {
      await TName.updateOne({
        id: nameId,
      }).set(cleanedData);
      const newName = await TName.findOne(nameId)
        .populate('author')
        .populate('cave')
        .populate('entrance')
        .populate('grotto')
        .populate('language')
        .populate('massif')
        .populate('point')
        .populate('reviewer');

      const params = {};
      params.controllerMethod = 'NameController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        newName,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  setAsMain: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.NAME,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update any name.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any name.');
    }

    // Check if name exists
    const nameId = req.param('id');
    const currentName = await TName.findOne(nameId);
    if (!currentName) {
      return res.status(404).send({
        message: `Name of id ${nameId} not found.`,
      });
    }

    // Do nothing if already main
    if (currentName.isMain) {
      const params = {};
      params.controllerMethod = 'NameController.setAsMain';
      return ControllerService.treatAndConvert(
        req,
        null,
        currentName,
        params,
        res,
        converter
      );
    }

    try {
      const updatedName = await TName.updateOne({
        id: nameId,
      }).set({ isMain: true });

      // Update other names of the entity to isMain = false
      const possibleEntites = [
        { id: updatedName.cave, type: 'cave' },
        { id: updatedName.entrance, type: 'entrance' },
        { id: updatedName.grotto, type: 'grotto' },
        { id: updatedName.massif, type: 'massif' },
        { id: updatedName.point, type: 'point' },
      ];
      const entity = possibleEntites.find((e) => e.id !== null);
      await TName.update({
        [entity.type]: entity.id,
        id: { '!=': updatedName.id },
      }).set({ isMain: false });

      // Return name updated and populated
      const newName = await TName.findOne(nameId)
        .populate('author')
        .populate('cave')
        .populate('entrance')
        .populate('grotto')
        .populate('language')
        .populate('massif')
        .populate('point')
        .populate('reviewer');

      const params = {};
      params.controllerMethod = 'NameController.setAsMain';
      return ControllerService.treatAndConvert(
        req,
        null,
        newName,
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
