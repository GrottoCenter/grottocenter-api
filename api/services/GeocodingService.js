const https = require('https');
const isoCodes = require('../../config/constants/iso3166_2_codes.json');

const later = (delayMs, value) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs, value);
  });

const NOMINATIM_USER_AGENT = 'Grottocenter nodejs';

let ratelimitQueue = [];

async function ratelimitNominatim() {
  // We limit the request to nominatim to at most one per second
  // https://operations.osmfoundation.org/policies/nominatim/
  // If the queue get too long the request is canceled
  const CANCEL_AFTER_QUEUE_LENGH = 5;

  const now = Date.now();
  ratelimitQueue = ratelimitQueue.filter((e) => e > now - 10);

  if (ratelimitQueue.length >= CANCEL_AFTER_QUEUE_LENGH) return false;

  const nextExecTs =
    ratelimitQueue.length === 0
      ? now
      : ratelimitQueue[ratelimitQueue.length - 1] + 1000;
  ratelimitQueue.push(nextExecTs);
  return later(nextExecTs - now, true);
}

async function osmNominatimReverse(latitude, longitude) {
  return new Promise((resolve, reject) => {
    // https://nominatim.org/release-docs/latest/api/Reverse/
    // There is no 'accept-language' header to have the data in their default language
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=10&lat=${latitude}&lon=${longitude}`;
    https
      .get(url, { headers: { 'user-agent': NOMINATIM_USER_AGENT } }, (res) => {
        if (!res.headers['content-type'].startsWith('application/json')) {
          reject(
            new Error(
              `Error: Content type is not json: ${res.headers['content-type']}`
            )
          );
          return;
        }

        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks))));
      })
      .on('error', (err) => reject(err));
  });
}

module.exports = {
  async reverse(latitude, longitude) {
    const canContinue = await ratelimitNominatim();
    if (!canContinue) return null;

    const rep = await osmNominatimReverse(latitude, longitude).catch((err) =>
      sails.log.error('osmNominatimReverse', latitude, longitude, err)
    );

    // https://nominatim.org/release-docs/latest/api/Output/#addressdetails
    const addr = rep?.address;
    if (!addr) return null;
    const isoKeys = Object.keys(addr ?? {})
      .filter((e) => e.startsWith('ISO3166-2-lvl'))
      .map((e) => parseInt(e.slice(13), 10));
    isoKeys.sort((a, b) => b - a); // highest level

    return {
      region: addr?.state ?? addr?.region ?? null,
      county: addr?.county ?? addr?.state_district ?? null,
      city:
        addr?.village ?? addr?.city ?? addr?.town ?? addr?.municipality ?? null,
      id_country: addr?.country_code?.toUpperCase() ?? null,
      iso_3166_2:
        isoKeys.length > 0 ? addr[`ISO3166-2-lvl${isoKeys[0]}`] : null,
    };
  },

  findISOHierarchy(isocode) {
    const path = [];
    let codeLevel = isocode;
    do {
      // eslint-disable-next-line no-loop-func
      const entry = isoCodes['3166-2'].find((e) => e.code === codeLevel);
      path.push(entry);
      if (entry.parent)
        codeLevel = `${entry.code.split('-')[0]}-${entry.parent}`;
      else codeLevel = '';
    } while (codeLevel);
    return path.reverse();
  },

  async getISOTranslation(isocodes) {
    return TISO31662.find({ id: isocodes });
  },
};
