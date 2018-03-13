'use strict';
module.exports = {

  findAll: function(req, res, converter) {
    let parameters = {};
    if (req.param('name') !== undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
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
      params.searchedItem = 'Entries';
      // only search for entries at this time
      //return ControllerService.treat(err, foundCave.concat(foundEntry).concat(foundGrotto), params, res);
      return ControllerService.treatAndConvert(err, foundEntry, params, res, converter);
      // end search for grottos
      //});
    });
    // end search for caves
    //});
  }
};
