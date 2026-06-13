const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const { toDevice } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const name = req.param('name');
  const brandName = req.param('brandName');
  const productUrl = req.param('productUrl');
  const manufacturerUrl = req.param('manufacturerUrl');
  const serialNumber = req.param('serialNumber');

  // Validate name: present and non-blank (trimmed)
  if (!name || !name.trim()) {
    return res.badRequest('You must provide a non-blank name for the device.');
  }

  // Validate field lengths
  if (name.trim().length > 300) {
    return res.badRequest('The device name must not exceed 300 characters.');
  }
  if (brandName && brandName.length > 200) {
    return res.badRequest(
      'The device brand name must not exceed 200 characters.'
    );
  }
  if (productUrl && productUrl.length > 500) {
    return res.badRequest(
      'The device product URL must not exceed 500 characters.'
    );
  }
  if (manufacturerUrl && manufacturerUrl.length > 500) {
    return res.badRequest(
      'The device manufacturer URL must not exceed 500 characters.'
    );
  }
  if (serialNumber && serialNumber.length > 200) {
    return res.badRequest(
      'The device serial number must not exceed 200 characters.'
    );
  }

  // Build device data
  const data = {
    name: name.trim(),
    brandName: brandName || null,
    productUrl: productUrl || null,
    manufacturerUrl: manufacturerUrl || null,
    serialNumber: serialNumber || null,
    author: req.token.id,
    dateInscription: new Date(),
  };

  // Create device
  let createdDevice;
  try {
    createdDevice = await TDevice.create(data).fetch();
  } catch (error) {
    sails.log.error('DeviceCreate: failed to create device', error);
    return res.serverError('An error occurred while creating the device.');
  }

  // Fetch populated device
  // TODO: If this fails, the device is already created but the user gets a 500.
  // This is consistent with all other create controllers in the project
  // (document, massif, sensor-configuration, etc.) — see #1655 for platform-wide fix.
  const populatedDevice = await DeviceService.getPopulatedDevice(
    createdDevice.id
  );

  if (!populatedDevice) {
    sails.log.error(
      `DeviceCreate: getPopulatedDevice returned null for just-created device ${createdDevice.id}`
    );
    return res.serverError(
      'An error occurred while retrieving the created device.'
    );
  }

  // Index in Typesense (fire-and-forget: don't fail the request if search is unavailable)
  try {
    await DeviceService.updateInSearch(populatedDevice);
  } catch (err) {
    sails.log.error(
      `DeviceCreate: failed to index device ${populatedDevice.id} in Typesense`,
      err
    );
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedDevice,
    { controllerMethod: 'DeviceController.create' },
    res,
    toDevice
  );
};
