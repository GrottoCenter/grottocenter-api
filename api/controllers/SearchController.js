'use strict';
module.exports = {

  findAll: function(req, res, converter) {
    let parameters = {};
    let limit = 10;
    let skip = 0;

    if (req.param('name') !== undefined) {
      parameters.name = {
        'like': req.param('name'),
      };
    }

    const maxRange = 10; // TODO dynamize
    const range = req.param('range');

    if (range !== undefined) {
      const splitRange = range.split('-');
      limit = splitRange[1] - splitRange[0];
      skip = splitRange[0];
    }

    //TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    TEntry.count(parameters).exec(function (error, total) {
      TEntry.find(parameters).sort('id ASC').limit(limit).skip(skip).exec(function(err, foundEntry) {
        let params = {};
        params.searchedItem = 'Entries';

        if (range !== undefined) {
          params.url = req.originalUrl;
          params.total = total;
          params.maxRange = maxRange;
          params.limit = limit;
          params.skip = skip;
        }

        // only search for entries at this time
        //return ControllerService.treat(err, foundCave.concat(foundEntry).concat(foundGrotto), params, res);
        return ControllerService.treatAndConvert(err, foundEntry, params, res, converter);
      });
    });
  }
};
