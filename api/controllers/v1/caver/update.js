const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const CaverService = require('../../../services/CaverService');
const { toSimpleCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const propertiesUpdatable = ['name', 'nickname', 'surname', 'organizations'];

  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!hasAdminRight) {
    return res.forbidden('Only administrators can use this endpoint.');
  }

  const caverId = req.param('caverId');
  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }

  // Check if the changes requested are authorized (check propertiesUpdatable)
  for (const prop of Object.keys(req.body)) {
    if (!propertiesUpdatable.includes(prop)) {
      return res.badRequest(
        `Could not update property ${prop}, it is not a property which is updatable.`
      );
    }
  }

  // update organizations linked to the caver if needed
  if (req.body.organizations) {
    await TCaver.replaceCollection(caverId, 'grottos').members(
      req.body.organizations.map((organizations) => organizations.id)
    );
  }
  const updatedCaver = await TCaver.updateOne(caverId).set(req.body);
  await CaverService.updateInSearch(updatedCaver);

  return ControllerService.treatAndConvert(
    req,
    null,
    updatedCaver,
    { controllerMethod: 'CaverController.update' },
    res,
    toSimpleCaver
  );
};
