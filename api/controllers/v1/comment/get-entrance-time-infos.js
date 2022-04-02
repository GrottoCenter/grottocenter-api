const CommentService = require('../../../services/CommentService');

module.exports = (req, res) => {
  const entranceId = req.param('entranceId');
  if (!entranceId) {
    return res.badRequest('getEntranceTimeInfos: entranceId param is missing');
  }
  // get stats
  return CommentService.getTimeInfos(entranceId).then(
    (result) => res.json(result),
    (err) => res.serverError(`getEntranceTimeInfos error: ${err}`)
  );
};
