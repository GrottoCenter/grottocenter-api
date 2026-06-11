const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const RightService = require('../../../services/RightService');
const SensorConfigurationService = require('../../../services/SensorConfigurationService');
const {
  toSensorConfiguration,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // 1. Check permissions: Moderator or Administrator required
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!hasModeratorRight && !hasAdminRight) {
    return res.forbidden(
      'You are not authorized to delete a sensor configuration.'
    );
  }

  // 2. Extract deviceId and id, coerce to Number
  const deviceId = Number(req.params.deviceId);
  const id = Number(req.params.id);

  // 3. Validate device exists and is not deleted
  const device = await DeviceService.validateDeviceExists(deviceId);
  if (!device) {
    return res.notFound({
      message: `Device of id ${deviceId} not found.`,
    });
  }

  // 4. Find config and validate ownership
  const config = await SensorConfigurationService.getPopulatedConfiguration(id);
  const configDevice =
    config && typeof config.device === 'object'
      ? config.device.id
      : config?.device;

  if (!config || configDevice !== deviceId) {
    return res.notFound({
      message: `Sensor configuration of id ${id} not found.`,
    });
  }

  const isPermanent = req.param('isPermanent') === 'true';

  if (isPermanent) {
    // 5a. Permanent delete: require Administrator
    if (!hasAdminRight) {
      return res.forbidden(
        'You are not authorized to permanently delete a sensor configuration.'
      );
    }

    // Two-phase delete via the histo_delete() trigger:
    //   Phase 1: DELETE on a non-deleted row → trigger sets is_deleted=true (soft delete)
    //   Phase 2: DELETE on an already-deleted row → trigger allows actual removal (hard delete)
    //
    // NOTE: The FK check intentionally happens BETWEEN phases, not before Phase 1.
    // Rationale: requesting permanent deletion implies intent to delete — soft-delete
    // is the correct outcome regardless. Only the irreversible hard-delete is gated
    // by the FK check. This mirrors cave/delete.js, entrance/delete.js, etc.
    // See: https://github.com/GrottoCenter/grottocenter-api/issues/1654
    if (!config.isDeleted) {
      await TSensorConfiguration.destroyOne({ id });
    }

    // FK guard: prevent hard delete if children exist (soft-delete already applied above)
    const timeSeriesCount = await TTimeSeries.count({
      sensorConfiguration: id,
    });
    if (timeSeriesCount > 0) {
      return res.conflict(
        'This sensor configuration cannot be permanently deleted because it has associated time series.'
      );
    }

    // Hard delete (phase 2 of histo_delete trigger — actual row removal)
    await TSensorConfiguration.destroyOne({ id });
  } else if (!config.isDeleted) {
    // 5b. Soft delete
    await TSensorConfiguration.destroyOne({ id });
  }

  config.isDeleted = true;

  return ControllerService.treatAndConvert(
    req,
    null,
    config,
    { controllerMethod: 'SensorConfigurationController.delete' },
    res,
    toSensorConfiguration
  );
};
