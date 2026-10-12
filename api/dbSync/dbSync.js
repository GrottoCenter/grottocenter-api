const syncUtils = require('./utils');
const typesense = require('../../config/typesense');

const organization = require('./entities/organization');
const person = require('./entities/person');
const massif = require('./entities/massif');
const entrance = require('./entities/entrance');
const cave = require('./entities/cave');
const document = require('./entities/document');
const device = require('./entities/device');

// Import rows into a search collection by groups of typesense.IMPORT_SIZE.
// Plain async iteration rather than Duplex.from() stages: a stage failing while
// the next one waits on it leaves a stream pipeline hanging (Node 24).
async function searchImport(rows, collectionName, formater) {
  let documentsGroup = [];

  const catchError = (e) => {
    sails.log.error(
      '[dbSync] Error searchImport',
      collectionName,
      e.importResults?.filter((j) => j.success === false),
      e
    );
    throw e;
  };

  for await (const obj of rows) {
    documentsGroup.push(obj);
    if (documentsGroup.length >= typesense.IMPORT_SIZE) {
      await typesense
        .importDocuments(collectionName, documentsGroup, formater)
        .catch(catchError);
      documentsGroup = [];
    }
  }

  if (documentsGroup.length > 0) {
    await typesense
      .importDocuments(collectionName, documentsGroup, formater)
      .catch(catchError);
  }
}

async function processCollection({ name, query, processRows, search } = {}) {
  const startTime = Date.now();
  sails.log.info(`[dbSync] Start processing ${name}`);
  const ref = { fetched: 0 };

  try {
    const searchCollectionName = await typesense.createTimestampedCollection(
      search.schema
    );
    // processRows treats each group of rows into rows
    const rows = processRows(syncUtils.paggingQuery(name, query, ref));
    await searchImport(rows, searchCollectionName, search.importFormater);
    await typesense.switchCollectionAlias(search.schema.name);

    const elapsed = Date.now() - startTime;
    sails.log.info(
      `[dbSync] Done processing ${ref.fetched} ${name} in ${elapsed}ms`
    );
  } catch (err) {
    // One failing collection must not prevent the others from syncing
    sails.log.error(
      `[dbSync] Error processing ${name} (fetched: ${ref.fetched})`,
      err
    );
  }
}

function getMsUntilNextExec() {
  // Next day of at 2 AM UTC
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(2, 0, 0, 0);
  return d.getTime() - Date.now();
}

/**
 * For each main entity in the database, rebuild its search collection (typesense).
 * The file export is a separate job: see api/dbSync/dbExport.js
 */
async function makeDbSync() {
  sails.log.info(`[dbSync] Start search DB sync`);
  const syncStartTime = Date.now();

  const collections = [
    massif,
    entrance,
    cave,
    document,
    organization,
    person,
    device,
  ];
  for (const collection of collections) {
    await processCollection(collection); // eslint-disable-line no-await-in-loop
  }

  const totalElapsed = Date.now() - syncStartTime;
  sails.log.info(`[dbSync] Done search DB sync in ${totalElapsed}ms`);
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

    makeDbSync().catch((err) =>
      sails.log.error('[dbSync] makeDbSync error', err)
    );
  }, getMsUntilNextExec());
}

async function ensureSearchDbIsPopulated() {
  if (await typesense.isPopulated()) return;
  sails.log.info(`[dbSync] Search DB is empty`);

  // Initial setup of the search DB
  makeDbSync();
}

module.exports = {
  ensureSearchDbIsPopulated,
  makeDbSync,
  registerMakeDbSync,
};
