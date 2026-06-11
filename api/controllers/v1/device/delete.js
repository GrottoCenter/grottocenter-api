const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const RightService = require('../../../services/RightService');
const { toDevice } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!hasModeratorRight && !hasAdminRight) {
    return res.forbidden('You are not authorized to delete a device.');
  }

  const deviceId = Number(req.param('id'));
  const device = await DeviceService.getPopulatedDevice(deviceId);
  if (!device) {
    return res.notFound({ message: `Device of id ${deviceId} not found.` });
  }

  const isPermanent = req.param('isPermanent') === 'true';

  if (isPermanent) {
    if (!hasAdminRight) {
      return res.forbidden(
        'You are not authorized to permanently delete a device.'
      );
    }

    // Two-phase delete via the histo_delete() trigger:
    //   Phase 1: DELETE on a non-deleted row → trigger sets is_deleted=true (soft delete)
    //   Phase 2: DELETE on an already-deleted row → trigger allows actual removal (hard delete)
    // This pattern is shared across all soft-deletable entities in the project.
    //
    // NOTE: The FK check intentionally happens BETWEEN phases, not before Phase 1.
    // Rationale: requesting permanent deletion implies intent to delete — soft-delete
    // is the correct outcome regardless. Only the irreversible hard-delete is gated
    // by the FK check. This mirrors cave/delete.js, entrance/delete.js, etc.
    // See: https://github.com/GrottoCenter/grottocenter-api/issues/1654
    if (!device.isDeleted) {
      await TDevice.destroyOne({ id: deviceId });
    }

    // FK guard: prevent hard delete if children exist (soft-delete already applied above)
    const sensorConfigCount = await TSensorConfiguration.count({
      device: deviceId,
    });
    if (sensorConfigCount > 0) {
      return res.conflict(
        'This device cannot be permanently deleted because it has associated sensor configurations.'
      );
    }

    // Hard delete (phase 2 of histo_delete trigger — actual row removal)
    await TDevice.destroyOne({ id: deviceId });

    // Remove from Typesense search index
    await DeviceService.deleteInSearch(deviceId);
  } else {
    // Soft delete
    if (!device.isDeleted) {
      await TDevice.destroyOne({ id: deviceId });
    }

    // Update search index to reflect deleted state
    await DeviceService.updateInSearch({ ...device, isDeleted: true });
  }

  device.isDeleted = true;

  return ControllerService.treatAndConvert(
    req,
    null,
    device,
    { controllerMethod: 'DeviceController.delete' },
    res,
    toDevice
  );
};
