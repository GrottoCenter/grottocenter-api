const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');

// eslint-disable-next-line consistent-return
module.exports = (req, res) => {
  const isValidated = req.param('isValidated')
    ? !(req.param('isValidated').toLowerCase() === 'false')
    : true;
  const validationComment = req.param('validationComment', null);
  const id = req.param('id');

  if (isValidated === false && !validationComment) {
    return res.badRequest(
      `If the document with id ${req.param(
        'id'
      )} is refused, a comment must be provided.`
    );
  }

  TDocument.updateOne({ id })
    .set({
      dateValidation: new Date(),
      isValidated,
      validationComment,
      validator: req.token.id,
    })
    .then(async (updatedDocument) => {
      if (isValidated) {
        const populatedDoc = await TDocument.findOne(updatedDocument.id)
          .populate('author')
          .populate('authors')
          .populate('cave')
          .populate('descriptions')
          .populate('editor')
          .populate('entrance')
          .populate('identifierType')
          .populate('languages')
          .populate('library')
          .populate('license')
          .populate('massif')
          .populate('parent')
          .populate('regions')
          .populate('reviewer')
          .populate('subjects')
          .populate('type');
        await DocumentService.setNamesOfPopulatedDocument(populatedDoc);
        await DocumentService.addDocumentToElasticSearchIndexes(
          updatedDocument
        );
      }

      const params = {
        controllerMethod: 'DocumentController.validate',
        notFoundMessage: `Document of id ${id} not found`,
        searchedItem: `Document of id ${id}`,
      };
      return ControllerService.treat(req, null, updatedDocument, params, res);
    });
};
