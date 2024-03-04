const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toDocument } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  // By default get only the validated ones
  const isValidated = req.param('isValidated')
    ? !(req.param('isValidated').toLowerCase() === 'false')
    : true;

  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'ASC'
  )}`;

  /*
      4 possible cases : isValidated (true or false) AND validation (null or not)
      If the document is not validated and has a dateValidation, it means that it has been refused.
      We don't want to retrieve these documents refused.
      So when isValidated is false, we need to retrieve only the documents
      with a dateValidation set to null
      (= submitted documents which need to be reviewed).
    */
  const whereClause = { and: [{ isValidated }] };
  if (!isValidated) whereClause.and.push({ dateValidation: null });

  const type = req.param('documentType');
  const foundType = type ? await TType.findOne({ name: type }) : null;
  if (foundType) whereClause.and.push({ type: foundType.id });

  const skip = Math.max(req.param('skip', 0), 0);
  const limit = Math.max(Math.min(req.param('limit', 50), 100), 1);

  const totalDocuments = await TDocument.count();
  const documents = await DocumentService.appendPopulateForSimpleDocument(
    TDocument.find().where(whereClause).skip(skip).limit(limit).sort(sort)
  );
  if (documents.length === 0) {
    return res.ok({
      documents: [],
      message: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
    });
  }

  for (const document of documents) {
    document.mainLanguage = DocumentService.getMainLanguage(document.languages);
  }

  const params = {
    controllerMethod: 'DocumentController.findAll',
    searchedItem: 'All documents',
    limit,
    skip,
    total: totalDocuments,
    url: req.originalUrl,
  };
  return ControllerService.treatAndConvert(
    req,
    null,
    documents,
    params,
    res,
    (data, meta) =>
      toListFromController('documents', data, toDocument, { meta })
  );
};
