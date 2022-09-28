module.exports = {
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
