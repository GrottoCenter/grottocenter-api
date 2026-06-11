module.exports = {
  /**
   * Get a sensor configuration by ID with populated associations.
   *
   * @param {number} configId
   * @returns {Promise<Object|null>} the populated configuration or null if not found
   */
  getPopulatedConfiguration: async (configId) => {
    const config = await TSensorConfiguration.findOne({ id: configId })
      .populate('author')
      .populate('reviewer')
      .populate('quantityKind')
      .populate('unit');
    return config || null;
  },
};
