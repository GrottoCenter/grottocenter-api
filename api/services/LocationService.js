module.exports = {
  getEntranceLocations: async (entranceId, where = {}) => {
    if (!entranceId) return [];
    return TLocation.find({ ...where, entrance: entranceId })
      .populate('author')
      .populate('reviewer');
  },
  getEntranceHLocations: async (
    entranceId,
    hasCompleteViewRight,
    where = {}
  ) => {
    if (!entranceId) return [];
    const loactionIds = await TLocation.find({
      where: { ...where, entrance: entranceId },
      select: ['id'],
    });
    return module.exports.getHLocation(
      loactionIds.map((e) => e.id),
      hasCompleteViewRight
    );
  },

  getLocation: async (locationId) =>
    TLocation.findOne({ id: locationId })
      .populate('author')
      .populate('reviewer'),

  getHLocation: async (locationId, hasCompleteViewRight) => {
    const CHECK_SENSITIVTY_OF_ENTRANCE_FROM_LOCATION_ID = `
    SELECT TE.is_sensitive
    FROM h_location HL
          JOIN t_entrance TE ON HL.id_entrance = TE.id
    WHERE HL.id = $1;`;

    if (!hasCompleteViewRight) {
      // For non admin user, we do not return locations for sensitive entrance
      const sensitivity = await HLocation.getDatastore().sendNativeQuery(
        CHECK_SENSITIVTY_OF_ENTRANCE_FROM_LOCATION_ID,
        [Array.isArray(locationId) ? locationId[0] : locationId]
      );

      if (!sensitivity.rows[0] || sensitivity.rows[0].is_sensitive) return [];
    }

    return HLocation.find({ t_id: locationId })
      .populate('reviewer')
      .populate('author');
  },
};
