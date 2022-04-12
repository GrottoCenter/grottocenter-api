const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingV1Service');
const RightService = require('../../../services/RightService');
// const CaverService = require('../../../services/CaverService');
// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // list of propreties to update
  const propretiesUpdatable = [
    'name',
    'nickname',
    'mail',
    'password',
    'surname',
  ];

  // Check right (Admin can't edit mail and password)
  const hasRightToEditAll = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.EDIT_OWN,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a caver.'
      )
    );
  const hasRightToEditPartially = await sails.helpers.checkRight
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

  if (!hasRightToEditPartially) {
    if (!hasRightToEditAll) {
      return res.forbidden('You are not authorized to update a caver.');
    }
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
    res.status(404);
    return res.json({ error: `Could not find caver with id ${caverId}.` });
  }

  // Check if the changes requested are authorized (check propretiesUpdatable)
  const keys = Object.keys(req.body);
  // eslint-disable-next-line consistent-return
  keys.forEach((prop) => {
    if (!propretiesUpdatable.includes(prop)) {
      return res.badRequest(
        `Could not update property ${prop}, it is not a property which is updatable.`
      );
    }
    if (prop === 'mail' || prop === 'password') {
      if (hasRightToEditPartially) {
        res.status(403);
        return res.json({ error: `Admin can not update property ${prop}` });
      }
    }
  });

  // Launch update request using transaction: it performs a rollback if an error occurs
  try {
    await sails.getDatastore().transaction(async (db) => {
      //     const grottosToAdd =
      //    const grottosToRemove =
      /* const caver = await CaverService.getCaver(req.param('caverId'));
      console.log(caver); */
      // await TCaver.addToCollection(caverId, 'grottos', entranceID);
      const updatedCaver = await TCaver.updateOne(caverId)
        .set(req.body)
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
