const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const CommentService = require('../../../services/CommentService');

module.exports = async (req, res) => {
  try {
    const commentH = await CommentService.getHCommentById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(commentH).length === 0) {
      return res.notFound(`Comment ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treat(
      req,
      null,
      { comments: commentH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
