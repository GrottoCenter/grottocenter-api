'use strict';

var massifController = require('../MassifController');

module.exports = {

  find: function(req, res, next) {
    return massifController.find(req, res, next, MappingV1Service.convertToMassifModel);
  }
};
