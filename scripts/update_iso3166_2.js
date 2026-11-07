/* eslint no-console: "off" */

// Refreshes config/constants/iso3166_2_codes.json, which
// GeocodingService.findISOHierarchy reads to build the region hierarchy.
// It does not touch t_iso3166_2: only its `name` column is used, and the
// translated name_<lang> columns were dropped (#1937).
//
// Run with:
// node scripts/update_iso3166_2.js

const fs = require('fs');
const https = require('https');
const path = require('path');

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200)
          reject(new Error(`Status code is not 200: ${res.statusCode}`));
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      })
      .on('error', (err) => reject(err));
  });
}

async function main() {
  // Data are downloaded from the gitlab of Debian
  console.log(`Getting ISO codes`);
  const codesStr = await httpGet(
    'https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/data/iso_3166-2.json'
  );
  const filename = 'config/constants/iso3166_2_codes.json';
  const codes = JSON.parse(codesStr);
  fs.writeFileSync(
    path.join(`${__dirname}/../${filename}`),
    JSON.stringify(codes, null, 2)
  );
  console.log(`All done`);
}

if (require.main === module) {
  main();
}
