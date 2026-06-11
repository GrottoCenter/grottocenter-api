const ControllerService = require('../../../services/ControllerService');
const DeviceService = require('../../../services/DeviceService');
const RightService = require('../../../services/RightService');
const { toDevice } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const id = req.param('id');

  // Extract updatable fields from request body
  const name = req.param('name');
  const brandName = req.param('brandName');
  const productUrl = req.param('productUrl');
  const manufacturerUrl = req.param('manufacturerUrl');

  // Validate at least one updatable field is present
  if (
    name === undefined &&
    brandName === undefined &&
    productUrl === undefined &&
    manufacturerUrl === undefined
  ) {
    return res.badRequest(
      'You must provide at least one updatable field (name, brandName, productUrl, manufacturerUrl).'
    );
  }

  // Find device: not found or soft-deleted → 404
  const device = await TDevice.findOne({ id });
  if (!device || device.isDeleted) {
    return res.notFound({
      message: `Device of id ${id} not found.`,
    });
  }

  // Authorization: only the original author or a moderator/admin can update
  const isOwner = device.author === req.token.id;
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!isOwner && !hasModeratorRight) {
    return res.forbidden('You are not authorized to update this device.');
  }

  // Validate field values
  if (name !== undefined) {
    if (!name || !name.trim()) {
      return res.badRequest(
        'You must provide a non-blank name for the device.'
      );
    }
    if (name.trim().length > 300) {
      return res.badRequest('The device name must not exceed 300 characters.');
    }
  }
  if (brandName !== undefined && brandName && brandName.length > 200) {
    return res.badRequest(
      'The device brand name must not exceed 200 characters.'
    );
  }
  if (productUrl !== undefined && productUrl && productUrl.length > 500) {
    return res.badRequest(
      'The device product URL must not exceed 500 characters.'
    );
  }
  if (
    manufacturerUrl !== undefined &&
    manufacturerUrl &&
    manufacturerUrl.length > 500
  ) {
    return res.badRequest(
      'The device manufacturer URL must not exceed 500 characters.'
    );
  }

  // Build update set: only provided fields + reviewer
  const updateData = {
    reviewer: req.token.id,
    dateReviewed: new Date(),
  };

  if (name !== undefined) updateData.name = name.trim();
  if (brandName !== undefined) updateData.brandName = brandName || null;
  if (productUrl !== undefined) updateData.productUrl = productUrl || null;
  if (manufacturerUrl !== undefined)
    updateData.manufacturerUrl = manufacturerUrl || null;

  // Update device
  await TDevice.updateOne({ id }).set(updateData);

  // Fetch populated device
  const populatedDevice = await DeviceService.getPopulatedDevice(id);

  // Re-index in Typesense
  await DeviceService.updateInSearch(populatedDevice);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedDevice,
    { controllerMethod: 'DeviceController.update' },
    res,
    toDevice
  );
};
