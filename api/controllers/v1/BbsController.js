'use strict';

var bbsController = require('../BbsController');

module.exports = {

  find: function(req, res, next) {
    return bbsController.find(req, res, next, MappingV1Service.convertToBbsModel);
  }
};
