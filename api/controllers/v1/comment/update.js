const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.COMMENT,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any comment.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any comment.');
  }

  // Check if comment exists
  const commentId = req.param('id');
  if (
    !(await checkIfExists.with({
      attributeName: 'id',
      attributeValue: commentId,
      sailsModel: TComment,
    }))
  )
    return res.notFound({
      message: `Comment of id ${commentId} not found.`,
    });

  const newBody = req.param('body');
  const newTitle = req.param('title');
  const newETUnderground = req.param('eTUnderground');
  const newETTrail = req.param('eTTrail');
  const newAestheticism = req.param('aestheticism');
  const newCaving = req.param('caving');
  const newApproach = req.param('approach');
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newBody && { body: newBody }),
    ...(newTitle && { title: newTitle }),
    ...(newETUnderground && { eTUnderground: newETUnderground }),
    ...(newETTrail && { eTTrail: newETTrail }),
    ...(newAestheticism && { aestheticism: newAestheticism }),
    ...(newCaving && { caving: newCaving }),
    ...(newApproach && { approach: newApproach }),
    ...(newLanguage && { language: newLanguage }),
  };

  try {
    await TComment.updateOne({
      id: commentId,
    }).set(cleanedData);
    const populatedComment = await TComment.findOne(commentId)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'CommentController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedComment,
      params,
      res,
      MappingService.convertToCommentModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
