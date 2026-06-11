const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const { toDevice } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore a device.');

  const { id } = req.params;
  const device = await DeviceService.getPopulatedDevice(id);
  if (!device || !device.isDeleted) {
    return res.notFound({
      message: `Device of id ${id} not found or not deleted.`,
    });
  }

  await TDevice.updateOne({ id }).set({
    isDeleted: false,
  });
  device.isDeleted = false;

  await DeviceService.updateInSearch(device);

  return ControllerService.treatAndConvert(
    req,
    null,
    device,
    { controllerMethod: 'DeviceController.restore' },
    res,
    toDevice
  );
};
