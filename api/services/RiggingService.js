const R = require('ramda');

const SEPARATOR = '|;|';

module.exports = {
  formatRiggings: async (riggings) => {
    riggings.map((rigging) => {
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
    });
  },
  getEntranceRiggings: async (entranceId) => {
    let riggings = [];
    if (entranceId) {
      riggings = await TRigging.find()
        .where({
          entrance: entranceId,
        })
        .populate('author')
        .populate('language');
    }
    return riggings;
  },
};
