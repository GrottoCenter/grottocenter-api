const http = require('http');
const https = require('https');
const mime = require('mime-types');
const moment = require('moment');
const CaverService = require('../services/CaverService');

// Usage example: https://ontology.uis-speleo.org/example/#Gouffre_Jean_Bernard
// Extract: Gouffre_Jean_Bernard
function extractUrlFragment(urlRaw) {
  const url = urlRaw.trim();
  if (url.startsWith('http')) return url.split('#')[1];
  return url;
}

// https://developer.mozilla.org/en-US/docs/Glossary/Truthy
function valIfTruthyOrNull(val) {
  return val || null;
}

function parsePersonName(fullName) {
  const nameParts = fullName.split(' ');
  if (nameParts.length > 3) return [fullName, undefined, undefined];

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  return [fullName, firstName, lastName];
}

async function getOrCreateAuthor(data) {
  const creatorKey = 'karstlink:hasDescriptionDocument/dct:creator';
  const attributionKey = 'dct:rights/cc:attributionName';

  const author =
    valIfTruthyOrNull(data[creatorKey]) ??
    valIfTruthyOrNull(data[attributionKey]);

  const [nickname, name, surname] = parsePersonName(author);
  const cavers = await TCaver.find({ nickname });
  if (cavers.length > 0) return cavers[0].id;

  const caver = await CaverService.createNonUserCaver({
    name,
    surname,
    nickname,
  });
  return caver.id;
}

async function getCreator(creator) {
  const creatorName = extractUrlFragment(creator).replace('_', ' ');
  const cavers = await TCaver.find({ nickname: creatorName });
  if (cavers.length > 0) return cavers[0];

  const [nickname, name, surname] = parsePersonName(creatorName);
  const caver = await CaverService.createNonUserCaver({
    name,
    surname,
    nickname,
  });

  return caver;
}

function checkColumns(data, additionalRequiredColumns = []) {
  let requiredColumns = [
    'id',
    'rdf:type',
    'dct:rights/cc:attributionName',
    'dct:rights/karstlink:licenseType',
    'gn:countryCode',
  ];
  const requiredDescriptionColumns = [
    'karstlink:hasDescriptionDocument/dct:title',
    'karstlink:hasDescriptionDocument/dct:creator',
    'karstlink:hasDescriptionDocument/dc:language',
  ];
  const requiredLocationColumns = [
    'karstlink:hasAccessDocument/dct:description',
    'karstlink:hasAccessDocument/dc:language',
    'karstlink:hasAccessDocument/dct:creator',
  ];

  if (additionalRequiredColumns)
    requiredColumns = requiredColumns.concat(additionalRequiredColumns);

  const missingColumns = [];

  for (const requiredColumn of requiredColumns) {
    if (!valIfTruthyOrNull(data[requiredColumn]))
      missingColumns.push(requiredColumn);
  }

  if (valIfTruthyOrNull(data[requiredDescriptionColumns[0]])) {
    for (const requiredDescColumn of requiredDescriptionColumns) {
      if (!valIfTruthyOrNull(data[requiredDescColumn]))
        missingColumns.push(requiredDescColumn);
    }
  }

  if (valIfTruthyOrNull(data[requiredLocationColumns[0]])) {
    for (const requiredLocColumn of requiredLocationColumns) {
      if (!valIfTruthyOrNull(data[requiredLocColumn]))
        missingColumns.push(requiredLocColumn);
    }
  }

  return missingColumns;
}

// See https://ontology.uis-speleo.org/howto/ for more informations
const KARSTLINK_DATE_FORMAT = 'YYYY-MM-DD';
function getDateFromKarstlink(value) {
  return moment(value, KARSTLINK_DATE_FORMAT);
}

const MAX_DOWNLOADED_FILE_SIZE_MO = 200;
async function distantFileDownload({ url, allowedExtentions = [] } = {}) {
  return new Promise((resolve, reject) => {
    let fileUrl;
    try {
      fileUrl = new URL(url);
    } catch (_) {
      reject(new Error('Invalid URL'));
      return;
    }

    if (!['http:', 'https:'].includes(fileUrl.protocol)) {
      reject(new Error('Invalid protocol'));
      return;
    }

    const client = fileUrl.protocol === 'https:' ? https : http;
    // eslint-disable-next-line consistent-return
    client
      .get(fileUrl, (res) => {
        // Warn: redirect are not followed !
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.socket.end();
          reject(new Error('Invalid response status'));
          return;
        }

        const contentLenth = res.headers['content-length'];
        if (contentLenth > MAX_DOWNLOADED_FILE_SIZE_MO * 1024) {
          res.socket.end();
          reject(new Error('Invalid file size'));
          return;
        }

        const contentType = res.headers['content-type'];
        const extension = mime.extension(contentType);
        if (!allowedExtentions.includes(extension)) {
          res.socket.end();
          reject(new Error('Invalid file extention'));
          return;
        }

        const data = [];
        res
          .on('data', (chunk) => data.push(chunk))
          .on('end', () => {
            const fileBuffer = Buffer.concat(data);
            return resolve({
              buffer: fileBuffer,
              mimetype: contentType,
              originalname: decodeURI(fileUrl.href.split('/').pop()),
              size: Buffer.byteLength(fileBuffer),
            });
          });
      })
      .on('error', () => {
        reject(new Error('Download error'));
      });
  });
}

module.exports = {
  extractUrlFragment,
  valIfTruthyOrNull,
  parsePersonName,
  getOrCreateAuthor,
  getCreator,
  checkColumns,

  KARSTLINK_DATE_FORMAT,
  getDateFromKarstlink,

  MAX_DOWNLOADED_FILE_SIZE_MO,
  distantFileDownload,
};
