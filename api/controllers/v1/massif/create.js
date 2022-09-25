const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const ErrorService = require('../../../services/ErrorService');
const MassifService = require('../../../services/MassifService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.MASSIF,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a massif.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a massif.');
  }

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
  try {
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
      if (ramda.propOr(null, 'description', req.body)) {
        await TDescription.create({
          author: req.token.id,
          body: req.body.description,
          dateInscription: new Date(),
          massif: massif.id,
          language: req.body.descriptionAndNameLanguage.id,
          title: req.body.descriptionTitle,
        }).usingConnection(db);
      }

      // Prepare data for Elasticsearch indexation
      const newMassifPopulated = await TMassif.findOne(massif.id)
        .populate('descriptions')
        .populate('names')
        .populate('documents')
        .usingConnection(db);
      newMassifPopulated.caves = await MassifService.getCaves(massif.id);
      newMassifPopulated.entrances = await MassifService.getEntrances(
        massif.id
      );

      const description =
        newMassifPopulated.descriptions.length === 0
          ? null
          : `${newMassifPopulated.descriptions[0].title} ${newMassifPopulated.descriptions[0].body}`;

      // Format data
      const { cave, name, names, ...newMassifESData } = newMassifPopulated;
      await ElasticsearchService.create('massifs', newMassifPopulated.id, {
        ...newMassifESData,
        name: newMassifPopulated.names[0].name, // There is only one name at the creation time
        names: newMassifPopulated.names.map((n) => n.name).join(', '),
        'nb caves': newMassifPopulated.caves.length,
        'nb entrances': newMassifPopulated.entrances.length,
        descriptions: [description],
        tags: ['massif'],
      });

      return newMassifPopulated;
    });

    await NotificationService.notifySubscribers(
      req,
      newMassif,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.MASSIF
    );

    const params = {};
    params.controllerMethod = 'MassifController.create';
    return ControllerService.treat(req, null, newMassif, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
