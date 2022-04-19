const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DESCRIPTION,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a description.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a description.');
  }

  // Check params
  if (!req.param('body')) {
    return res.badRequest('You must provide a body to create a description.');
  }
  if (!req.param('language')) {
    return res.badRequest(
      'You must provide a language id to create a description.'
    );
  }
  if (!req.param('title')) {
    return res.badRequest('You must provide a title to create a description.');
  }

  const possibleEntities = [
    {
      id: req.param('caveId'),
      sailsModel: TCave,
      type: 'cave',
    },
    {
      id: req.param('documentId'),
      sailsModel: TDocument,
      type: 'document',
    },
    {
      id: req.param('entranceId'),
      sailsModel: TEntrance,
      type: 'entrance',
    },
    {
      id: req.param('exitId'),
      sailsModel: TEntrance,
      type: 'exit',
    },
    {
      id: req.param('massifId'),
      sailsModel: TMassif,
      type: 'massif',
    },
    {
      id: req.param('pointId'),
      sailsModel: TPoint,
      type: 'point',
    },
  ];

  const describedEntity = possibleEntities.find(
    (possibleEntity) => possibleEntity.id !== undefined
  );

  // No entity id provided handling
  if (!describedEntity) {
    const lastItem = possibleEntities.pop();
    return res.badRequest(
      `You must provide an existing entity id such as ${possibleEntities
        .map((e) => e.type)
        .join('Id, ')} or ${lastItem.type}Id.`
    );
  }

  const doesEntityExists = await sails.helpers.checkIfExists.with({
    attributeName: 'id',
    attributeValue: describedEntity.id,
    sailsModel: describedEntity.sailsModel,
  });

  // Entity not found handling
  if (!doesEntityExists) {
    return res.status(404).send({
      message: `The ${describedEntity.type} with id ${describedEntity.id} was not found.`,
    });
  }

  try {
    const newDescription = await TDescription.create({
      author: req.token.id,
      dateInscription: new Date(),
      body: req.param('body'),
      title: req.param('title'),
      language: req.param('language'),
      [describedEntity.type]: describedEntity.id,
    }).fetch();
    const newDescriptionPopulated = await TDescription.findOne(
      newDescription.id
    )
      .populate('author')
      .populate('cave')
      .populate('document')
      .populate('entrance')
      .populate('exit')
      .populate('language')
      .populate('massif');

    const params = {};
    params.controllerMethod = 'DescriptionController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newDescriptionPopulated,
      params,
      res,
      MappingService.convertToDescriptionModel
    );
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
