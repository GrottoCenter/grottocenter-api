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
    sails.log.debug("zoom: "+ req.param('zoom'));
    let southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng')
    };
    let northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng')
    };

    let zoom = req.param('zoom');

    GeoLocService.getEntriesMap(southWestBound,northEastBound, zoom, 20)
      .then(function(result){
        sails.log.debug("entriesMap sent");
        sails.log.debug(result.qualityEntriesMap.length);
        sails.log.debug("Cluster sent");
        sails.log.debug(result.groupEntriesMap.length);
        return res.json(result);
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('Call to getEntries raised an error : ' + err);
      });
  }
};
