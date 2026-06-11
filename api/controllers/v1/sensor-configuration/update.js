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

  // 2. Validate device exists and is not deleted
  const device = await DeviceService.validateDeviceExists(deviceId);
  if (!device) {
    return res.notFound({
      message: `Device of id ${deviceId} not found.`,
    });
  }

  // 3. Extract updatable fields
  const quantityKind = req.param('quantityKind');
  const unit = req.param('unit');
  const precisionUpper = req.param('precisionUpper');
  const precisionLower = req.param('precisionLower');
  const resolution = req.param('resolution');
  const detectionLimitMin = req.param('detectionLimitMin');
  const detectionLimitMax = req.param('detectionLimitMax');

  // 4. If no recognized updatable field is present → 400
  const hasUpdatableField =
    quantityKind !== undefined ||
    unit !== undefined ||
    precisionUpper !== undefined ||
    precisionLower !== undefined ||
    resolution !== undefined ||
    detectionLimitMin !== undefined ||
    detectionLimitMax !== undefined;

  if (!hasUpdatableField) {
    return res.badRequest(
      'You must provide at least one updatable field (quantityKind, unit, precisionUpper, precisionLower, resolution, detectionLimitMin, detectionLimitMax).'
    );
  }

  // 5. Find existing config
  const config = await TSensorConfiguration.findOne({ id });
  const configDevice =
    config && typeof config.device === 'object'
      ? config.device.id
      : config?.device;
  if (!config || configDevice !== deviceId || config.isDeleted) {
    return res.notFound({
      message: `Sensor configuration of id ${id} not found.`,
    });
  }

  // 5b. Authorization: only the original author or a moderator/admin can update
  const isOwner = config.author === req.token.id;
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!isOwner && !hasModeratorRight) {
    return res.forbidden(
      'You are not authorized to update this sensor configuration.'
    );
  }

  // 6. Validate quantityKind if provided
  if (quantityKind !== undefined) {
    const existingQuantityKind = await TQuantityKind.findOne({
      id: quantityKind,
    });
    if (!existingQuantityKind) {
      return res.badRequest('You must provide a valid quantity kind.');
    }
  }

  // 7. Validate unit if provided
  if (unit !== undefined) {
    const existingUnit = await TUnit.findOne({ id: unit });
    if (!existingUnit) {
      return res.badRequest('You must provide a valid unit.');
    }
  }

  // 8. Build update set: only provided fields + reviewer/dateReviewed
  const updateData = {
    reviewer: req.token.id,
    dateReviewed: new Date(),
  };

  if (quantityKind !== undefined) updateData.quantityKind = quantityKind;
  if (unit !== undefined) updateData.unit = unit;
  if (precisionUpper !== undefined) updateData.precisionUpper = precisionUpper;
  if (precisionLower !== undefined) updateData.precisionLower = precisionLower;
  if (resolution !== undefined) updateData.resolution = resolution;
  if (detectionLimitMin !== undefined)
    updateData.detectionLimitMin = detectionLimitMin;
  if (detectionLimitMax !== undefined)
    updateData.detectionLimitMax = detectionLimitMax;

  // 9. Update the record
  await TSensorConfiguration.updateOne({ id }).set(updateData);

  // 10. Fetch populated configuration
  const populated =
    await SensorConfigurationService.getPopulatedConfiguration(id);

  // 11. Return via ControllerService.treatAndConvert with toSensorConfiguration
  return ControllerService.treatAndConvert(
    req,
    null,
    populated,
    { controllerMethod: 'SensorConfigurationController.update' },
    res,
    toSensorConfiguration
  );
};
