'use strict';

var searchController = require('../SearchController');

module.exports = {

  findAll: function(req, res) {
    return searchController.findAll(req, res, MappingV1Service.convertToSearchResult);
  }
};
