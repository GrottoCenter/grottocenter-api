const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const CommonService = require('../../../services/CommonService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
    'title',
    'language',
  ]);
  if (!mandatoryParams) return null;
  const [title, language] = mandatoryParams;

  if (title.trim() === '') {
    return res.badRequest({
      message: 'Title cannot be empty.',
    });
  }

  if (title.length > 150) {
    return res.badRequest({
      message: 'Title must be 150 characters or less.',
    });
  }

  const description = req.param('description');
  if (description && description.length > 500) {
    return res.badRequest({
      message: 'Description must be 500 characters or less.',
    });
  }

  const lang = await TLanguage.findOne(language);
  if (!lang) {
    return res.badRequest({
      message: `Language "${language}" does not exist.`,
    });
  }

  // Deduplicate so addToCollection below doesn't violate the junction table's
  // (id_guideline, id_entity) primary key, and so entity validation counts match.
  const countries = [
    ...new Set(CommonService.ensureArray(req.param('countries'))),
  ];
  const regions = [...new Set(CommonService.ensureArray(req.param('regions')))];
  const massifs = [
    ...new Set(
      CommonService.ensureArray(req.param('massifs')).map((m) => Number(m))
    ),
  ];
  // Reject non-numeric massif ids instead of silently dropping them, so the
  // caller gets feedback consistent with the resolveEntitiesExist check below.
  // `m <= 0` also catches Number('') === 0, which would otherwise look up the
  // non-existent massif 0 and yield a misleading "entity does not exist" error.
  if (!GuidelineService.validateMassifIds(massifs)) {
    return res.badRequest({
      message: 'All massif ids must be valid positive numbers.',
    });
  }

  if (countries.length === 0 && regions.length === 0 && massifs.length === 0) {
    return res.badRequest({
      message: 'At least one country, region, or massif must be specified.',
    });
  }

  const entitiesExist = await GuidelineService.resolveEntitiesExist(
    countries,
    regions,
    massifs
  );
  if (!entitiesExist) {
    return res.notFound({
      message:
        'One or more of the referenced entities (country, region, massif) does not exist.',
    });
  }

  const newGuideline = await TGuideline.create({
    title,
    description,
    author: req.token.id,
    language,
    dateInscription: new Date(),
  }).fetch();

  await Promise.all([
    countries.length > 0
      ? TGuideline.addToCollection(newGuideline.id, 'countries', countries)
      : Promise.resolve(),
    regions.length > 0
      ? TGuideline.addToCollection(newGuideline.id, 'regions', regions)
      : Promise.resolve(),
    massifs.length > 0
      ? TGuideline.addToCollection(newGuideline.id, 'massifs', massifs)
      : Promise.resolve(),
  ]);

  const populatedGuideline = await GuidelineService.getGuideline(
    newGuideline.id
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedGuideline,
    { controllerMethod: 'GuidelineController.create' },
    res,
    toSimpleGuideline
  );
};
