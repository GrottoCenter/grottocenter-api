const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const NotificationService = require('../../../services/NotificationService');
const { toMassif } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const massifId = req.param('id');
  const rawMassif = await TMassif.findOne(massifId);
  if (!rawMassif || rawMassif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const cleanedData = MassifService.getConvertedDataFromClientRequest(req);

  // conversion of geoJson into PostGis Geom
  if (cleanedData.geogPolygon) {
    cleanedData.geogPolygon = await MassifService.geoJsonToWKT(
      cleanedData.geogPolygon
    );
    const areaKm2 = await MassifService.computePolygonAreaKm2(
      cleanedData.geogPolygon
    );
    if (areaKm2 > MassifService.MAX_AREA_KM2) {
      return res.badRequest(
        `The massif polygon area (${areaKm2.toFixed(0)} km²) exceeds the maximum allowed size of ${MassifService.MAX_AREA_KM2} km².`
      );
    }
  }
  // The name is updated via the /api/v1/names route by the front
  await TMassif.updateOne(massifId).set(cleanedData);

  const updatedMassif = await MassifService.getPopulatedMassif(massifId);
  await MassifService.updateInSearch(updatedMassif);
  await NotificationService.notifySubscribers(
    req,
    updatedMassif,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.MASSIF
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    updatedMassif,
    { controllerMethod: 'MassifController.update' },
    res,
    toMassif
  );
};
