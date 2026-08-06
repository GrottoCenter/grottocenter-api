const RightService = require('../../../services/RightService');
const {
  checkColumns,
  ENTRANCE_MANDATORY_COLUMNS,
} = require('../../../utils/csvHelper');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to import entrances via CSV.');
  }

  const { data } = req.body || {};
  if (!Array.isArray(data) || data.length === 0) {
    return res.badRequest(
      'Request body must contain a non-empty "data" array.'
    );
  }

  // Fast-fail: validate mandatory columns on first row
  const missingColumns = await checkColumns(
    data[0],
    ENTRANCE_MANDATORY_COLUMNS
  );
  if (missingColumns.length > 0) {
    return res.badRequest(`Columns missing: ${missingColumns.toString()}`);
  }

  if (!sails.enrichmentBoss) {
    return res.serverError(
      'Job queue is not available. Please try again later.'
    );
  }

  try {
    const { batchId, totalRows, totalChunks } =
      await CSVImportQueueService.createBatch(data, {
        id: req.token.id,
        groups: req.token.groups,
      });

    return res.status(202).json({
      batchId,
      totalRows,
      totalChunks,
      statusUrl: `/api/v1/jobs/${batchId}`,
    });
  } catch (err) {
    sails.log.error('import-rows: failed to create batch:', err);
    return res.serverError('Failed to enqueue import batch.');
  }
};
