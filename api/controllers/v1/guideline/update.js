const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const CommonService = require('../../../services/CommonService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const guidelineId = req.param('id');
  const rawGuideline = await TGuideline.findOne(guidelineId)
    .populate('countries')
    .populate('regions')
    .populate('massifs');
  if (!rawGuideline || rawGuideline.isDeleted) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} not found.`,
    });
  }

  const newTitle = req.param('title');
  const newDescription = req.param('description');
  const newLanguage = req.param('language');
  const newCountries = req.param('countries');
  const newRegions = req.param('regions');
  const newMassifs = req.param('massifs');

  // Reject no-op requests up front. With no updatable field supplied, the only
  // change would be `reviewer`, which silently mutates the record and fires the
  // history snapshot trigger without any meaningful edit having been made.
  const hasScalarChange =
    newTitle !== undefined ||
    newDescription !== undefined ||
    newLanguage !== undefined;
  const hasEntityChange =
    newCountries !== undefined ||
    newRegions !== undefined ||
    newMassifs !== undefined;
  if (!hasScalarChange && !hasEntityChange) {
    return res.badRequest({
      message: 'At least one field to update must be specified.',
    });
  }

  // Deduplicate caller-supplied ids so replaceCollection below doesn't violate
  // the junction table's primary key, and so entity validation counts match.
  // Values sourced from the persisted record are already unique.
  const countries =
    newCountries !== undefined
      ? [...new Set(CommonService.ensureArray(newCountries))]
      : (rawGuideline.countries || []).map((co) => co.id || co);
  const regions =
    newRegions !== undefined
      ? [...new Set(CommonService.ensureArray(newRegions))]
      : (rawGuideline.regions || []).map((r) => r.id || r);
  const massifs =
    newMassifs !== undefined
      ? [
          ...new Set(
            CommonService.ensureArray(newMassifs).map((m) => Number(m))
          ),
        ]
      : (rawGuideline.massifs || []).map((m) => m.id || m);
  // Reject non-numeric massif ids the caller passed instead of silently
  // dropping them (mirrors create). `m <= 0` also catches Number('') === 0.
  // Persisted ids are already valid integers.
  if (
    newMassifs !== undefined &&
    !GuidelineService.validateMassifIds(massifs)
  ) {
    return res.badRequest({
      message: 'All massif ids must be valid positive numbers.',
    });
  }

  // Only validate entity types the caller actually changed: unchanged types are
  // already-persisted (and were validated on create/previous update), so we pass
  // empty arrays for them. resolveEntitiesExist short-circuits on empty arrays.
  const entitiesExist = await GuidelineService.resolveEntitiesExist(
    newCountries !== undefined ? countries : [],
    newRegions !== undefined ? regions : [],
    newMassifs !== undefined ? massifs : []
  );
  if (!entitiesExist) {
    return res.notFound({
      message:
        'One or more of the referenced entities (country, region, massif) does not exist.',
    });
  }

  const updatedFields = {
    reviewer: req.token.id,
  };

  if (newTitle !== undefined) {
    if (!newTitle || newTitle.trim() === '') {
      return res.badRequest({ message: 'Title cannot be empty.' });
    }
    if (newTitle.length > 150) {
      return res.badRequest({
        message: 'Title must be 150 characters or less.',
      });
    }
    updatedFields.title = newTitle;
  }

  if (newDescription !== undefined && newDescription !== null) {
    if (newDescription.length > 500) {
      return res.badRequest({
        message: 'Description must be 500 characters or less.',
      });
    }
    updatedFields.description = newDescription;
  }

  if (newLanguage !== undefined) {
    const lang = await TLanguage.findOne(newLanguage);
    if (!lang) {
      return res.badRequest({
        message: `Language "${newLanguage}" does not exist.`,
      });
    }
    updatedFields.language = newLanguage;
  }

  // The updateOne always runs because we've already validated that at least one
  // field or entity collection is being changed (the early return above guarantees
  // hasScalarChange || hasEntityChange). Even entity-only updates are meaningful
  // mutations that warrant recording the reviewer and triggering a history snapshot.
  await TGuideline.updateOne({ id: guidelineId }).set(updatedFields);

  if (newCountries !== undefined) {
    await TGuideline.replaceCollection(guidelineId, 'countries', countries);
  }

  if (newRegions !== undefined) {
    await TGuideline.replaceCollection(guidelineId, 'regions', regions);
  }

  if (newMassifs !== undefined) {
    await TGuideline.replaceCollection(guidelineId, 'massifs', massifs);
  }

  const populatedGuideline = await GuidelineService.getGuideline(guidelineId);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedGuideline,
    { controllerMethod: 'GuidelineController.update' },
    res,
    toSimpleGuideline
  );
};
