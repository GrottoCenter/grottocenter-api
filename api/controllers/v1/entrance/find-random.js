const EntranceService = require('../../../services/EntranceService');
const { toSimpleEntrance } = require('../../../services/mapping/converters');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  const entrance = await EntranceService.findRandom();
  if (!entrance) return res.notFound();
  res.ok({
    ...toSimpleEntrance(entrance),
    stats: entrance.stats,
    timeInfo: entrance.timeInfo,
  });
};
