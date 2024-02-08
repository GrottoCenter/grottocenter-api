const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toSimpleDocument } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const documentId = Number(req.param('id'));
  const baseDocument = await TDocument.findOne(documentId);
  if (!baseDocument) {
    return res.notFound(`Could not find document with id ${req.param('id')}.`);
  }

  const params = {
    controllerMethod: 'DocumentController.findChildren',
    searchedItem: `Children of document with id ${req.param('id')}`,
  };

  const children = await DocumentService.getDocumentChildren(baseDocument.id);

  return ControllerService.treatAndConvert(
    req,
    null,
    children,
    params,
    res,
    (data) => toListFromController('documents', data, toSimpleDocument)
  );
};
