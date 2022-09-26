const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.RIGGING,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occurred when checking your right to create a rigging.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a rigging.');
  }

  // TODO refactor possibleEntities logic in a new RequestService
  const possibleEntities = [
    {
      id: req.param('cave'),
      sailsModel: TCave,
      type: 'cave',
    },
    {
      id: req.param('entrance'),
      sailsModel: TEntrance,
      type: 'entrance',
    },
    {
      id: req.param('point'),
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
    return res.notFound({
      message: `The ${describedEntity.type} with id ${describedEntity.id} was not found.`,
    });
  }

  // Check mandatory params
  // TODO refactor with issue #717
  const mandatoryParams = ['title', 'language'];
  const paramsNameAndValue = mandatoryParams.map((p) => ({
    name: p,
    value: req.param(p),
  }));
  const missingParam = paramsNameAndValue.find((p) => !p.value);
  if (missingParam) {
    return res.badRequest(
      `You must provide a ${missingParam.name} to create a rigging.`
    );
  }

  // Unwrap values
  const title = paramsNameAndValue.find((p) => p.name === 'title').value;
  const language = paramsNameAndValue.find((p) => p.name === 'language').value;

  try {
    const newRigging = await TRigging.create({
      author: req.token.id,
      title,
      obstacles: req.param('obstacles', null),
      ropes: req.param('ropes', null),
      anchors: req.param('anchors', null),
      observations: req.param('observations', null),
      dateInscription: new Date(),
      [describedEntity.type]: describedEntity.id,
      language,
      relevance: 0, // TODO handle relevance
    }).fetch();
    const newRiggingPopulated = await TRigging.findOne(newRigging.id)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language');

    await NotificationService.notifySubscribers(
      req,
      newRiggingPopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.RIGGING
    );

    const params = {};
    params.controllerMethod = 'RiggingController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newRiggingPopulated,
      params,
      res,
      MappingService.convertToRiggingModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
