const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');

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
  const whereClause = {
    and: [{ isValidated }],
  };
  if (!isValidated) whereClause.and.push({ dateValidation: null });

  const type = req.param('documentType');
  const foundType = type ? await TType.findOne({ name: type }) : null;
  if (foundType) whereClause.and.push({ type: foundType.id });

  TDocument.find()
    .where(whereClause)
    .skip(req.param('skip', 0))
    .limit(req.param('limit', 50))
    .sort(sort)
    .populate('author')
    .populate('authorizationDocument')
    .populate('authors')
    .populate('cave')
    .populate('descriptions')
    .populate('editor')
    .populate('entrance')
    .populate('files')
    .populate('identifierType')
    .populate('languages')
    .populate('library')
    .populate('license')
    .populate('massif')
    .populate('option')
    .populate('parent')
    .populate('regions')
    .populate('reviewer')
    .populate('subjects')
    .populate('type')
    .exec((err, found) => {
      TDocument.count()
        .where(whereClause)
        .exec(async (error, countFound) => {
          if (error) {
            sails.log.error(error);
            return res.serverError('An unexpected server error occured.');
          }

          if (found.length === 0) {
            return res.status(200).send({
              documents: [],
              message: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
            });
          }

          await Promise.all(
            found.map(async (doc) => {
              /* eslint-disable no-param-reassign */
              doc.mainLanguage = await DocumentService.getMainLanguage(
                doc.languages
              );
              await NameService.setNames(
                [
                  ...(doc.library ? [doc.library] : []),
                  ...(doc.editor ? [doc.editor] : []),
                ],
                'grotto'
              );
              if (doc.authorizationDocument) {
                await DescriptionService.setDocumentDescriptions(
                  doc.authorizationDocument
                );
              }
              await DocumentService.setNamesOfPopulatedDocument(doc);
              if (doc.children) {
                await Promise.all(
                  doc.children.map(async (childDoc) => {
                    await DescriptionService.setDocumentDescriptions(childDoc);
                  })
                );
              }
            })
          );
          /* eslint-enable no-param-reassign */

          const params = {
            controllerMethod: 'DocumentController.findAll',
            limit: req.param('limit', 50),
            searchedItem: 'All documents',
            skip: req.param('skip', 0),
            total: countFound,
            url: req.originalUrl,
          };
          return ControllerService.treatAndConvert(
            req,
            err,
            found,
            params,
            res,
            MappingService.convertToDocumentList
          );
        });
    });
};
