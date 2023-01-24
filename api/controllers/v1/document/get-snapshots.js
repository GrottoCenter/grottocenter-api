const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DocumentService = require('../../../services/DocumentService');
const DescriptionService = require('../../../services/DescriptionService');

module.exports = async (req, res) => {
  try {
    const documentH = await DocumentService.getHDocumentById(req.params.id);
    const descriptions = await DescriptionService.getHDescriptionsOfDocument(
      req.params.id
    );

    documentH.forEach((document) => {
      if (Object.keys(descriptions).length > 0) {
        // eslint-disable-next-line no-param-reassign
        document.description = descriptions[0];
        descriptions.forEach((desc) => {
          if (
            DescriptionService.compareDescriptionDate(
              new Date(document.id),
              new Date(desc.id),
              new Date(document.description.id)
            )
          ) {
            // eslint-disable-next-line no-param-reassign
            document.description = desc;
          }
        });
      }
    });

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(documentH).length === 0) {
      return res.notFound(`Document ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treat(
      req,
      null,
      { documents: documentH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
