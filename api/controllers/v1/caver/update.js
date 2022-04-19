const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // list of propreties to update
  const propretiesUpdatable = [
    'name',
    'nickname',
    'mail',
    'password',
    'surname',
    'organizations',
  ];

  // Check right
  const caverId = req.param('caverId');

  const hasRightOfUser = await sails.helpers.checkRight
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

  const hasRightOfAdmin = await sails.helpers.checkRight
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

  if (!hasRightOfAdmin) {
    if (!hasRightOfUser) {
      return res.forbidden('You are not authorized to update a caver.');
    }

    if (Number(caverId) !== req.token.id) {
      return res.forbidden('You can not edit an other account than yours.');
    }
  }

  // Check if caver exists
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
      if (hasRightOfAdmin) {
        res.status(403);
        return res.json({ error: `Admin can not update property ${prop}` });
      }
    }
  });

  // Launch update request using transaction: it performs a rollback if an error occurs
  try {
    // update organizations linked to the caver if needed
    if (req.body.organizations) {
      await TCaver.replaceCollection(caverId, 'grottos').members(
        req.body.organizations.map((organizations) => organizations.id)
      );
    }
    // update the other propreties
    await sails.getDatastore().transaction(async (db) => {
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
        MappingService.convertToCaverModel
      );
    });
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
