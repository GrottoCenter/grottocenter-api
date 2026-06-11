const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const RightService = require('../../../services/RightService');
const { toDevice } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const deviceId = Number(req.params.id);

  // No tokenAuth policy — endpoint is publicly accessible. Guard req.token
  // access to avoid crashes on unauthenticated requests. Same pattern as
  // cave/find.js, entrance/find.js, massif/find.js, caver/find.js, etc.
  const hasRight =
    req.token &&
    RightService.hasGroup(req.token.groups, RightService.G.MODERATOR);

  const params = { searchedItem: `Device of id ${deviceId}` };
  const device = await DeviceService.getPopulatedDevice(deviceId);

  if (!device) {
    return res.notFound({ message: `Device of id ${deviceId} not found.` });
  }

  // Hide deleted devices from unauthenticated or non-moderator users
  if (device.isDeleted && !hasRight) {
    return res.notFound({ message: `Device of id ${deviceId} not found.` });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    device,
    params,
    res,
    toDevice
  );
};
