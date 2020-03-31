/**
 */

const bbsChapterController = require('../BbsChapterController');

module.exports = {
  find: (req, res, next) =>
    bbsChapterController.find(req, res, next, MappingV1Service.convertToBbsChapterModel),

  findAll: (req, res, next) =>
    bbsChapterController.findAll(req, res, next, MappingV1Service.convertToBbsChapterList),
};
