const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');
const { toCaver } = require('../../../services/mapping/converters');

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

  const hasRightOfAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!hasRightOfAdmin && Number(caverId) !== req.token.id) {
    return res.forbidden('You can not edit an other account than yours.');
  }

  // Check if caver exists
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: caverId,
      sailsModel: TCaver,
    }))
  ) {
    return res.notFound({ error: `Could not find caver with id ${caverId}.` });
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
        return res.forbidden({
          error: `Admin can not update property ${prop}`,
        });
      }
    }
  });

  try {
    // update organizations linked to the caver if needed
    if (req.body.organizations) {
      await TCaver.replaceCollection(caverId, 'grottos').members(
        req.body.organizations.map((organizations) => organizations.id)
      );
    }
    const updatedCaver = await TCaver.updateOne(caverId).set(req.body);

    const params = {};
    params.controllerMethod = 'CaverController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedCaver,
      params,
      res,
      toCaver
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
