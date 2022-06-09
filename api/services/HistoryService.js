module.exports = {
  getCaveHistories: async (caveId) => {
    let histories = [];
    if (caveId) {
      histories = await THistory.find()
        .where({
          cave: caveId,
        })
        .populate('author')
        .populate('language');
    }
    return histories;
  },
  getEntranceHistories: async (entranceId) => {
    let histories = [];
    if (entranceId) {
      histories = await THistory.find()
        .where({
          entrance: entranceId,
        })
        .populate('author')
        .populate('language');
    }
    return histories;
  },
};
