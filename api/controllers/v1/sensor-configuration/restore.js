const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const SensorConfigurationService = require('../../../services/SensorConfigurationService');
const {
  toSensorConfiguration,
} = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // 1. Check Moderator permission
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden(
      'You are not authorized to restore a sensor configuration.'
    );

  // 2. Extract deviceId and id from params, coerce to Number
  const deviceId = Number(req.params.deviceId);
  const id = Number(req.params.id);

  // 3. Validate device exists (allow deleted — restore needs only existence)
  const device = await DeviceService.validateDeviceExists(deviceId, {
    allowDeleted: true,
  });
  if (!device) {
    return res.notFound({
      message: `Device of id ${deviceId} not found.`,
    });
  }

  // 4. Find config and validate it belongs to device and is deleted
  const config = await TSensorConfiguration.findOne({ id });
  const configDevice =
    config && typeof config.device === 'object'
      ? config.device.id
      : config?.device;
  if (!config || configDevice !== deviceId || !config.isDeleted) {
    return res.notFound({
      message: `Sensor configuration of id ${id} not found or is not deleted.`,
    });
  }

  // 5. Restore: set isDeleted to false
  await TSensorConfiguration.updateOne({ id }).set({ isDeleted: false });

  // 6. Fetch populated configuration
  const populated =
    await SensorConfigurationService.getPopulatedConfiguration(id);

  // 7. Return via ControllerService.treatAndConvert
  return ControllerService.treatAndConvert(
    req,
    null,
    populated,
    { controllerMethod: 'SensorConfigurationController.restore' },
    res,
    toSensorConfiguration
  );
};
