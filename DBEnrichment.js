/**
 */
const http = require('http');
let querystring = require('querystring');
const fs = require('fs');
const os = require('os');

const PATH_ALL_ENTRIES =
  '/api/v1/advanced-search?resourceType=entries&complete=true&matchAllFields=true&from=0&size=10000';

const HOST = os.hostname();
const PORT = 1337;

/**
 * Retrieves all the entries of the database, or, if a country was specified as parameter, retrieves all the entries from this country.
 * @param country
 */
function findAllEntries(country) {
  return new Promise((resolve) => {
    const options = {
      host: HOST,
      port: PORT,
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
/**
 * Updates the entry specified as parameter.
 * @param entry
 */
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
      host: HOST,
      port: PORT,
      path: '/api/entries/updateOneAdministrative',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    };
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
    });
    req.write(data);
    req.end();
    req.on('error', (err) => {
      resolve({ msg: err });
    });
  });
}

/**
 * Returns the nearest location information (country, county, region, city) based on the latitude and the longitude provided as parameters
 * @param latitude
 * @param longitude
 */
function reverseGeo(latitude, longitude) {
  return new Promise((resolve) => {
    const options = {
      host: HOST,
      port: PORT,
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
/**
 * Transforms a 3 letters country code into a 2 letters country code (iso3 -> iso2).
 * @param codeCountry
 */
function countryCodeTransformer(codeCountry) {
  let rawdata = fs.readFileSync('all.json');
  let countries = JSON.parse(rawdata);
  return countries
    .filter((country) => country['alpha-3'] === codeCountry)
    .map((country) => country['alpha-2'])[0];
}

/**
 * Set fields to null if they are similar to avoid wrong information.
 * @param entry
 */
function verifInfo(entry) {
  if ((entry['region'] === entry['county']) === entry['city']) {
    entry['region'] = entry['county'] = entry['city'] = null;
  }
  if (entry['county'] === entry['city']) {
    entry['county'] = entry['city'] = null;
  }
  if (entry['region'] === entry['city']) {
    entry['region'] = entry['city'] = null;
  }
  if (entry['countryName'] === entry['region']) {
    entry['region'] = null;
  }
  if (entry['countryName'] === entry['county']) {
    entry['county'] = null;
  }
  if (entry['countryName'] === entry['city']) {
    entry['city'] = null;
  }
  return entry;
}

/**
 * Main of the DBEnrichment script.
 */
async function enrichment() {
  findAllEntries(process.argv[2]).then(async function(res) {
    let allEntries = Array.from(res['results']);
    let i = 1;
    for (let entry of allEntries) {
      let res = await reverseGeo(entry['latitude'], entry['longitude']);
      res = verifInfo(res);
      // if the type parameter is completion, only fill the null fields, otherwise overwrite all the fields.
      if (process.argv[3] === 'completion') {
        if (res['country'] && country) {
          res['country'] = countryCodeTransformer(res['country']);
          if (entry['country'] === '' || entry['country'] === null) {
            entry['country'] = res['country'];
          }
        }
        if (res['region'] && region) {
          if (entry['region'] === '' || entry['region'] === null) {
            entry['region'] = res['region'];
          }
        }
        if (res['county'] && county) {
          if (entry['county'] === '' || entry['county'] === null) {
            entry['county'] = res['county'];
          }
        }
        if (res['city'] && city) {
          if (entry['city'] === '' || entry['city'] === null) {
            entry['city'] = res['city'];
          }
        }
      } else {
        if (res['country'] && country) {
          res['country'] = countryCodeTransformer(res['country']);
          entry['country'] = res['country'];
        }
        if (res['region'] && region) {
          entry['region'] = res['region'];
        }
        if (res['county'] && county) {
          entry['county'] = res['county'];
        }
        if (res['city'] && city) {
          entry['city'] = res['city'];
        }
      }

      update(entry);
      const progress = i + ' / ' + allEntries.length;
      // Writes the progression in a tmp txt file to show progress on server side.
      fs.writeFileSync('tmpDBEnrichmentProgress', progress);
      ++i;
    }
    // Deletes the tmp file after the script's end.
    fs.unlinkSync('tmpDBEnrichmentProgress');
  });
}

process.title = 'DBenrichment';

// Booleans to insure that the fields used are the ones specified as parameters.
let city = false;
let county = false;
let region = false;
let country = false;
switch (process.argv[4]) {
  case 'city':
    city = county = region = country = true;
    break;
  case 'county':
    county = region = country = true;
    break;
  case 'region':
    region = country = true;
    break;
  case 'country':
    country = true;
}

// Main launch
enrichment();
