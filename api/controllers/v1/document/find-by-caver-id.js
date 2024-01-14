const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toDocument } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const caverId = req.param('caverId');

  const skip = Math.max(req.param('skip', 0), 0);
  const limit = Math.max(Math.min(req.param('limit', 50), 100), 1);
  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'ASC'
  )}`;

  const whereClause = { and: [{ author: caverId }] };

  const totalDocuments = await TDocument.count().where(whereClause);
  const documents = await DocumentService.appendPopulateForSimpleDocument(
    TDocument.find().where(whereClause).skip(skip).limit(limit).sort(sort)
  );

  if (documents.length === 0) {
    return res.ok({
      documents: [],
      message: `There is no document matching your criterias.`,
    });
  }

  for (const document of documents) {
    document.mainLanguage = DocumentService.getMainLanguage(document.languages);
  }

  const params = {
    controllerMethod: 'DocumentController.findByCaverId',
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
    (data) => toListFromController('documents', data, toDocument)
  );
};
