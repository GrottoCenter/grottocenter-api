const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const RightService = require('../../../services/RightService');
const SensorConfigurationService = require('../../../services/SensorConfigurationService');
const {
  toSensorConfiguration,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // 1. Extract deviceId and id from params, coerce to Number
  const deviceId = Number(req.params.deviceId);
  const id = Number(req.params.id);

  // No tokenAuth policy — endpoint is publicly accessible. Guard req.token
  // access to avoid crashes on unauthenticated requests. Same pattern as
  // cave/find.js, entrance/find.js, massif/find.js, document/find.js, etc.
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  // 2. Validate device exists (moderators can see deleted devices)
  const device = await DeviceService.validateDeviceExists(deviceId, {
    allowDeleted: hasRight,
  });
  if (!device) {
    return res.notFound({
      message: `Device of id ${deviceId} not found.`,
    });
  }

  // 3. Call SensorConfigurationService.getPopulatedConfiguration(id)
  const config = await SensorConfigurationService.getPopulatedConfiguration(id);

  // 4. If not found or config.device !== deviceId → 404
  const configDevice =
    config && typeof config.device === 'object'
      ? config.device.id
      : config?.device;
  if (!config || configDevice !== deviceId) {
    return res.notFound({
      message: `Sensor configuration of id ${id} not found.`,
    });
  }

  // 5. Deleted configs: hide from unauthenticated or non-moderator users
  if (config.isDeleted && !hasRight) {
    return res.notFound({
      message: `Sensor configuration of id ${id} not found.`,
    });
  }

  // 6. Return via ControllerService.treatAndConvert with toSensorConfiguration
  return ControllerService.treatAndConvert(
    req,
    null,
    config,
    { controllerMethod: 'SensorConfigurationController.find' },
    res,
    toSensorConfiguration
  );
};
