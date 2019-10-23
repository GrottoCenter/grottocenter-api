'use strict';

var bbsChapterController = require('../BbsChapterController');

module.exports = {

  find: function(req, res, next) {
    return bbsChapterController.find(req, res, next, MappingV1Service.convertToBbsChapterModel);
  },

  findAll: function(req, res, next) {
    return bbsChapterController.findAll(req, res, next, MappingV1Service.convertToBbsChapterList);
  },
};
