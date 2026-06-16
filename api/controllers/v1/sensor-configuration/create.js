const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const SensorConfigurationService = require('../../../services/SensorConfigurationService');
const {
  toSensorConfiguration,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // 1. Extract deviceId from params
  const deviceId = Number(req.params.deviceId);

  // 2. Validate device exists and is not deleted
  const device = await DeviceService.validateDeviceExists(deviceId);
  if (!device) {
    return res.notFound({
      message: `Device of id ${deviceId} not found.`,
    });
  }

  // 3. Extract quantityKind and unit from request body
  const quantityKind = req.param('quantityKind');
  const unit = req.param('unit');

  // 4. Validate quantityKind
  if (!quantityKind) {
    return res.badRequest('You must provide a valid quantity kind.');
  }
  const existingQuantityKind = await TQuantityKind.findOne({
    id: quantityKind,
  });
  if (!existingQuantityKind) {
    return res.badRequest('You must provide a valid quantity kind.');
  }

  // 5. Validate unit
  if (!unit) {
    return res.badRequest('You must provide a valid unit.');
  }
  const existingUnit = await TUnit.findOne({ id: unit });
  if (!existingUnit) {
    return res.badRequest('You must provide a valid unit.');
  }

  // 6. Extract optional numeric fields
  const precisionUpper = req.param('precisionUpper');
  const precisionLower = req.param('precisionLower');
  const resolution = req.param('resolution');
  const detectionLimitMin = req.param('detectionLimitMin');
  const detectionLimitMax = req.param('detectionLimitMax');
  const label = req.param('label');
  const substance = req.param('substance');

  // Validate label length
  if (label && label.length > 300) {
    return res.badRequest(
      'The sensor configuration label must not exceed 300 characters.'
    );
  }

  // Validate substance
  const substanceError = SensorConfigurationService.validateSubstance(
    substance,
    existingQuantityKind.code
  );
  if (substanceError) {
    return res.badRequest(substanceError);
  }

  // 7. Build data object
  const data = {
    device: deviceId,
    quantityKind,
    unit,
    precisionUpper: precisionUpper ?? null,
    precisionLower: precisionLower ?? null,
    resolution: resolution ?? null,
    detectionLimitMin: detectionLimitMin ?? null,
    detectionLimitMax: detectionLimitMax ?? null,
    label: label || null,
    substance: substance || null,
    author: req.token.id,
    dateInscription: new Date(),
  };

  // 8. Create record
  const created = await TSensorConfiguration.create(data).fetch();

  // 9. Fetch populated configuration
  // TODO: If this fails, the config is already created but the user gets a 500.
  // Consistent with all other create controllers — see #1655 for platform-wide fix.
  const populated = await SensorConfigurationService.getPopulatedConfiguration(
    created.id
  );

  // 10. Return via ControllerService.treatAndConvert
  return ControllerService.treatAndConvert(
    req,
    null,
    populated,
    { controllerMethod: 'SensorConfigurationController.create' },
    res,
    toSensorConfiguration
  );
};
