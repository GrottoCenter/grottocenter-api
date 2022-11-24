const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/mapping/MappingService');
const RightService = require('../../../services/RightService');
const MassifService = require('../../../services/MassifService');
const NameService = require('../../../services/NameService');
const NotificationService = require('../../../services/NotificationService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  // Check right

  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.MASSIF,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a caver.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update a massif.');
  }

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

  const cleanedData = {
    ...MassifService.getConvertedDataFromClientRequest(req),
  };

  try {
    // conversion of geoJson into PostGis Geom
    if (cleanedData.geogPolygon) {
      cleanedData.geogPolygon = await MassifService.geoJsonToWKT(
        cleanedData.geogPolygon
      );
    }
    const updatedMassif = await TMassif.updateOne(massifId).set(cleanedData);
    await NameService.setNames([updatedMassif], 'massif');
    await NotificationService.notifySubscribers(
      req,
      updatedMassif,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.MASSIF
    );

    const params = {};
    params.controllerMethod = 'MassifController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedMassif,
      params,
      res,
      MappingService.convertToMassifModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
