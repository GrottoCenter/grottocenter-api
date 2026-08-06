const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const { batchId } = req.params;

  const batch = await TJobBatch.findOne({ id: batchId });
  if (!batch) {
    return res.notFound('Job batch not found.');
  }

  // Access control: users see only their own jobs unless moderator/admin.
  // Return 404 (not 403) for non-owners to avoid leaking batch existence.
  const isModerator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (batch.initiator !== req.token.id && !isModerator && !isAdmin) {
    return res.notFound('Job batch not found.');
  }

  const progress = await CSVImportQueueService.getBatchProgress(batchId);

  return res.ok({
    batchId: batch.id,
    type: batch.type,
    status: batch.status,
    createdAt: batch.createdAt,
    completedAt: batch.completedAt,
    progress,
    result: batch.result || null,
  });
};
