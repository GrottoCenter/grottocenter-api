const fs = require('fs');
const { pipeline, Duplex, Readable } = require('stream');
const archiver = require('archiver');
const CommonService = require('../api/services/CommonService');
const FileService = require('../api/services/FileService');
const exportUtils = require('./dbExport/utils');

const organizationExport = require('./dbExport/organization');
const massifExport = require('./dbExport/massif');
const entranceExport = require('./dbExport/entrance');
const caveExport = require('./dbExport/cave');
const documentExport = require('./dbExport/document');

async function* paggingQuery(query) {
  let fetched = 0;
  let nbRows = 0;
  do {
    const queryRaw = query.replace(
      exportUtils.PAGGING_PLACEHOLDER,
      `LIMIT ${exportUtils.PAGGING_SIZE} OFFSET ${fetched}`
    );
    const rep = await CommonService.query(queryRaw); // eslint-disable-line no-await-in-loop
    process.stdout.write('.');
    nbRows = rep.rowCount;
    fetched += nbRows;
    yield rep.rows;
    // return // For debug
  } while (nbRows === exportUtils.PAGGING_SIZE);

  process.stdout.write('\n');
}

async function* JSONArrayStringify(aStream) {
  let isFirst = true;
  yield '[\n';
  for await (const obj of aStream) {
    if (isFirst) {
      isFirst = false;
      yield `${JSON.stringify(obj)}`;
    } else {
      yield `,\n${JSON.stringify(obj)}`;
    }
  }
  yield '\n]';
}

function pipelineAsync(...args) {
  let resolveFn;
  let rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  const stream = pipeline(...args, (err) => {
    if (err) return rejectFn(err);
    return resolveFn();
  });
  return { stream, promise };
}

function exportCollection({ fileName, query, processRows } = {}) {
  sails.log(`${new Date().toISOString()} Export ${fileName} begin`);

  // eslint-disable-next-line prefer-const
  let { stream, promise } = pipelineAsync(
    Readable.from(paggingQuery(query)),
    Duplex.from(processRows), // Treat each group of rows into rows
    Duplex.from(JSONArrayStringify) // Stringify each rows
  );

  promise = promise
    .then(() => {
      sails.log(`${new Date().toISOString()} Export ${fileName} end`);
    })
    .catch((err) => {
      sails.log.error(
        `${new Date().toISOString()} Export ${fileName} error`,
        err
      );
    });

  return { stream, promise };
}

function getMsUntilNextExec() {
  // Next day of at 2 AM UTC
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(2, 0, 0, 0);
  return d.getTime() - Date.now();
}

async function makeDbExport() {
  if (!FileService.isCredentials) {
    sails.log.warn('DB export aborded, no azure credentials supplied');
    return;
  }

  const archive = archiver('zip');

  const { promise: archiveP } = pipelineAsync(
    archive,
    // fs.createWriteStream(exportUtils.EXPORT_FILE_NAME) // For debug
    FileService.dbExport.upload(exportUtils.EXPORT_FILE_NAME, 'application/zip')
  );

  const collections = [
    massifExport,
    entranceExport,
    caveExport,
    documentExport,
    organizationExport,
  ];
  for (const collection of collections) {
    const { stream, promise } = exportCollection(collection);
    archive.append(stream, { name: `collections/${collection.fileName}` });
    await promise; // eslint-disable-line no-await-in-loop
  }

  const licenseFiles = ['license_en.txt', 'license_fr.txt'];
  for (const licenseFile of licenseFiles) {
    const path = `${__dirname}/../assets/dbExport/${licenseFile}`;
    archive.append(fs.createReadStream(path), { name: licenseFile });
  }

  archive.finalize();
  await archiveP;

  const archiveSize = archive.pointer();
  await FileService.dbExport.setMetadata(archiveSize);
}

let dbExportTim = null; // Ensures only one export can be registered
function registerMakeDbExport() {
  if (process.env.NODE_ENV === 'test') {
    sails.log.info('Scheduled DB export is disabled as NODE_ENV=test');
    return;
  }

  // <!> Only works on mono instance, does not support scaling
  clearTimeout(dbExportTim);

  dbExportTim = setTimeout(() => {
    registerMakeDbExport();

    // Only fully run the first day of each month
    if (new Date().getUTCDate() !== 1) return;
    // Cannot set the total time as a 32-bit signed integer is used by setTimeout()
    // It will overflow and trigger a timeoutoverflowwarning

    makeDbExport().catch((err) => sails.log.error('makeDbExport error', err));
  }, getMsUntilNextExec());
}

module.exports = registerMakeDbExport;
