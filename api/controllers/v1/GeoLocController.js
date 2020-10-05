/**
 */

module.exports = {
  countEntries: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.countEntrances(southWestBound, northEastBound)
      .then((result) => {
        if (!result) {
          return res.json({ count: 0 });
        }
        return res.json({ count: result });
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(`Call to countEntries raised an error : ${err}`);
      });
  },

  findByBounds: (req, res) => {
    sails.log.debug(`zoom: ${req.param('zoom')}`);
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    const zoom = req.param('zoom');

    GeoLocService.getEntrancesMap(southWestBound, northEastBound, zoom, 20)
      .then((result) => {
        sails.log.debug('entriesMap sent');
        sails.log.debug(result.qualityEntrancesMap.length);
        sails.log.debug('Cluster sent');
        sails.log.debug(result.groupEntrancesMap.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `Call to getEntrancesMap raised an error : ${err}`,
        );
      });
  },
};
