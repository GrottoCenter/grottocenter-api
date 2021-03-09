/**
 */

const GeoLocService = require('../../services/GeoLocService');
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

  findEntrancesCoordinates: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.getEntrancesCoordinates(
      southWestBound,
      northEastBound,
      100000,
    )
      .then((result) => {
        sails.log.debug('entrances coord sent');
        sails.log.debug(result.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `Call to getEntrancesCoordinates raised an error : ${err}`,
        );
      });
  },

  findEntrances: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.getEntrancesMap(southWestBound, northEastBound, 100000)
      .then((result) => {
        sails.log.debug('entrances sent');
        sails.log.debug(result.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `Call to getEntrancesMap raised an error : ${err}`,
        );
      });
  },

  findGrottos: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.getGrottosMap(southWestBound, northEastBound)
      .then((result) => {
        sails.log.debug('grottos sent');
        sails.log.debug(result.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `Call to getGrottosMap raised an error : ${err}`,
        );
      });
  },

  findCavesCoordinates: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.getCavesCoordinates(southWestBound, northEastBound, 100000)
      .then((result) => {
        sails.log.debug('Caves coord sent');
        sails.log.debug(result.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(
          `Call to getCavesCoordinatesInExtend raised an error : ${err}`,
        );
      });
  },

  findCaves: (req, res) => {
    const southWestBound = {
      lat: req.param('sw_lat'),
      lng: req.param('sw_lng'),
    };
    const northEastBound = {
      lat: req.param('ne_lat'),
      lng: req.param('ne_lng'),
    };

    GeoLocService.getCavesMap(southWestBound, northEastBound)
      .then((result) => {
        sails.log.debug('grottos sent');
        sails.log.debug(result.length);
        return res.json(result);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(`Call to getCavesMap raised an error : ${err}`);
      });
  },
};
