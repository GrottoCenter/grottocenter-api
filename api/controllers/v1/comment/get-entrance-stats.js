const CommentService = require('../../../services/CommentService');

module.exports = (req, res) => {
  const entranceId = req.param('entranceId');
  if (!entranceId) {
    return res.badRequest('EntranceId param is missing');
  }
  return CommentService.getStats(entranceId).then(
    (result) => res.json(result),
    (err) => res.serverError(`getEntranceStats error : ${err}`)
  );
};
