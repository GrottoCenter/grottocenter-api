/**
 */
const https = require('https');

// Remote API information
const API_KEY = '';
const HOSTNAME = 'revgeocode.search.hereapi.com';
const PATH = '/v1/revgeocode';

module.exports = {
  /**
   * Reverses geocode the specified latitude and longitude via Here's reverse geocoding service, and then returns the country, region, county, city and countryName in JSON format
   * @param latitude
   * @param longitude
   */
  findNearBy: (latitude, longitude) => {
    return new Promise((resolve) => {
      const options = {
        host: HOSTNAME,
        path: PATH + '?at=' + latitude + ',' + longitude + '&apiKey=' + API_KEY,
        method: 'GET',
      };
      const req = https.request(options, (res) => {
        res.on('data', (data) => {
          let json = JSON.parse(data);
          // Formats the JSON returned by the remote API to only return the country, county, region, city and countryName.
          // /!\ The JSON fields (items, address etc...) are specific to Here API. If the API used is changed, these fields also needs to be changed.
          if (json['items'] && json['items'].length > 0) {
            let result = { country: '', region: '', county: '', city: '' };
            json = json['items'][0]['address'];
            result.country = json['countryCode'];
            result.region = json['state'];
            result.county = json['county'];
            result.city = json['city'];
            result.countryName = json['countryName'];
            resolve(result);
          } else {
            resolve({ msg: 'no result available for these coordinates' });
          }
        });
      });
      req.end();
      req.on('error', (err) => {
        resolve({ msg: 'Error : ' + err });
      });
    });
  },
};
