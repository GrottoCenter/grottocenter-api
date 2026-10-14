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

/**
 * For each main entity in the database, rebuild its search collection
 * (typesense) into a new collection, then switch the alias to it. Only for an
 * empty index or a schema change (scripts/resync-search.js): writes made while
 * it runs go to the previous collection, so follow it with a reconciliation
 * (api/dbSync/reconcile.js), which works in place. The file export is a
 * separate job: see api/dbSync/dbExport.js
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

async function ensureSearchDbIsPopulated() {
  if (await typesense.isPopulated()) return;
  sails.log.info(`[dbSync] Search DB is empty`);

  // Initial setup of the search DB
  makeDbSync();
}

module.exports = {
  ensureSearchDbIsPopulated,
  makeDbSync,
};
