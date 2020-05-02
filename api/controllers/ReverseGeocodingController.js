/**
 * ReverseGeocodingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  findNearBy: (req, res) => {
    const lat = req.param('latitude');
    const lng = req.param('longitude');
    if (!lat) {
      return res.badRequest('ReverseGeocodingController : latitude is missing');
    }
    if (!lng) {
      return res.badRequest(
        'ReverseGeocodingController : longitude is missing',
      );
    }
    // Delegates to the reverse geocoding service
    return ReverseGeocodingService.findNearBy(lat, lng).then(
      (result) => res.json(result),
      (err) =>
        res.serverError(`ReverseGeocodingController.findNearBy error : ${err}`),
    );
  },
};
