/**
 */
const http = require('http');
let querystring = require('querystring');
const PATH_ALL_ENTRIES =
  '/api/v1/advanced-search?resourceType=entries&complete=true&matchAllFields=true&from=0&size=10000';

/**
 * Retrieves the closest geolocated object in the geonames database based on coordinates
 */
function findAllEntries(country) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 1337,
      path:
        country === 'all'
          ? PATH_ALL_ENTRIES
          : PATH_ALL_ENTRIES + '&country=' + country,
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      let chunksOfData = [];
      res.on('data', (data) => {
        chunksOfData.push(data);
      });
      res.on('end', () => {
        let response = Buffer.concat(chunksOfData);
        let json = JSON.parse(response);
        resolve(json);
      });
    });
    req.end();
    req.on('error', (err) => {
      resolve({ msg: err });
    });
  });
}

function update(entry) {
  return new Promise((resolve) => {
    const data = querystring.stringify({
      id: entry['id'],
      country: entry['country'],
      county: entry['county'],
      region: entry['region'],
      city: entry['city'],
    });
    const options = {
      host: 'localhost',
      port: 1337,
      path: '/api/entries/updateOneAdministrative',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    };
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (data) => {
        process.stdout.write(data);
      });
    });
    req.write(data);
    req.end();
    req.on('error', (err) => {
      resolve({ msg: err });
    });
  });
}

function reverseGeo(latitude, longitude) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 1337,
      path: `/api/reverseGeocode?latitude=${latitude}&longitude=${longitude}`,
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      let chunksOfData = [];
      res.on('data', (data) => {
        chunksOfData.push(data);
      });
      res.on('end', () => {
        let response = Buffer.concat(chunksOfData);
        let json = JSON.parse(response);
        resolve(json);
      });
    });
    req.end();
    req.on('error', (err) => {
      resolve({ msg: err });
    });
  });
}

function enrichment() {
  findAllEntries(process.argv[2]).then(function(res) {
    let allEntries = Array.from(res['results']);
    allEntries.map((entry) => {
      reverseGeo(entry['latitude'], entry['longitude']).then((res) => {
        if (process.argv[3] === 'completion') {
          if (res['county']) {
            if (entry['county'] === '' || entry['county'] === null) {
              entry['county'] = res['county'];
            }
          }
          if (res['country']) {
            if (entry['country'] === '' || entry['country'] === null) {
              entry['country'] = res['country'];
            }
          }
          if (res['region']) {
            if (entry['region'] === '' || entry['region'] === null) {
              entry['region'] = res['region'];
            }
          }
          if (res['city']) {
            if (entry['city'] === '' || entry['city'] === null) {
              entry['city'] = res['city'];
            }
          }
        } else {
          if (res['county']) {
            entry['county'] = res['county'];
          }
          if (res['country']) {
            entry['country'] = res['country'];
          }
          if (res['region']) {
            entry['region'] = res['region'];
          }
          if (res['city']) {
            entry['city'] = res['city'];
          }
        }
        // console.log(entry);

        update(entry);
      });
    });
  });
}

process.title = 'DBenrichment';
enrichment();
