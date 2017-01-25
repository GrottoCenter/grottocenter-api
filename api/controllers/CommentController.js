'use strict';
/**
 * CommentController.js
 *
 * @description :: tComment controller imported from localhost MySql server at 8/11/2016 19:7:20.
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
module.exports = {
  getEntryStats: function(req, res) {
    let entryId = req.param('entry');
    if (entryId === undefined) {
      return res.badRequest('CommentController.getEntryStats : entry is missing');
    }
    // get stats
    CommentService.getStats(entryId).then(function(result) {
      return res.json(result);
    }, function(err) {
      return res.serverError('CommentController.getEntryStats error : ' + err);
    });
  },

  getEntryTimeInfos: function(req, res) {
    let entryId = req.param('entry');
    if (entryId === undefined) {
      return res.badRequest('CommentController.getEntryTimeInfos : entry is missing');
    }
    // get stats
    CommentService.getTimeInfos(entryId).then(function(result) {
      return res.json(result);
    }, function(err) {
      return res.serverError('CommentController.getEntryTimeInfos error : ' + err);
    });
  }
};
