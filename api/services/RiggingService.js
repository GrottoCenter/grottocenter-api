const SEPARATOR = '|;|';

module.exports = {
  /**
   * Convert rigging objects with 1 property for obstacles, ropes, ... containing
   * each one a string representing multiple columns (with |!| separator into a
   * line by line object.
   *
   * @see RiggingService.test.js for examples
   * @param {Object} rigging
   */
  deserializeForAPI: (rigging) => {
    const obstacles = (rigging.obstacles ?? '').split(SEPARATOR);
    const ropes = (rigging.ropes ?? '').split(SEPARATOR);
    const anchors = (rigging.anchors ?? '').split(SEPARATOR);
    const observations = (rigging.observations ?? '').split(SEPARATOR);

    // eslint-disable-next-line no-param-reassign
    return (
      obstacles
        .map((_, i) => ({
          obstacle: obstacles[i] ?? '',
          rope: ropes[i] ?? '',
          anchor: anchors[i] ?? '',
          observation: observations[i] ?? '',
        }))
        // remove empty data (badly formatted data in the db)
        .filter(
          (o) =>
            o.obstacle !== '' ||
            o.rope !== '' ||
            o.anchor !== '' ||
            o.observation !== ''
        )
    );
  },
  /**
   * Convert an obstacles array (usually coming from the API) into an object of
   * obstacles, ropes, anchors and observations where each property has a string
   * value with the DB format representing multiple columns (with |!| separator)
   *
   * @see RiggingService.test.js for examples
   * @param {Object[]} obstaclesArr
   */
  serializeObstaclesForDB: async (obstaclesArr) => {
    const obstacles = [];
    const ropes = [];
    const anchors = [];
    const observations = [];
    for (const line of obstaclesArr) {
      obstacles.push(line.obstacle ? line.obstacle : '');
      ropes.push(line.rope ? line.rope : '');
      anchors.push(line.anchor ? line.anchor : '');
      observations.push(line.observation ? line.observation : '');
    }
    return {
      obstacles: obstacles.join(SEPARATOR),
      ropes: ropes.join(SEPARATOR),
      anchors: anchors.join(SEPARATOR),
      observations: observations.join(SEPARATOR),
    };
  },
  getEntranceRiggings: async (entranceId, { includeDeleted = false } = {}) => {
    let riggings = [];
    if (entranceId) {
      riggings = await TRigging.find()
        .where({ entrance: entranceId, isDeleted: includeDeleted })
        .populate('author')
        .populate('reviewer');
    }
    return riggings;
  },

  getRigging: async (riggingId, { includeDeleted = false } = {}) =>
    TRigging.findOne({ id: riggingId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer'),
};
