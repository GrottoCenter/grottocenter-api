/**
 * Google Places connector. Used for multi languge autocompletion and translation.
 */

const { Client, Status } = require('@googlemaps/google-maps-services-js');
const API_KEY = '';

module.exports = {
  /**
   * Fetches places predictions from Google Places API
   * @param input : String containing the user research (eg : fra)
   * @param type : String that can only be (country, region, county, city)
   * @param sessionToken : String generated to only pay Google API requests per session
   * @param country : ISO_2 country Code
   * @param location : latitude and longitude used to restrict the research
   * @param radius : radius in meters used to restrict the research
   * @return : https://developers.google.com/places/web-service/autocomplete?hl=fr#place_autocomplete_responses
   */
  getPlacePredictions: (
    input,
    type,
    sessionToken,
    country,
    location,
    radius,
  ) => {
    return new Promise((resolve) => {
      const client = new Client({});
      const params = {
        input: input,
        sessiontoken: sessionToken,
        key: API_KEY,
        types: type === 'city' ? '(cities)' : '(regions)',
      };
      if (country) params.components = `country:${country}`;
      if (location && radius) {
        params.location = location;
        params.radius = radius;
        params.strictbounds = true;
      }
      client
        .placeAutocomplete({
          params,
          timeout: 1000,
        })
        .then((r) => {
          if (r.data.status === Status.OK) {
            resolve(r.data);
          } else {
            resolve(r.data.error_message);
          }
        })
        .catch((e) => {
          resolve(e);
        });
    });
  },
  /**
   * Fetches the detail of a place with it's id
   * @param placeId : a valid Google Places ID
   * @param language : ISO_2 country Code (language in which the place details should be returned)
   * @param sessionToken : String generated to only pay Google API requests per session
   * @return : https://developers.google.com/places/web-service/details?hl=fr#PlaceDetailsResponses
   */
  getPlaceDetails: (placeId, language, sessionToken) => {
    return new Promise((resolve) => {
      const client = new Client({});
      const params = {
        // eslint-disable-next-line camelcase
        place_id: placeId,
        key: API_KEY,
        sessiontoken: sessionToken,
        language: language,
      };
      client
        .placeDetails({
          params,
          timeout: 1000,
        })
        .then((r) => {
          if (r.data.status === Status.OK) {
            resolve(r.data);
          } else {
            resolve(r.data.error_message);
          }
        })
        .catch((e) => {
          resolve(e);
        });
    });
  },
};
