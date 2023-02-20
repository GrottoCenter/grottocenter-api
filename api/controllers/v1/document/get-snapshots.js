const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DocumentService = require('../../../services/DocumentService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toDocument } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const documentH = await DocumentService.getHDocumentById(req.params.id);
    const documentWithDescription =
      await DocumentService.populateHDocumentsWithDescription(
        req.params.id,
        documentH
      );

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(documentH).length === 0) {
      return res.notFound(`Document ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      documentWithDescription,
      params,
      res,
      (data) => toListFromController('documents', data, toDocument)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
