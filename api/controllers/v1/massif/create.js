const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const NotificationService = require('../../../services/NotificationService');
const RecentChangeService = require('../../../services/RecentChangeService');
const { toMassif } = require('../../../services/mapping/converters');

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

  // Launch creation request using transaction: it performs a rollback if an error occurs
  const newMassif = await sails.getDatastore().transaction(async (db) => {
    const cleanedData = {
      author: req.token.id,
      dateInscription: new Date(),
      documents: req.body.documents ? req.body.documents : [],
      geogPolygon: await MassifService.geoJsonToWKT(req.body.geogPolygon),
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

    return massif;
  });

  const newMassifPopulated = await MassifService.getPopulatedMassif(
    newMassif.id
  );

  await MassifService.createESMassif(newMassifPopulated);

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
