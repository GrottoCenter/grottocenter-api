/**
 * CommentController.js
 *
 * @description :: tComment controller imported from localhost MySql server at 8/11/2016 19:7:20.
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  getEntryStats: (req, res) => {
    const entryId = req.param('entry');
    if (!entryId) {
      return res.badRequest('CommentController.getEntryStats : entry is missing');
    }
    // get stats
    return CommentService.getStats(entryId).then(
      (result) => res.json(result),
      (err) => res.serverError(`CommentController.getEntryStats error : ${err}`),
    );
  },

  getEntryTimeInfos: (req, res) => {
    const entryId = req.param('entry');
    if (!entryId) {
      return res.badRequest('CommentController.getEntryTimeInfos : entry is missing');
    }
    // get stats
    return CommentService.getTimeInfos(entryId).then(
      (result) => res.json(result),
      (err) => res.serverError(`CommentController.getEntryTimeInfos error : ${err}`),
    );
  },
};
