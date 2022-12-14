const RightService = require('./RightService');

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
  getIdLocationsByEntranceId: async (
    entranceId,
    { includeDeleted = false } = {}
  ) => {
    if (!entranceId) return [];
    return TLocation.find({
      where: { entrance: entranceId, isDeleted: includeDeleted },
      select: ['id'],
    });
  },

  getHLocationById: async (locationId, token) => {
    const CHECK_SENSITIVTY_OF_ENTRANCE_FROM_LOCATION_ID = `SELECT TE.is_sensitive
                                                         FROM h_location HL
                                                                JOIN t_entrance TE ON HL.id_entrance = TE.id
                                                         WHERE HL.id = $1; `;
    try {
      const sensitivity = await HLocation.getDatastore().sendNativeQuery(
        CHECK_SENSITIVTY_OF_ENTRANCE_FROM_LOCATION_ID,
        [locationId]
      );
      if (!sensitivity.rows[0]) {
        return '404';
      }
      const isSensitive = sensitivity.rows[0].is_sensitive;

      if (isSensitive === undefined) {
        return '500';
      }

      if (isSensitive && !token) {
        // The person is not authenticated
        return '401';
      }

      const hasRight = isSensitive
        ? await sails.helpers.checkRight.with({
            groups: token.groups,
            rightEntity: RightService.RightEntities.ENTRANCE,
            rightAction: RightService.RightActions.VIEW_COMPLETE,
          })
        : true; // No need to call checkRight if it's not a sensitive entrance

      if (isSensitive && !hasRight) {
        return '403';
      }

      const locationsHPopulated = await HLocation.find({ t_id: locationId })
        .populate('reviewer')
        .populate('author')
        .populate('entrance');

      return locationsHPopulated;
    } catch (error) {
      return error;
    }
  },
};
