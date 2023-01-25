const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DocumentService = require('../../../services/DocumentService');

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

    return ControllerService.treat(
      req,
      null,
      { documents: documentWithDescription },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
