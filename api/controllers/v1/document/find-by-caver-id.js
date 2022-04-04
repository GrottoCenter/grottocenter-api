const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = async (req, res) => {
  const caverId = req.param('caverId');

  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'ASC'
  )}`;

  const whereClause = {
    and: [{ author: caverId }],
  };

  TDocument.find()
    .where(whereClause)
    .skip(req.param('skip', 0))
    .limit(req.param('limit', 50))
    .sort(sort)
    .populate('author')
    .populate('authors')
    .populate('cave')
    .populate('children')
    .populate('descriptions')
    .populate('editor')
    .populate('entrance')
    .populate('files')
    .populate('identifierType')
    .populate('library')
    .populate('license')
    .populate('massif')
    .populate('parent')
    .populate('regions')
    .populate('reviewer')
    .populate('subjects')
    .populate('type')
    // eslint-disable-next-line consistent-return
    .exec(async (err, documents) => {
      if (err) {
        sails.log.error(err);
        return res.serverError('An unexpected server error occured.');
      }

      if (documents.length === 0) {
        return res.status(200).send({
          documents: [],
          message: 'There is no document matching your criterias.',
        });
      }

      try {
        for (const doc of documents) {
          /* eslint-disable no-await-in-loop */
          doc.mainLanguage = await DocumentService.getMainLanguage(doc.id);
          await DocumentService.setNamesOfPopulatedDocument(doc);
          if (doc.children) {
            await Promise.all(
              doc.children.map(async (childDoc) => {
                await DescriptionService.setDocumentDescriptions(childDoc);
              })
            );
            /* eslint-enable no-await-in-loop */
          }
        }

        const totalNb = await TDocument.count().where(whereClause);
        const params = {
          controllerMethod: 'DocumentController.findByCaverId',
          limit: req.param('limit', 50),
          searchedItem: 'All documents',
          skip: req.param('skip', 0),
          total: totalNb,
          url: req.originalUrl,
        };
        return ControllerService.treatAndConvert(
          req,
          err,
          documents,
          params,
          res,
          MappingV1Service.convertToDocumentList
        );
      } catch (e) {
        ErrorService.getDefaultErrorHandler(res)(e);
      }
    });
};
