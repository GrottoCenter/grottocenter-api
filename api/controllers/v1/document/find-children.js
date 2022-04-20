const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const MappingService = require('../../../services/MappingService');

module.exports = async (req, res) => {
  // Check param
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TDocument,
    }))
  ) {
    return res.badRequest(
      `Could not find document with id ${req.param('id')}.`
    );
  }

  const doc = { id: Number(req.param('id')) };
  await DocumentService.deepPopulateChildren(doc);

  const params = {
    controllerMethod: 'DocumentController.findChildren',
    searchedItem: `Children of document with id ${req.param('id')}`,
  };
  return ControllerService.treatAndConvert(
    req,
    null,
    doc.children,
    params,
    res,
    MappingService.convertToDocumentList
  );
};
