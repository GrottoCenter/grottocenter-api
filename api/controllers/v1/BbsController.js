'use strict';

const bbsController = require('../BbsController');

module.exports = {

  find: function(req, res, next) {
    return bbsController.find(req, res, next, MappingV1Service.convertToBbsModel);
  },

  count: function(req, res, next) {
    return bbsController.count(req, res, next, MappingV1Service.convertToBbsModel);
  }
};
