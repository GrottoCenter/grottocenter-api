module.exports = {
  getCaveLocations: async (caveId) => {
    let locations = [];
    if (caveId) {
      locations = await TLocation.find()
        .where({
          cave: caveId,
        })
        .populate('author')
        .populate('language');
    }
    return locations;
  },
  getEntranceLocations: async (entranceId) => {
    let locations = [];
    if (entranceId) {
      locations = await TLocation.find()
        .where({
          entrance: entranceId,
        })
        .populate('author')
        .populate('language');
    }
    return locations;
  },
};
