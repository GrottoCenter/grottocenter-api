const ErrorService = require('../../../services/ErrorService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a document duplicate.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create a document duplicate.'
    );
  }

  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TDocumentDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }
  const id = req.param('id');
  const duplicate = await TDocumentDuplicate.findOne(id);
  const { document, description } = duplicate.content;
  try {
    await DocumentService.createDocument(req, document, description);
    await TDocumentDuplicate.destroyOne(id);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
