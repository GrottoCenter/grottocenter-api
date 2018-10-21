'use strict';



module.exports = {

  findAll: function(req, res, converter) {
    const apiControl = req.options.api;
    let parameters = {};
    let limit = apiControl.limit;
    let skip = 0;

    if (req.param('name') !== undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%',
      };
    }

    const maxRange = limit;
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
        let params = {
          controllerMethod: 'SearchController.findAll',
          notFoundMessage: 'No entries found.',
          searchedItem: apiControl.entity,
          total: total,
          url: req.originalUrl,
          maxRange: maxRange,
          limit: limit,
          skip: skip,
        };

        // only search for entries at this time
        //return ControllerService.treat(err, foundCave.concat(foundEntry).concat(foundGrotto), params, res);
        return ControllerService.treatAndConvert(err, foundEntry, params, res, converter);
      });
    });
  }
};
