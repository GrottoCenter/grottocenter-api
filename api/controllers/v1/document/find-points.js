const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const { toPointMarker } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const documentId = Number(req.param('id'));

  const document = await TDocument.findOne({
    id: documentId,
    isDeleted: false,
  });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  const points = await PointService.getPointsOnDocument(documentId);

  return ControllerService.treatAndConvert(
    req,
    null,
    points,
    {
      controllerMethod: 'DocumentController.findPoints',
      searchedItem: `Points of the document of id ${documentId}`,
    },
    res,
    (data) =>
      toListFromController('points', data, toPointMarker, {
        filterDeleted: false,
      })
  );
};
