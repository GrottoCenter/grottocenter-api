'use strict';
module.exports = {

  findAll: function(req, res) {
    return sails.controllers.search.findAll(req, res, MappingV1Service.convertToSearchResult);
  }
};
