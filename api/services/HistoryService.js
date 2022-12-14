module.exports = {
  getHistory: async (historyId, { includeDeleted = false } = {}) =>
    THistory.findOne({ id: historyId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer'),

  getCaveHistories: async (caveId) => {
    if (!caveId) return [];
    return THistory.find()
      .where({ cave: caveId })
      .populate('author')
      .populate('reviewer');
  },
  getEntranceHistories: async (entranceId, { includeDeleted = false } = {}) => {
    if (!entranceId) return [];
    return THistory.find()
      .where({ entrance: entranceId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer');
  },
  getIdHistoriesByEntranceId: async (entranceId) => {
    if (!entranceId) return [];
    return THistory.find({ where: { entrance: entranceId }, select: ['id'] });
  },
  getHHistoriesById: async (historyId) =>
    HHistory.find({ t_id: historyId }).populate('reviewer').populate('author'),
};
