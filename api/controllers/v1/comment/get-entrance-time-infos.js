const CommentService = require('../../../services/CommentService');

module.exports = async (req, res) => {
  const entranceId = req.param('entranceId');
  if (!entranceId) {
    return res.badRequest('getEntranceTimeInfos: entranceId param is missing');
  }
  const result = await CommentService.getTimeInfos(entranceId);
  return res.json(result);
};
