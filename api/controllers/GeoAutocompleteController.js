/**
 * GeoAutocompleteController.js
 *
 * @description :: Server-side logic for providing and handling Autocomplete
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  /**
   * Fetches places predictions from Google Places API.
   */
  getSuggestions: (req, res) => {
    const input = req.param('input');
    const type = req.param('type');
    const country = req.param('country');
    const location = req.param('location');
    const radius = req.param('radius');
    const sessionToken = req.param('sessionToken');
    if (!input) {
      return res.badRequest('GeoAutocompleteController : input is missing');
    }
    if (!type) {
      return res.badRequest('GeoAutocompleteController : type is missing');
    }
    return GeoAutocompleteService.getPlacePredictions(
      input,
      type,
      sessionToken,
      country,
      location,
      radius,
    ).then(
      (result) => res.json(result),
      (err) =>
        res.serverError(
          `GeoAutocompleteController.getSuggestions error : ${err}`,
        ),
    );
  },
  /**
   * Fetches Places details from Google Places API.
   */
  getPlaceDetails: (req, res) => {
    const placeId = req.param('place_id');
    const language = req.param('language');
    const sessionToken = req.param('sessionToken');
    if (!placeId) {
      return res.badRequest('GeoAutocompleteController : place_id is missing');
    }
    return GeoAutocompleteService.getPlaceDetails(
      placeId,
      language,
      sessionToken,
    ).then(
      (result) => res.json(result),
      (err) =>
        res.serverError(
          `GeoAutocompleteController.getPlaceDetails error : ${err}`,
        ),
    );
  },
};
