const fs = require('fs');
const { Readable } = require('stream');
const { finished, pipeline } = require('stream/promises');
const { ZipArchive } = require('archiver');
const FileService = require('../services/FileService');
const syncUtils = require('./utils');

const organization = require('./entities/organization');
const person = require('./entities/person');
const massif = require('./entities/massif');
const entrance = require('./entities/entrance');
const cave = require('./entities/cave');
const document = require('./entities/document');
const device = require('./entities/device');

const COLLECTIONS = [
  massif,
  entrance,
  cave,
  document,
  organization,
  person,
  device,
].filter((e) => e.shouldExportToFile);

const LICENSE_FILES = ['license_en.txt', 'license_fr.txt'];

// Attach the export-only sub-entities to each page before the shared
// processRows, which only knows about what the search index needs.
async function* withExportJoins(source, joins) {
  for await (const rows of source) {
    if (joins && rows.length > 0) {
      await Promise.all(joins(rows).map((e) => syncUtils.joinMany(e)));
    }
    yield rows;
  }
}

async function* mapRows(source, transform) {
  for await (const row of source) yield transform ? transform(row) : row;
}

// The stages are plain async generators chained into a single Readable:
// with one Duplex.from() per stage, a stage failing while the next one waits
// on it leaves the pipeline hanging, its callback never called (Node 24).
function exportCollection({ name, query, processRows, export: exp = {} }) {
  const ref = { fetched: 0 };
  const pages = syncUtils.paggingQuery(name, query, ref);
  const rows = processRows(withExportJoins(pages, exp.joins));
  const stream = Readable.from(
    syncUtils.JSONArrayStringify(mapRows(rows, exp.transform))
  );
  return { stream, promise: finished(stream), ref };
}

/**
 * Export every public entity to a zip archive in the db-exports storage,
 * then update the export metadata.
 * If anything fails, the upload is aborted: the previous archive and its
 * metadata stay untouched, and the error is thrown to the caller.
 */
async function makeDbExport() {
  sails.log.info('[dbExport] Start DB export');
  const startTime = Date.now();

  const upload = FileService.dbExport.upload(
    syncUtils.EXPORT_FILE_NAME,
    'application/zip'
  );
  const archive = new ZipArchive();
  const archiveP = pipeline(archive, upload.stream);
  // A failed upload stops the archive from reading the collection being
  // appended, whose stream would then never end: race each one against it.
  const uploadFailed = new Promise((_, reject) => {
    archiveP.catch(reject);
    upload.done.catch(reject);
  });
  uploadFailed.catch(() => {}); // Handled by the races below

  try {
    for (const collection of COLLECTIONS) {
      const collectionStartTime = Date.now();
      const { stream, promise, ref } = exportCollection(collection);
      archive.append(stream, { name: `collections/${collection.name}.json` });
      await Promise.race([promise, uploadFailed]); // eslint-disable-line no-await-in-loop
      sails.log.info(
        `[dbExport] Exported ${ref.fetched} ${collection.name} in ${
          Date.now() - collectionStartTime
        }ms`
      );
    }

    for (const licenseFile of LICENSE_FILES) {
      const path = `${__dirname}/../../assets/dbExport/${licenseFile}`;
      archive.append(fs.createReadStream(path), { name: licenseFile });
    }

    await Promise.race([
      Promise.all([archive.finalize(), archiveP, upload.done]),
      uploadFailed,
    ]);
  } catch (err) {
    sails.log.error('[dbExport] DB export failed, upload aborted', err);
    // Destroying the upload stream with an error prevents the blob commit
    upload.stream.destroy(err);
    archive.abort();
    throw err;
  }

  await FileService.dbExport.setMetadata(archive.pointer());
  sails.log.info(`[dbExport] Done DB export in ${Date.now() - startTime}ms`);
}

module.exports = { exportCollection, makeDbExport };
