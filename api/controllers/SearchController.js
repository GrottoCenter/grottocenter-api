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
        TEntry.find(parameters).sort('id ASC').limit(50).exec(function (err, foundEntry) {
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
    },
    findByBounds: function (req, res) {
        // https://github.com/balderdashy/waterline-docs/blob/master/queries/query-language.md
        TEntry.find({
                latitude: {
                    '>': req.param('sw_lat'),
                    '<': req.param('ne_lat')
                },
                longitude: {
                    '>': req.param('sw_lng'),
                    '<': req.param('ne_lng')
                }
            })
            .sort('id ASC')
            .limit(200).exec(function (err, foundEntry) {
                let params = {};
                params.controllerMethod = 'SearchController.readAll';
                params.notFoundMessage = 'No items found.';
                return ControllerService.treat(err, foundEntry, params, res);
            });
    }
};
