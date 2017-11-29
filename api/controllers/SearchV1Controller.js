'use strict';
module.exports = {

  findAll: function(req, res) {
    let parameters = {};
    if (req.param('name') !== undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
      sails.log.debug('Search > parameters ' + parameters.name.like);
    }

    //TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    // search for caves
    //TCave.find(parameters).sort('id ASC').limit(50).exec(function(err, foundCave) {
    // search for entries
    TEntry.find(parameters).sort('id ASC').limit(50).exec(function(err, foundEntry) {
      // search for grottos
      //TGrotto.find(parameters).sort('id ASC').limit(50).exec(function(err, foundGrotto) {
      let params = {};
      params.controllerMethod = 'SearchController.readAll';
      params.notFoundMessage = 'No items found.';
      // only search for entries at this time
      //return ControllerService.treat(err, foundCave.concat(foundEntry).concat(foundGrotto), params, res);
      return ControllerService.treat(err, foundEntry, params, res);
      // end search for grottos
      //});
    });
    // end search for caves
    //});
  }
};
