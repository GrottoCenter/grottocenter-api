const CommentService = require('../../../services/CommentService');

module.exports = async (req, res) => {
  const entranceId = req.param('entranceId');
  if (!entranceId) {
    return res.badRequest('EntranceId param is missing');
  }
  const result = await CommentService.getStatsFromId(entranceId);
  return res.json(result);
};
