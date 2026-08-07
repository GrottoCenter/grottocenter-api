const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toMassif } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');

module.exports = async (req, res) => {
  const massifId = req.param('id');
  const rawMassif = await TMassif.findOne(massifId);
  if (!rawMassif || rawMassif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const cleanedData = {
    // dateReviewed will be updated automatically by the SQL historisation trigger
    ...MassifService.getConvertedDataFromClientRequest(req),
    reviewer: req.token.id,
  };

  // conversion of geoJson into PostGis Geom
  if (cleanedData.geogPolygon) {
    cleanedData.geogPolygon = await MassifService.geoJsonToWKT(
      cleanedData.geogPolygon
    );

    const polygonError = await MassifService.validatePolygon(
      cleanedData.geogPolygon
    );
    if (polygonError) {
      return res.badRequest(polygonError);
    }
  }
  // Sensitivity is managed exclusively via mark-sensitive / unmark-sensitive
  delete cleanedData.isSensitive;

  // Only administrators can change the sensitivity lock
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!isAdmin) {
    delete cleanedData.isSensitiveLocked;
  }

  // Validate name length
  const nameText = req.body.name?.text;
  const nameError = validateNameLength(nameText);
  if (nameError) {
    return res.badRequest(nameError);
  }

  // Validate language if provided
  const nameLanguage = req.body.name?.language;
  if (nameLanguage !== undefined) {
    if (nameLanguage === null) {
      return res.badRequest('Language cannot be null.');
    }
    const foundLanguage = await TLanguage.findOne({ id: nameLanguage });
    if (!foundLanguage) {
      return res.badRequest('The provided language does not exist.');
    }
  }

  // Handle name update inline (consistent with entrance and cave update)
  if (req.body.name) {
    const nameUpdate = { reviewer: req.token.id };
    if (nameText !== undefined) {
      nameUpdate.name = nameText;
    }
    if (nameLanguage !== undefined) {
      nameUpdate.language = nameLanguage;
    }
    const updatedName = await TName.updateOne({
      massif: massifId,
      isMain: true,
    }).set(nameUpdate);
    if (!updatedName) {
      sails.log.warn(`Massif ${massifId} has no main name record to update.`);
    }
  }

  await TMassif.updateOne(massifId).set(cleanedData);

  const updatedMassif = await MassifService.getPopulatedMassif(massifId);
  await MassifService.updateInSearch(updatedMassif);
  await NotificationService.notifySubscribers(
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
