module.exports = {
  /**
   * Transform normalized document data to MARC format for everyone (default)
   * @param {Object} document - Document data from your notice format
   * @returns {Object} Normalized document data for MARC conversion
   */
  normalizeMarc: async (document) => document,
};
