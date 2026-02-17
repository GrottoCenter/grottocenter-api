const RelevanceService = require('../../../services/RelevanceService');

module.exports = async (req, res) => {
  const id = Number(req.params.id);
  const direction = Number(req.body.direction);

  try {
    const result = await RelevanceService.moveRelevance(
      'comment',
      id,
      direction
    );
    return res.ok(result);
  } catch (err) {
    if (err.status === 404) return res.notFound({ message: err.message });
    return res.badRequest({ message: err.message });
  }
};
