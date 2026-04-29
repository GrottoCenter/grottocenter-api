const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const EntranceService = require('../../../services/EntranceService');
const NotificationService = require('../../../services/NotificationService');
const RecentChangeService = require('../../../services/RecentChangeService');
const { toMassif } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');
const RightService = require('../../../services/RightService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check params
  const requiredParams = [
    'name',
    'description',
    'descriptionAndNameLanguage',
    'descriptionTitle',
    'geogPolygon',
  ];

  let i = 0;
  const missingParamaters = [];
  while (i < requiredParams.length) {
    if (!req.param(requiredParams[i])) {
      missingParamaters.push(requiredParams[i]);
    }
    i += 1;
  }
  if (missingParamaters.length > 0) {
    return res.badRequest(`${missingParamaters} parameter(s) must be provided`);
  }

  // Validate name length
  const nameError = validateNameLength(req.body.name);
  if (nameError) {
    return res.badRequest(nameError);
  }

  // Convert polygon and validate area before the transaction
  const wkt = await MassifService.geoJsonToWKT(req.body.geogPolygon);
  const areaKm2 = await MassifService.computePolygonAreaKm2(wkt);
  if (areaKm2 > MassifService.MAX_AREA_KM2) {
    return res.badRequest(
      `The massif polygon area (${areaKm2.toFixed(0)} km²) exceeds the maximum allowed size of ${MassifService.MAX_AREA_KM2} km².`
    );
  }

  const rawData = MassifService.getConvertedDataFromClientRequest(req);

  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (rawData.isSensitive !== undefined && !isAdmin) {
    return res.forbidden('Only administrators can set the sensitivity status.');
  }

  // Launch creation request using transaction: it performs a rollback if an error occurs
  const { newMassif, updatedEntranceIds } = await sails
    .getDatastore()
    .transaction(async (db) => {
      const cleanedData = {
        author: req.token.id,
        dateInscription: new Date(),
        documents: rawData.documents ? rawData.documents : [],
        geogPolygon: wkt,
        isSensitive: rawData.isSensitive,
      };

      const massif = await TMassif.create(cleanedData)
        .fetch()
        .usingConnection(db);

      // Name
      await TName.create({
        author: req.token.id,
        dateInscription: new Date(),
        isMain: true,
        language: req.body.descriptionAndNameLanguage.id,
        massif: massif.id,
        name: req.body.name,
      }).usingConnection(db);

      // Description
      if (req.body?.description) {
        await TDescription.create({
          author: req.token.id,
          body: req.body.description,
          dateInscription: new Date(),
          massif: massif.id,
          language: req.body.descriptionAndNameLanguage.id,
          title: req.body.descriptionTitle,
        }).usingConnection(db);
      }

      let affectedEntranceIds = [];
      if (massif.isSensitive) {
        affectedEntranceIds =
          await MassifService.propagateSensitivityToEntrances(
            massif.id,
            req.token.id,
            db
          );
      }

      return { newMassif: massif, updatedEntranceIds: affectedEntranceIds };
    });

  if (newMassif.isSensitive) {
    await Promise.all(
      updatedEntranceIds.map(async (id) => {
        const populated = await EntranceService.getPopulatedEntrance(id);
        if (populated) await EntranceService.updateInSearch(populated);
      })
    );
  }

  const newMassifPopulated = await MassifService.getPopulatedMassif(
    newMassif.id
  );

  await MassifService.updateInSearch(newMassifPopulated);

  await RecentChangeService.setNameCreate(
    'massif',
    newMassif.id,
    req.token.id,
    req.body.name
  );

  await NotificationService.notifySubscribers(
    req,
    newMassifPopulated,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.CREATE,
    NotificationService.NOTIFICATION_ENTITIES.MASSIF
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    newMassifPopulated,
    { controllerMethod: 'MassifController.create' },
    res,
    toMassif
  );
};
