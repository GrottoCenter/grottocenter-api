const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/mapping/MappingService');
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
      rightEntity: RightService.RightEntities.COMMENT,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occurred when checking your right to create a comment.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a comment.');
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
        .join('Id, ')} or ${lastItem.type} Id.`
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
  const mandatoryParams = ['body', 'title', 'language'];
  const paramsNameAndValue = mandatoryParams.map((p) => ({
    name: p,
    value: req.param(p),
  }));
  const missingParam = paramsNameAndValue.find((p) => !p.value);
  if (missingParam) {
    return res.badRequest(
      `You must provide a ${missingParam.name} to create a comment.`
    );
  }

  // Unwrap values
  const body = paramsNameAndValue.find((p) => p.name === 'body').value;
  const title = paramsNameAndValue.find((p) => p.name === 'title').value;
  const language = paramsNameAndValue.find((p) => p.name === 'language').value;
  try {
    const newComment = await TComment.create({
      author: req.token.id,
      body,
      title,
      eTUnderground: req.param('eTUnderground', null),
      eTTrail: req.param('eTTrail', null),
      aestheticism: req.param('aestheticism', null),
      caving: req.param('caving', null),
      approach: req.param('approach', null),
      dateInscription: new Date(),
      language,
      [describedEntity.type]: describedEntity.id,
      relevance: 0, // TODO handle relevance
    }).fetch();
    const newCommentPopulated = await TComment.findOne(newComment.id)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language');

    await NotificationService.notifySubscribers(
      req,
      newCommentPopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.COMMENT
    );

    const params = {};
    params.controllerMethod = 'CommentController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newCommentPopulated,
      params,
      res,
      MappingService.convertToCommentModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
