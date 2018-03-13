'use strict';
module.exports = {

  countEntries: function(req, res) {
    let converter = MappingV1Service.convertToCountResult;
    let parameters = {
      latitude: {
        '>': req.param('sw_lat'),
        '<': req.param('ne_lat')
      },
      longitude: {
        '>': req.param('sw_lng'),
        '<': req.param('ne_lng')
      }
    }; // TODO add controls on parameters

    //TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    TEntry.count(parameters).exec(function(err, foundEntry) {
      let params = {};
      params.searchedItem = 'Entries';
      return ControllerService.treatAndConvert(err, {'count': foundEntry}, params, res, converter);
    });
  },

  findByBounds: function(req, res) {
    // https://github.com/balderdashy/waterline-docs/blob/master/queries/query-language.md
    TEntry.find({
      latitude: {
        '>': req.param('sw_lat'),
        '<': req.param('ne_lat'),
        '!': 0 // TODO: why never empty ? remove default element
      },
      longitude: {
        '>': req.param('sw_lng'),
        '<': req.param('ne_lng')
      }
    })
    .sort('id ASC')
    .limit(200).exec(function(err, foundEntry) {
      let params = {};
      params.controllerMethod = 'SearchController.findByBounds';
      params.notFoundMessage = 'No items found.';
      return ControllerService.treat(err, foundEntry, params, res);
    });
  }
};
