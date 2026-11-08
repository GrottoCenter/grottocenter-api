const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toDocument } = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

/**
 * The validation clause of the list.
 *
 * Active list (the default): `isValidated` defaults to true. Four cases exist,
 * isValidated (true or false) and dateValidation (null or not): a document not
 * validated but with a dateValidation has been refused. With isValidated=false
 * the active list is the moderation queue, so the refused documents are left
 * out by requiring dateValidation to be null (= submitted, to be reviewed).
 *
 * Deleted list (isDeleted=true): every validation state by default, so that no
 * deleted document is missing from the trash. An explicit `isValidated`
 * narrows it to the validated documents, or to the not validated ones
 * (pending and refused alike).
 */
const validationClauses = (isDeleted, isValidated) => {
  if (isDeleted) {
    return isValidated === undefined ? [] : [{ isValidated }];
  }
  const validated = isValidated ?? true;
  return validated
    ? [{ isValidated: true }]
    : [{ isValidated: false }, { dateValidation: null }];
};

module.exports = async (req, res) => {
  const params = readDeletedListParams(req, 'documents');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  const { value: isValidated, error: isValidatedError } = readBoolParam(
    req,
    'isValidated'
  );
  if (isValidatedError) return res.badRequest(isValidatedError);

  const sortBy = req.param('sortBy', 'dateInscription');
  const sort = `${sortBy} ${req.param('orderBy', 'ASC')}`;
  // id breaks the ties of the requested order, so pages never overlap.
  const sortCriteria = sortBy === 'id' ? [sort] : [sort, 'id ASC'];

  const whereClause = {
    and: [{ isDeleted }, ...validationClauses(isDeleted, isValidated)],
  };

  const type = req.param('documentType');
  const foundType = type ? await TType.findOne({ name: type }) : null;
  if (foundType) whereClause.and.push({ type: foundType.id });

  const totalDocuments = await TDocument.count().where(whereClause);
  const documents = await DocumentService.appendPopulateForSimpleDocument(
    TDocument.find()
      .where(whereClause)
      .skip(skip)
      .limit(limit)
      .sort(sortCriteria)
  );
  await DocumentService.setOrganizationNames(documents);
  for (const document of documents) {
    document.mainLanguage = DocumentService.getMainLanguage(document.languages);
  }

  return ControllerService.treatPage(req, res, {
    key: 'documents',
    rows: documents,
    total: totalDocuments,
    skip,
    limit,
    converter: toDocument,
    controllerMethod: 'DocumentController.findAll',
    searchedItem: 'All documents',
    extra: {
      message: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
    },
  });
};
