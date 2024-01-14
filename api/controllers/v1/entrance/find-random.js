const EntranceService = require('../../../services/EntranceService');
const { toSimpleEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entrance = await EntranceService.findRandom();
  res.ok({
    ...toSimpleEntrance(entrance),
    stats: entrance.stats,
    timeInfo: entrance.timeInfo,
  });
};
