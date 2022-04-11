const ControllerService = require('../../../services/ControllerService');
const CaverService = require('../../../services/CaverService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingV1Service');
const RightService = require('../../../services/RightService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a caver.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update a caver.');
  }

  // Check if caver exists
  const caverId = req.param('caverId');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: caverId,
      sailsModel: TCaver,
    }))
  ) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }
  const cleanedData = {
    ...CaverService.getConvertedDataFromClientRequest(req),
    // eslint-disable-next-line object-shorthand
    caverId: caverId,
  };

  // Delete password and email if admin

  // Launch update request using transaction: it performs a rollback if an error occurs
  try {
    await sails.getDatastore().transaction(async (db) => {
      const updatedCaver = await TCaver.updateOne({
        id: caverId,
      })
        .set(cleanedData)
        .usingConnection(db);

      const params = {};
      params.controllerMethod = 'CaverController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedCaver,
        params,
        res,
        MappingV1Service.convertToCaverModel
      );
    });
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
