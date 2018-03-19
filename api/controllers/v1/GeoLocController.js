'use strict';
module.exports = {

  countEntries: function(req, res) {
    let northWestBound = {
      lat: req.param('nw_lat'),
      lng: req.param('nw_lng')
    };
    let southEastBound = {
      lat: req.param('se_lat'),
      lng: req.param('se_lng')
    };

    GeoLocService.countEntries(northWestBound, southEastBound).then(function(result) {
      if (!result) {
        return res.json({'count': 0});
      }
      return res.json({'count': result});
    }, function(err) {
      sails.log.error(err);
      return res.serverError('Call to countEntries raised an error : ' + err);
    });
  },

  findByBounds: function(req, res) {
    let northWestBound = {
      lat: req.param('nw_lat'),
      lng: req.param('nw_lng')
    };
    let southEastBound = {
      lat: req.param('se_lat'),
      lng: req.param('se_lng')
    };

    GeoLocService.countEntries(northWestBound, southEastBound).then(function(result) {
      let converter = MappingV1Service.convertToSearchResult;
      if (!result) {
        return res.json(converter([]));
      }

      if (result > 1000) { // TODO add into settings
        GeoLocService.findByBoundsPartitioned(northWestBound, southEastBound)
        .then(function(partResult) {
          return res.json(converter(partResult));
        }, function(err) {
          console.log(err);
        });
      } else {
        // TODO replace this call by GeoLocService.getEntriesBetweenCoords
        TEntry.find({
          latitude: {
            '>': req.param('nw_lat'),
            '<': req.param('se_lat')
          },
          longitude: {
            '>': req.param('nw_lng'),
            '<': req.param('se_lng')
          }
        })
        .sort('id ASC')
        .exec(function(err, foundEntry) {
          let params = {};
          params.controllerMethod = 'SearchController.findByBounds';
          params.notFoundMessage = 'No items found.';
          return ControllerService.treatAndConvert(err, foundEntry, params, res, converter);
        });
      }
    }, function(err) {
      sails.log.error(err);
      return res.serverError('Call to countEntries raised an error : ' + err);
    });
  }
};
