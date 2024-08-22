module.exports = {
  getEntranceHistories: async (entranceId, where = {}) => {
    if (!entranceId) return [];
    return THistory.find({ ...where, entrance: entranceId })
      .populate('author')
      .populate('reviewer');
  },
  getEntranceHHistories: async (entranceId, where = {}) => {
    if (!entranceId) return [];
    const historyIds = await THistory.find({
      where: { ...where, entrance: entranceId },
      select: ['id'],
    });
    return module.exports.getHHistories(historyIds.map((e) => e.id));
  },

  getHistory: async (historyId) =>
    THistory.findOne({ id: historyId }).populate('author').populate('reviewer'),

  getHHistories: async (historyId) =>
    HHistory.find({ t_id: historyId }).populate('reviewer').populate('author'),
};
