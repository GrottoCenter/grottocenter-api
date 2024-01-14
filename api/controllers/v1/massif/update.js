const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MassifService = require('../../../services/MassifService');
const NotificationService = require('../../../services/NotificationService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const { toMassif } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // Check if massif exists
  const massifId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: massifId,
      sailsModel: TMassif,
    }))
  ) {
    return res.notFound({
      error: `Could not find massif with id ${massifId}.`,
    });
  }

  const cleanedData = MassifService.getConvertedDataFromClientRequest(req);

  try {
    // conversion of geoJson into PostGis Geom
    if (cleanedData.geogPolygon) {
      cleanedData.geogPolygon = await MassifService.geoJsonToWKT(
        cleanedData.geogPolygon
      );
    }
    // The name is updated via the /api/v1/names route by the front
    await TMassif.updateOne(massifId).set(cleanedData);

    const updatedMassif = await MassifService.getPopulatedMassif(massifId);
    await NotificationService.notifySubscribers(
      req,
      updatedMassif,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.MASSIF
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      updatedMassif,
      { controllerMethod: 'MassifController.update' },
      res,
      toMassif
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
