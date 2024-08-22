const ControllerService = require('../../../services/ControllerService');
const CommentService = require('../../../services/CommentService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleComment } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const commentH = await CommentService.getHComments(req.params.id);
  if (Object.keys(commentH).length === 0) {
    return res.notFound(`Comment ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    commentH,
    { controllerMethod: 'CommentController.getAllSnapshots' },
    res,
    (data) => toListFromController('comments', data, toSimpleComment)
  );
};
