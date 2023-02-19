const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const CommentService = require('../../../services/CommentService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleComment } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const commentH = await CommentService.getHCommentById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(commentH).length === 0) {
      return res.notFound(`Comment ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      commentH,
      params,
      res,
      (data) => toListFromController('comments', data, toSimpleComment)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
