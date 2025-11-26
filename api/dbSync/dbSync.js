const fs = require('fs');
const { pipeline, Duplex, Readable } = require('stream');
const archiver = require('archiver');
const CommonService = require('../services/CommonService');
const FileService = require('../services/FileService');
const syncUtils = require('./utils');
const typesense = require('../../config/typesense');

const organization = require('./entities/organization');
const person = require('./entities/person');
const massif = require('./entities/massif');
const entrance = require('./entities/entrance');
const cave = require('./entities/cave');
const document = require('./entities/document');

async function* paggingQuery(query) {
  let fetched = 0;
  let nbRows = 0;
  do {
    const queryRaw = query.replace(
      syncUtils.PAGGING_PLACEHOLDER,
      `LIMIT ${syncUtils.PAGGING_SIZE} OFFSET ${fetched}`
    );

    // eslint-disable-next-line no-await-in-loop
    const rep = await CommonService.query(queryRaw).catch((e) => {
      sails.log.error('Error paggingQuery', query, e);
      throw e;
    });
    process.stdout.write('.');
    nbRows = rep.rowCount;
    fetched += nbRows;
    yield rep.rows;
    // return // For debug
  } while (nbRows === syncUtils.PAGGING_SIZE);

  process.stdout.write('\n');
}

function searchImport(collectionName, formater) {
  return Duplex.from(async function* searchImportProcess(aStream) {
    let documentsGroup = [];

    const catchError = (e) => {
      sails.log.error(
        'Error searchImport importDocuments',
        collectionName,
        e.importResults.filter((j) => j.success === false),
        e
      );
      throw e;
    };

    for await (const obj of aStream) {
      documentsGroup.push(obj);
      if (documentsGroup.length >= typesense.IMPORT_SIZE) {
        await typesense
          .importDocuments(collectionName, documentsGroup, formater)
          .catch(catchError);
        documentsGroup = [];
      }
      yield obj;
    }

    if (documentsGroup.length > 0) {
      await typesense
        .importDocuments(collectionName, documentsGroup, formater)
        .catch(catchError);
    }
  });
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
async function consumeVoid(aStream) {
  // eslint-disable-next-line no-unused-vars
  for await (const _ of aStream) {
    // empty
  }
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

async function processCollection(
  isFileExportEnabled,
  { name, query, processRows, shouldExportToFile, search } = {}
) {
  sails.log(`${new Date().toISOString()} Processing ${name} begin`);
  const hasFileExport = isFileExportEnabled && shouldExportToFile;
  const transformers = [];
  if (search) {
    const searchCollectionName = await typesense.createTimestampedCollection(
      search.schema
    );
    transformers.push(
      searchImport(searchCollectionName, search.importFormater)
    );
  }
  transformers.push(
    hasFileExport ? Duplex.from(JSONArrayStringify) : consumeVoid
  ); // Stringify each rows

  // eslint-disable-next-line prefer-const
  let { stream, promise } = pipelineAsync(
    Readable.from(paggingQuery(query)),
    Duplex.from(processRows), // Treat each group of rows into rows
    ...transformers
  );

  promise = promise
    .then(() => search && typesense.switchCollectionAlias(search.schema.name))
    .then(() => {
      sails.log(`${new Date().toISOString()} Processing ${name} end`);
    })
    .catch((err) => {
      sails.log.error(
        `${new Date().toISOString()} Processing ${name} error`,
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

/**
 * For each main entity in the database, export all data to a file and update the search database (typesense)
 */
async function makeDbSync(isFileExportEnabled = true) {
  sails.log(`${new Date().toISOString()} DB sync begin`);

  let archive;
  let archiveP;
  if (isFileExportEnabled) {
    if (!FileService.isCredentials) {
      sails.log.warn('DB sync aborded, no azure credentials supplied');
      return;
    }
    archive = archiver('zip');
    const { promise } = pipelineAsync(
      archive,
      // fs.createWriteStream(syncUtils.EXPORT_FILE_NAME) // For debug
      FileService.dbExport.upload(syncUtils.EXPORT_FILE_NAME, 'application/zip')
    );
    archiveP = promise;
  }

  const collections = [massif, entrance, cave, document, organization, person];
  for (const collection of collections) {
    // eslint-disable-next-line no-await-in-loop
    const { stream, promise } = await processCollection(
      isFileExportEnabled,
      collection
    );
    if (isFileExportEnabled && collection.shouldExportToFile)
      archive.append(stream, { name: `collections/${collection.name}.json` });
    await promise; // eslint-disable-line no-await-in-loop
  }

  if (!isFileExportEnabled) return;

  const licenseFiles = ['license_en.txt', 'license_fr.txt'];
  for (const licenseFile of licenseFiles) {
    const path = `${__dirname}/../../assets/dbExport/${licenseFile}`;
    archive.append(fs.createReadStream(path), { name: licenseFile });
  }

  archive.finalize();
  await archiveP;

  const archiveSize = archive.pointer();
  await FileService.dbExport.setMetadata(archiveSize);
}

let dbSyncTim = null; // Ensures only one sync can be registered
function registerMakeDbSync() {
  // <!> Only works on mono instance, does not support scaling
  clearTimeout(dbSyncTim);

  dbSyncTim = setTimeout(() => {
    registerMakeDbSync();

    // Only fully run the first day of each week (Monday)
    if (new Date().getUTCDay() !== 1) return;
    // Cannot set the total time as a 32-bit signed integer is used by setTimeout()
    // It will overflow and trigger a timeoutoverflowwarning

    makeDbSync().catch((err) => sails.log.error('makeDbSync error', err));
  }, getMsUntilNextExec());
}

async function ensureSearchDbIsPopulated() {
  if (await typesense.isPopulated()) return;
  sails.log(`${new Date().toISOString()} Search DB is empty`);

  // Initial setup of the search DB
  makeDbSync(false);
}

module.exports = {
  ensureSearchDbIsPopulated,
  registerMakeDbSync,
};

// async function main() {
//   makeDbSync().catch((err) => sails.log.error('makeDbSync error', err));
// }
// setTimeout(() => { main() }, 5000);
