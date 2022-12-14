module.exports = {
  getLocation: async (locationId, { includeDeleted = false } = {}) =>
    TLocation.findOne({ id: locationId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer'),

  getEntranceLocations: async (entranceId, { includeDeleted = false } = {}) => {
    if (!entranceId) return [];
    return TLocation.find()
      .where({ entrance: entranceId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer');
  },
};
