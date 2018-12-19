'use strict';

var grottoController = require('../GrottoController');

module.exports = {

  find: function(req, res, next) {
    return grottoController.find(req, res, next, MappingV1Service.convertToGrottoModel);
  }
};
