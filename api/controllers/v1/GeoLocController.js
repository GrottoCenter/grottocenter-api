'use strict';
module.exports = {

  countEntries: function(req, res) {
    let southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng')
    };
    let northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng')
    };

    GeoLocService.countEntries(southWestBound, northEastBound)
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
    let southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng')
    };
    let northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng')
    };

    sails.log.debug(southWestBound);
    sails.log.debug(northEastBound);
    GeoLocService.getEntriesMap(southWestBound,northEastBound, 100)
      .then(function(result){
        sails.log.debug("entriesMap sent");
        sails.log.debug(result.qualityEntriesMap.length);
        return res.json(result);
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('Call to getEntries raised an error : ' + err);
      });
  }
};
