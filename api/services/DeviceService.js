const SearchService = require('./SearchService');

module.exports = {
  /**
   * Validates that a device exists and is accessible.
   * Returns the device record if valid, or null if not found / soft-deleted.
   *
   * @param {number} deviceId
   * @param {Object} [options]
   * @param {boolean} [options.allowDeleted=false] - If true, return the device
   *   even if it is soft-deleted (useful for restore flows).
   * @returns {Promise<Object|null>}
   */
  validateDeviceExists: async (deviceId, { allowDeleted = false } = {}) => {
    const device = await TDevice.findOne({ id: deviceId });
    if (!device) return null;
    if (device.isDeleted && !allowDeleted) return null;
    return device;
  },

  /**
   * Get a device by ID with its associations populated.
   * Deep-populates configurations with their quantityKind and unit objects,
   * excluding soft-deleted configurations.
   *
   * @param {number} deviceId
   * @returns {Promise<Object|null>} the populated device or null if not found
   */
  getPopulatedDevice: async (deviceId) => {
    const device = await TDevice.findOne({ id: deviceId })
      .populate('author')
      .populate('reviewer')
      .populate('configurations');

    if (!device) return null;

    // Deep-populate quantityKind, unit, and substance for each non-deleted configuration
    if (device.configurations && device.configurations.length > 0) {
      const activeConfigs = device.configurations.filter((c) => !c.isDeleted);

      // Collect unique quantityKind, unit, and substance IDs
      const qkIds = [
        ...new Set(activeConfigs.map((c) => c.quantityKind).filter(Boolean)),
      ];
      const unitIds = [
        ...new Set(activeConfigs.map((c) => c.unit).filter(Boolean)),
      ];
      const substanceIds = [
        ...new Set(activeConfigs.map((c) => c.substance).filter(Boolean)),
      ];

      // Batch-fetch referenced records
      const [quantityKinds, units, substances] = await Promise.all([
        qkIds.length > 0 ? TQuantityKind.find({ id: qkIds }) : [],
        unitIds.length > 0 ? TUnit.find({ id: unitIds }) : [],
        substanceIds.length > 0 ? TSubstance.find({ id: substanceIds }) : [],
      ]);

      // Build lookup maps
      const qkMap = Object.fromEntries(quantityKinds.map((qk) => [qk.id, qk]));
      const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
      const substanceMap = Object.fromEntries(substances.map((s) => [s.id, s]));

      // Resolve displayUnit on each quantityKind from the unit map,
      // fetching any missing display units not already in the batch.
      const displayUnitIds = [
        ...new Set(
          quantityKinds
            .map((qk) => qk.displayUnit)
            .filter((id) => id && !unitMap[id])
        ),
      ];
      if (displayUnitIds.length > 0) {
        const displayUnits = await TUnit.find({ id: displayUnitIds });
        displayUnits.forEach((u) => {
          unitMap[u.id] = u;
        });
      }
      quantityKinds.forEach((qk) => {
        if (qk.displayUnit && unitMap[qk.displayUnit]) {
          // eslint-disable-next-line no-param-reassign
          qk.displayUnit = unitMap[qk.displayUnit];
        }
      });

      // Attach populated objects to each config
      device.configurations = activeConfigs.map((config) => ({
        ...config,
        quantityKind: qkMap[config.quantityKind] || config.quantityKind,
        unit: unitMap[config.unit] || config.unit,
        substance: config.substance
          ? substanceMap[config.substance] || config.substance
          : null,
      }));
    } else {
      device.configurations = [];
    }

    return device;
  },

  /**
   * Update or insert a device document in the Typesense search index.
   *
   * @param {Object} populatedDevice - the populated device object
   */
  async updateInSearch(populatedDevice) {
    const author = populatedDevice.author || {};
    const device = {
      id: populatedDevice.id,
      name: populatedDevice.name,
      brandName: populatedDevice.brandName,
      serialNumber: populatedDevice.serialNumber,
      isDeleted: populatedDevice.isDeleted,
      authorId: `${author.id || populatedDevice.author}`,
      authorNickname: author.nickname || '',
    };
    await SearchService.updateDocument('devices', device);
  },

  async deleteInSearch(deviceId) {
    await SearchService.deleteDocument('devices', deviceId);
  },
};
