'use strict';

var bbsGeoController = require('../BbsGeoController');

module.exports = {

  find: function(req, res, next) {
    return bbsGeoController.find(req, res, next, MappingV1Service.convertToBbsGeoModel);
  }
};
