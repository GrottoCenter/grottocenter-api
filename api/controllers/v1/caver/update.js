const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toSimpleCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const propretiesUpdatable = [
    'name',
    'nickname',
    'mail',
    'password',
    'surname',
    'organizations',
  ];

  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  const caverId = req.param('caverId');
  if (!hasAdminRight && Number(caverId) !== req.token.id) {
    return res.forbidden('You can not edit an other account than yours.');
  }

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }

  // Check if the changes requested are authorized (check propretiesUpdatable)
  for (const prop of Object.keys(req.body)) {
    if (!propretiesUpdatable.includes(prop)) {
      return res.badRequest(
        `Could not update property ${prop}, it is not a property which is updatable.`
      );
    }

    if (prop === 'mail' || prop === 'password') {
      if (hasAdminRight) {
        return res.forbidden({
          error: `Admin can not update property ${prop}`,
        });
      }
    }
  }

  // update organizations linked to the caver if needed
  if (req.body.organizations) {
    await TCaver.replaceCollection(caverId, 'grottos').members(
      req.body.organizations.map((organizations) => organizations.id)
    );
  }
  const updatedCaver = await TCaver.updateOne(caverId).set(req.body);

  return ControllerService.treatAndConvert(
    req,
    null,
    updatedCaver,
    { controllerMethod: 'CaverController.update' },
    res,
    toSimpleCaver
  );
};
