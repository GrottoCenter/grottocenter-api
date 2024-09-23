const { toSimpleCaver } = require('../../../services/mapping/converters');
const { toList } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const [moderators, administrators, leaders] = await Promise.all([
    TGroup.findOne({ name: 'Moderator' }).populate('cavers'),
    TGroup.findOne({ name: 'Administrator' }).populate('cavers'),
    TGroup.findOne({ name: 'Leader' }).populate('cavers'),
  ]);

  return res.ok({
    administrators: toList('cavers', administrators, toSimpleCaver),
    moderators: toList('cavers', moderators, toSimpleCaver),
    leaders: toList('cavers', leaders, toSimpleCaver),
  });
};
