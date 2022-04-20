const ramda = require('ramda');
const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

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

  // eslint-disable-next-line consistent-return
  requiredParams.forEach((requiredParam) => {
    if (!req.param(requiredParam)) {
      return res.badRequest(`${requiredParam} parameter must be provided`);
    }
  });

  // Launch creation request using transaction: it performs a rollback if an error occurs
  try {
    await sails.getDatastore().transaction(async (db) => {
      const geomQuery = await sails
        .getDatastore()
        .sendNativeQuery(
          `SELECT ST_AsText('${JSON.stringify(req.body.geogPolygon)}')`,
          []
        );
      const cleanedData = {
        author: req.token.id,
        caves: req.body.caves ? req.body.caves.map((c) => c.id) : [],
        dateInscription: new Date(),
        documents: req.body.documents
          ? req.body.documents.map((c) => c.id)
          : [],
        geogPolygon: geomQuery.rows[0].st_astext,
      };

      const newMassif = await TMassif.create(cleanedData)
        .fetch()
        .usingConnection(db);

      // Name
      await TName.create({
        author: req.token.id,
        dateInscription: new Date(),
        isMain: true,
        language: req.body.descriptionAndNameLanguage.id,
        massif: newMassif.id,
        name: req.body.name,
      })
        .fetch()
        .usingConnection(db);

      // Description
      if (ramda.propOr(null, 'description', req.body)) {
        await TDescription.create({
          author: req.token.id,
          body: req.body.description,
          dateInscription: new Date(),
          massif: newMassif.id,
          language: req.body.descriptionAndNameLanguage.id,
          title: req.body.descriptionTitle,
        }).usingConnection(db);
      }

      // Prepare data for Elasticsearch indexation
      const newMassifPopulated = await TMassif.findOne(newMassif.id)
        .populate('caves')
        .populate('descriptions')
        .populate('names')
        .populate('documents')
        .usingConnection(db);

      // Prepare data for Elasticsearch indexation
      const description =
        newMassifPopulated.descriptions.length === 0
          ? null
          : `${newMassifPopulated.descriptions[0].title} ${newMassifPopulated.descriptions[0].body}`;

      await CaveService.setEntrances(newMassifPopulated.caves);

      // Format data
      const { cave, name, names, ...newMassifESData } = newMassifPopulated;
      await ElasticsearchService.create('massifs', newMassifPopulated.id, {
        ...newMassifESData,
        name: newMassifPopulated.names[0].name, // There is only one name at the creation time
        names: newMassifPopulated.names.map((n) => n.name).join(', '),
        'nb caves': newMassifPopulated.caves.length,
        'nb entrances': newMassifPopulated.caves.reduce(
          (total, c) => total + c.entrances.length,
          0
        ),
        descriptions: [description],
        tags: ['massif'],
      });

      const params = {};
      params.controllerMethod = 'MassifController.create';
      return ControllerService.treat(
        req,
        null,
        newMassifPopulated,
        params,
        res
      );
    });
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
  }
};
