const R = require('ramda');

const SEPARATOR = '|;|';

module.exports = {
  /**
   * @param {string} document to document to set names including its parent if present
   */
  formatRiggings: async (riggings) => {
    const separator = riggings.map((rigging) => {
      const splitRiggingData = (dataName) =>
        R.pipe(R.propOr('', dataName), R.split(SEPARATOR))(rigging);

      const obstacles = splitRiggingData('obstacles');
      const ropes = splitRiggingData('ropes');
      const anchors = splitRiggingData('anchors');
      const observations = splitRiggingData('observations');

      rigging.obstacles = obstacles.map((o, idx) => ({
        obstacle: o,
        rope: ropes[idx],
        anchor: anchors[idx],
        observation: observations[idx],
      }));
    });
  },
};
