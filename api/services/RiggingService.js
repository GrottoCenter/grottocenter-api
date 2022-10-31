const R = require('ramda');

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
  formatRiggingForAPI: async (rigging) => {
    const splitRiggingData = (dataName) =>
      R.pipe(R.propOr('', dataName), R.split(SEPARATOR))(rigging);

    const obstacles = splitRiggingData('obstacles');
    const ropes = splitRiggingData('ropes');
    const anchors = splitRiggingData('anchors');
    const observations = splitRiggingData('observations');

    // eslint-disable-next-line no-param-reassign
    rigging.obstacles = obstacles
      .map((o, idx) => ({
        obstacle: o,
        rope: ropes[idx],
        anchor: anchors[idx],
        observation: observations[idx],
      }))
      // remove empty data (badly formatted data in the db)
      .filter(
        (o) =>
          o.obstacle !== '' ||
          o.rope !== '' ||
          o.anchor !== '' ||
          o.observation !== ''
      );
    return rigging;
  },
  /**
   * Convert an obstacles array (usually coming from the API) into an object of
   * obstacles, ropes, anchors and observations where each property has a string
   * value with the DB format representing multiple columns (with |!| separator)
   *
   * @see RiggingService.test.js for examples
   * @param {Object[]} obstaclesArr
   */
  parseAPIObstaclesArrForDB: async (obstaclesArr) => {
    const obstacles = [];
    const ropes = [];
    const anchors = [];
    const observations = [];
    obstaclesArr.forEach((line) => {
      obstacles.push(line.obstacle ? line.obstacle : '');
      ropes.push(line.rope ? line.rope : '');
      anchors.push(line.anchor ? line.anchor : '');
      observations.push(line.observation ? line.observation : '');
    });
    return {
      obstacles: obstacles.join(SEPARATOR),
      ropes: ropes.join(SEPARATOR),
      anchors: anchors.join(SEPARATOR),
      observations: observations.join(SEPARATOR),
    };
  },
  getEntranceRiggings: async (entranceId) => {
    let riggings = [];
    if (entranceId) {
      riggings = await TRigging.find()
        .where({
          entrance: entranceId,
        })
        .populate('author')
        .populate('reviewer')
        .populate('language');
    }
    riggings.map((rigging) => module.exports.formatRiggingForAPI(rigging));
    return riggings;
  },
};
