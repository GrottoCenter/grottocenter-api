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

    GeoLocService.countEntries(northWestBound, southEastBound)
      .then(function(result) {
        if (!result) {
          return res.json({'count': 0});
        }
        return res.json({'count': result});
      })
      .catch(function(err) {
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



    GeoLocService.getEntriesMap(northWestBound,southEastBound, 100)
      .then(function(result){
        sails.log.debug("entriesMap sent");
        sails.log.debug(result.qualityEntriesMap.length);
        return res.json(result);
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('Call to getEntries raised an error : ' + err);
      });



    /**
    GeoLocService.countEntries(northWestBound, southEastBound)
      .then(function(result) {
        let converter = MappingV1Service.convertDbToSearchResult;

        if (!result) {
          return res.json(converter([]));
        }
        if (result > 1000) { // TODO add into settings
          GeoLocService.findByBoundsPartitioned(northWestBound, southEastBound, 1000)
            .then(function(partResult) {
              return res.json(converter(partResult));
            })
            .catch(function(err) {
              sails.log.error(err);
            });
        } else {
          // TODO replace this call by GeoLocService.getEntriesBetweenCoords
          TEntry.find({
            where: {
              latitude: {
                '>': req.param('nw_lat'),
                '<': req.param('se_lat')
              },
              longitude: {
                '>': req.param('nw_lng'),
                '<': req.param('se_lng')
              }
            }
          }).populate('cave')
            .sort('quality DESC')
            .limit(1000)
            .exec(function(err, foundEntry) {




              let params = {};
              params.controllerMethod = 'SearchController.findByBounds';
              params.notFoundMessage = 'No items found.';
              return ControllerService.treatAndConvert(req, err, foundEntry, params, res, converter);
            });
        }
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('Call to countEntries raised an error : ' + err);
      });**/
  }
};
