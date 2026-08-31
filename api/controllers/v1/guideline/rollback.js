const dayjs = require('../../../utils/dayjs');
const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // The validateId policy is intentionally not applied to this route (the
  // :snapshotId param is an ISO date string it would reject), so validate the
  // numeric id here — mirroring get-snapshots — instead of letting a malformed
  // id like "1abc" be silently coerced by Waterline in findOne below.
  const guidelineId = Number(req.param('id'));
  if (Number.isNaN(guidelineId)) {
    return res.badRequest({ message: 'Guideline ID must be a number.' });
  }

  const snapshotId = req.param('snapshotId');

  if (!snapshotId) {
    return res.badRequest({ message: 'Missing snapshotId parameter.' });
  }

  const parsedSnapshotId = dayjs(snapshotId);
  if (!parsedSnapshotId.isValid()) {
    return res.badRequest({
      message: 'snapshotId must be a valid ISO date string.',
    });
  }

  const rawGuideline = await TGuideline.findOne(guidelineId);
  if (!rawGuideline || rawGuideline.isDeleted) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} not found.`,
    });
  }

  // Find the specific history snapshot by comparing instants rather than doing a
  // formatted-string equality on the timestamp column. The model's `id` is
  // date_reviewed, whose serialized form depends on the adapter and the server
  // timezone, so reformatting the incoming value to a fixed string risks a
  // silent mismatch (-> false 404). History rows per guideline are few, so
  // resolving in JS is cheap and guarantees any id returned by GET /snapshots
  // round-trips here. The limit is a safety net for guidelines with unusually
  // many snapshots — in practice, history rows are in the single digits.
  const targetInstant = parsedSnapshotId.valueOf();
  const snapshots = await HGuideline.find({ t_id: guidelineId }).limit(1000);
  const snapshot = snapshots.find(
    (s) => dayjs(s.id).valueOf() === targetInstant
  );

  if (!snapshot) {
    return res.notFound({
      message: `History snapshot for guideline ${guidelineId} at ${snapshotId} not found.`,
    });
  }

  // Rollback the fields
  const updatedFields = {
    title: snapshot.title,
    description: snapshot.description,
    language: snapshot.language,
    reviewer: req.token.id,
  };

  await TGuideline.updateOne({ id: guidelineId }).set(updatedFields);

  const populatedGuideline = await GuidelineService.getGuideline(guidelineId);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedGuideline,
    { controllerMethod: 'GuidelineController.rollback' },
    res,
    toSimpleGuideline
  );
};
