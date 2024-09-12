const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toDocument } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const documentH = await DocumentService.getHDocumentById(req.params.id);
  const documentWithDescription =
    await DocumentService.populateHDocumentsWithDescription(
      req.params.id,
      documentH
    );

  if (Object.keys(documentH).length === 0) {
    return res.notFound(`Document ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    documentWithDescription,
    { controllerMethod: 'DocumentController.getAllSnapshots' },
    res,
    (data, meta) =>
      toListFromController('documents', data, toDocument, { meta })
  );
};
