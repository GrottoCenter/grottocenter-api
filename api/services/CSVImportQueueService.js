/**
 * CSVImportQueueService.js
 *
 * @description :: Manages the pg-boss backed job queue for asynchronous
 *   CSV entrance import processing. Chunks rows by affinity (same dedup key
 *   always in same chunk), processes chunks in parallel, aggregates results,
 *   generates CSV reports, and notifies the user on completion.
 */

const { v4: uuidv4 } = require('uuid');
const { ENTRANCE_MANDATORY_COLUMNS } = require('../utils/csvHelper');

const QUEUE_NAME = 'csv-import';
const COMPLETION_QUEUE_NAME = 'csv-import-completion';
const DEFAULT_CHUNK_SIZE = 50;

module.exports = {
  QUEUE_NAME,
  COMPLETION_QUEUE_NAME,
  DEFAULT_CHUNK_SIZE,

  /**
   * Initialize the csv-import queue.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    if (!sails.enrichmentBoss) {
      sails.log.warn(
        'CSVImportQueueService: pg-boss not available, skipping start'
      );
      return;
    }
    await sails.enrichmentBoss.createQueue(QUEUE_NAME);
    await sails.enrichmentBoss.createQueue(COMPLETION_QUEUE_NAME);

    await sails.enrichmentBoss.work(
      QUEUE_NAME,
      {
        newJobCheckInterval: 2000,
        teamSize: 1,
        teamConcurrency: 4,
      },
      module.exports.processChunk
    );

    // Completion check runs as a separate single-concurrency worker so that
    // it only fires AFTER pg-boss has committed the chunk job's state change.
    await sails.enrichmentBoss.work(
      COMPLETION_QUEUE_NAME,
      { newJobCheckInterval: 2000 },
      module.exports.processCompletionCheck
    );

    sails.log.info('CSVImportQueueService: started and listening for jobs');
  },

  /**
   * Assign rows to chunks using affinity-based grouping.
   * Rows sharing the same dedup key (id + attributionName) are guaranteed
   * to land in the same chunk so that sequential duplicate detection works.
   * Rows with null id have no affinity and fill remaining capacity.
   *
   * @param {Array} rows - The raw row array from the request body
   * @param {number} [chunkSize] - Target rows per chunk
   * @returns {Array<Array<{row: object, originalLine: number}>>} Array of chunks
   */
  affinityChunk(rows, chunkSize = DEFAULT_CHUNK_SIZE) {
    const keyGroups = new Map();
    const noKeyRows = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const id = row.id || null;
      const name = row['dct:rights/cc:attributionName'] || null;
      const entry = { row, originalLine: i + 2 };

      if (id === null) {
        noKeyRows.push(entry);
      } else {
        const key = `${id}|||${name}`;
        if (!keyGroups.has(key)) keyGroups.set(key, []);
        keyGroups.get(key).push(entry);
      }
    }

    const chunks = [];
    let currentChunk = [];

    for (const group of keyGroups.values()) {
      if (
        currentChunk.length > 0 &&
        currentChunk.length + group.length > chunkSize
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(...group);
      if (currentChunk.length >= chunkSize) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }

    for (const entry of noKeyRows) {
      if (currentChunk.length >= chunkSize) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(entry);
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  },

  /**
   * Create a batch and enqueue all chunks.
   *
   * @param {Array} rows - Raw rows from request body
   * @param {Object} tokenMeta - { id, groups } from req.token
   * @returns {Object} { batchId, totalRows, totalChunks }
   */
  async createBatch(rows, tokenMeta) {
    const chunkSize =
      (sails.config.custom && sails.config.custom.csvImportChunkSize) ||
      DEFAULT_CHUNK_SIZE;
    const chunks = module.exports.affinityChunk(rows, chunkSize);
    const batchId = uuidv4();

    await TJobBatch.create({
      id: batchId,
      type: 'csv-import',
      status: 'pending',
      initiator: tokenMeta.id,
      totalRows: rows.length,
      chunkSize,
      totalChunks: chunks.length,
    });

    for (let i = 0; i < chunks.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await sails.enrichmentBoss.send(
        QUEUE_NAME,
        {
          batchId,
          chunkIndex: i,
          rows: chunks[i],
          tokenMeta,
        },
        {
          retryLimit: 3,
          retryDelay: 10,
          retryBackoff: true,
          expireInHours: 4,
        }
      );
    }

    await TJobBatch.updateOne({ id: batchId }).set({ status: 'active' });

    return { batchId, totalRows: rows.length, totalChunks: chunks.length };
  },

  /**
   * Process chunk jobs (pg-boss v12 passes an array).
   * With teamSize:1, the array always has exactly one job and pg-boss
   * stores the return value as the job's output.
   * @param {object[]} jobs
   */
  async processChunk(jobs) {
    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    return module.exports.processOneChunk(jobList[0]);
  },

  /**
   * Process completion check jobs. These are enqueued after each chunk
   * finishes so that the batch state is only checked AFTER pg-boss has
   * committed the chunk job's final state.
   * @param {object[]} jobs
   */
  async processCompletionCheck(jobs) {
    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobList) {
      const { batchId } = job.data;
      // eslint-disable-next-line no-await-in-loop
      await module.exports.checkBatchCompletion(batchId);
    }
  },

  /**
   * Process one chunk job's rows.
   * @param {object} job
   * @returns {object} result with successes, duplicates, failures arrays
   */
  async processOneChunk(job) {
    const { batchId, chunkIndex, rows, tokenMeta } = job.data;
    const result = {
      successes: [],
      duplicates: [],
      failures: [],
    };

    try {
      const reqProxy = {
        token: tokenMeta,
        get() {
          return undefined;
        },
      };

      // eslint-disable-next-line global-require
      const EntranceCSVImportService = require('./EntranceCSVImportService');
      // eslint-disable-next-line global-require
      const CaveService = require('./CaveService');
      // eslint-disable-next-line global-require
      const EntranceService = require('./EntranceService');
      const {
        checkColumns,
        valIfTruthyOrNull,
        getOrCreateAuthor,
      } = require('../utils/csvHelper'); // eslint-disable-line global-require

      let hasSuccessfulImport = false;

      /* eslint-disable no-await-in-loop, no-continue */
      for (const { row, originalLine } of rows) {
        try {
          const missingColumns = await checkColumns(
            row,
            ENTRANCE_MANDATORY_COLUMNS
          );
          if (missingColumns.length > 0) {
            result.failures.push({
              line: originalLine,
              message: `Columns missing : ${missingColumns.toString()}`,
            });
            continue;
          }

          const idDb = valIfTruthyOrNull(row.id);
          const nameDb = valIfTruthyOrNull(
            row['dct:rights/cc:attributionName']
          );

          const authorId = await getOrCreateAuthor(row);
          const dataNameDescLoc =
            await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
              row,
              authorId
            );

          const existing = await TEntrance.findOne({
            idDbImport: idDb,
            nameDbImport: nameDb,
          });

          if (existing) {
            const cave = await TCave.findOne(existing.cave);
            const entrance =
              EntranceCSVImportService.getConvertedEntranceFromCsv(
                row,
                authorId,
                cave
              );
            await TEntranceDuplicate.create({
              author: tokenMeta.id,
              content: { entrance, nameDescLoc: dataNameDescLoc },
              dateInscription: new Date(),
              entrance: existing.id,
            });
            result.duplicates.push({
              line: originalLine,
              message: `Entrance with id ${idDb} has been created as an entrance duplicate.`,
            });
            continue;
          }

          const dataCave = EntranceCSVImportService.getConvertedCaveFromCsv(
            row,
            authorId
          );
          const nameData =
            EntranceCSVImportService.getConvertedNameAndDescCaveFromCsv(
              row,
              authorId
            );
          const createdCave = await CaveService.createCave(
            reqProxy,
            dataCave,
            nameData
          );

          const dataEntrance =
            EntranceCSVImportService.getConvertedEntranceFromCsv(
              row,
              authorId,
              createdCave
            );
          const createdEntrance = await EntranceService.createEntrance(
            reqProxy,
            dataEntrance,
            dataNameDescLoc
          );

          if (valIfTruthyOrNull(row['gn:alternateName'])) {
            await TName.create({
              author: authorId,
              entrance: createdEntrance.id,
              dateInscription: dataEntrance.dateInscription,
              dateReviewed: dataEntrance.dateReviewed,
              isMain: false,
              language: dataNameDescLoc.name.language,
              name: row['gn:alternateName'].name,
            });
          }

          result.successes.push({
            line: originalLine,
            caveId: createdCave.id,
            entranceId: createdEntrance.id,
            latitude: createdEntrance.latitude,
            longitude: createdEntrance.longitude,
          });
          hasSuccessfulImport = true;
        } catch (err) {
          sails.log.error(
            `CSV import chunk ${batchId}[${chunkIndex}] row ${originalLine}:`,
            err
          );
          result.failures.push({
            line: originalLine,
            message: err.toString(),
          });
        }
      }
      /* eslint-enable no-await-in-loop, no-continue */

      if (hasSuccessfulImport) {
        // eslint-disable-next-line global-require
        const CoordinatesSnapshotService = require('./CoordinatesSnapshotService');
        CoordinatesSnapshotService.invalidate().catch((err) =>
          sails.log.error(
            'CSVImportQueueService: coordinates snapshot invalidation failed:',
            err
          )
        );
      }
    } catch (err) {
      sails.log.error(
        `CSV import chunk ${batchId}[${chunkIndex}] unexpected error:`,
        err
      );
      // Mark all remaining unprocessed rows as failures so they are not
      // silently lost from the batch results.
      const processed =
        result.successes.length +
        result.duplicates.length +
        result.failures.length;
      for (let i = processed; i < rows.length; i += 1) {
        result.failures.push({
          line: rows[i].originalLine,
          message: `Chunk-level error: ${err.toString()}`,
        });
      }
    }

    // Schedule a completion check as a separate job so that pg-boss has
    // committed this chunk's final state before we query job statuses.
    try {
      await sails.enrichmentBoss.send(
        COMPLETION_QUEUE_NAME,
        { batchId },
        { retryLimit: 3 }
      );
    } catch (err) {
      sails.log.error(
        `CSV import chunk ${batchId}[${chunkIndex}] failed to enqueue completion check:`,
        err
      );
    }

    return result;
  },

  /**
   * Check if all chunks for a batch have completed and trigger aggregation.
   * @param {string} batchId
   */
  async checkBatchCompletion(batchId) {
    const batch = await TJobBatch.findOne({ id: batchId });
    if (!batch) return;

    const query = `
      SELECT state, output
      FROM pgboss.job
      WHERE name = $1
        AND data->>'batchId' = $2
    `;
    const { rows: jobs } = await CommonService.query(query, [
      QUEUE_NAME,
      batchId,
    ]);

    // Ensure all expected chunks are present and terminal before proceeding.
    if (jobs.length < batch.totalChunks) return;

    const allDone = jobs.every(
      (j) => j.state === 'completed' || j.state === 'failed'
    );
    if (!allDone) return;

    const allFailed = jobs.every((j) => j.state === 'failed');
    if (allFailed) {
      const resultPayload = {
        reportUrls: { successes: null, duplicates: null, failures: null },
        summary: {
          successes: 0,
          duplicates: 0,
          failures: batch.totalRows,
        },
      };
      // Atomic test-and-set guard: prevents duplicate notifications when
      // two completion-check jobs fire concurrently for the same batch.
      const guard = await TJobBatch.updateOne({
        id: batchId,
        status: 'active',
      }).set({
        status: 'failed',
        completedAt: new Date(),
        result: resultPayload,
      });
      if (!guard) return;
      await module.exports.notifyCompletion(batchId, resultPayload);
      return;
    }

    // Atomic test-and-set guard: only one completion-check worker proceeds.
    // If two completion-check jobs fire concurrently, only the first one
    // transitions from 'active' to 'aggregating'; the second gets null.
    const guard = await TJobBatch.updateOne({
      id: batchId,
      status: 'active',
    }).set({ status: 'aggregating' });
    if (!guard) return;

    await module.exports.aggregateBatch(batchId, jobs);
  },

  /**
   * Aggregate all chunk results, generate CSVs, upload to Azure, and notify.
   * @param {string} batchId
   * @param {Array} jobs - pg-boss job rows with state and output
   */
  async aggregateBatch(batchId, jobs) {
    const allSuccesses = [];
    const allDuplicates = [];
    const allFailures = [];
    let failedChunkCount = 0;

    for (const job of jobs) {
      if (job.state === 'completed' && job.output) {
        const output =
          typeof job.output === 'string' ? JSON.parse(job.output) : job.output;
        if (output.successes) allSuccesses.push(...output.successes);
        if (output.duplicates) allDuplicates.push(...output.duplicates);
        if (output.failures) allFailures.push(...output.failures);
      } else if (job.state === 'failed') {
        failedChunkCount += 1;
      }
    }

    // If some chunks failed (worker crash or expiry), record synthetic
    // failure entries so the report reconciles against totalRows.
    if (failedChunkCount > 0) {
      const batch = await TJobBatch.findOne({ id: batchId });
      const accountedRows =
        allSuccesses.length + allDuplicates.length + allFailures.length;
      const missingRows = batch ? batch.totalRows - accountedRows : 0;
      if (missingRows > 0) {
        allFailures.push({
          line: null,
          message: `${missingRows} row(s) lost due to ${failedChunkCount} failed chunk(s) (worker crash or job expiry).`,
        });
      }
    }

    allSuccesses.sort((a, b) => a.line - b.line);
    allDuplicates.sort((a, b) => a.line - b.line);
    allFailures.sort((a, b) => a.line - b.line);

    let reportUrls;
    try {
      reportUrls = await module.exports.generateAndUploadReports(
        batchId,
        allSuccesses,
        allDuplicates,
        allFailures
      );
    } catch (err) {
      sails.log.error(
        `CSVImportQueueService: report generation failed for batch ${batchId} (rows were already imported):`,
        err
      );
      // Report upload failed, but the rows were already imported successfully.
      // Mark the batch as completed with null reportUrls so the front-end
      // can show accurate import counts instead of a misleading "failed" status.
      reportUrls = { successes: null, duplicates: null, failures: null };
    }

    const resultPayload = {
      reportUrls,
      summary: {
        successes: allSuccesses.length,
        duplicates: allDuplicates.length,
        failures: allFailures.length,
      },
    };

    await TJobBatch.updateOne({ id: batchId }).set({
      status: 'completed',
      completedAt: new Date(),
      result: resultPayload,
    });

    await module.exports.notifyCompletion(batchId, resultPayload);
  },

  /**
   * Generate CSV reports and upload to Azure Blob Storage.
   * @param {string} batchId
   * @param {Array} successes
   * @param {Array} duplicates
   * @param {Array} failures
   * @returns {Object} { success: url|null, duplicates: url|null, failures: url|null }
   */
  async generateAndUploadReports(batchId, successes, duplicates, failures) {
    const reportUrls = { successes: null, duplicates: null, failures: null };

    const prefix = `csv-import-reports/${batchId}`;

    if (successes.length > 0) {
      const csv = module.exports.toCSV(
        ['line', 'caveId', 'entranceId', 'latitude', 'longitude'],
        successes
      );
      reportUrls.successes = await module.exports.uploadReport(
        prefix,
        'successes.csv',
        csv
      );
    }

    if (duplicates.length > 0) {
      const csv = module.exports.toCSV(['line', 'message'], duplicates);
      reportUrls.duplicates = await module.exports.uploadReport(
        prefix,
        'duplicates.csv',
        csv
      );
    }

    if (failures.length > 0) {
      const csv = module.exports.toCSV(['line', 'message'], failures);
      reportUrls.failures = await module.exports.uploadReport(
        prefix,
        'failures.csv',
        csv
      );
    }

    return reportUrls;
  },

  /**
   * Convert an array of objects to CSV string.
   * @param {string[]} columns
   * @param {Array} rows
   * @returns {string}
   */
  toCSV(columns, rows) {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = columns.join(',');
    const body = rows
      .map((row) => columns.map((col) => escape(row[col])).join(','))
      .join('\n');
    return `${header}\n${body}`;
  },

  /**
   * Upload a CSV report to Azure Blob Storage and return the blob URL.
   *
   * The documents container allows anonymous read access, so no SAS token
   * is generated. The URL is returned directly after upload. The batch UUID
   * in the blob path provides sufficient access control for report contents,
   * which are limited to line numbers and messages (no PII).
   *
   * @param {string} prefix
   * @param {string} filename
   * @param {string} content
   * @returns {string} Public URL of the uploaded blob
   */
  async uploadReport(prefix, filename, content) {
    const blobPath = `${prefix}/${filename}`;
    const containerClient = FileService.getReportsContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: 'text/csv' },
    });

    return blockBlobClient.url;
  },

  /**
   * Send a completion notification to the batch initiator.
   * @param {string} batchId
   * @param {Object} resultPayload
   */
  async notifyCompletion(batchId, resultPayload) {
    try {
      const batch = await TJobBatch.findOne({ id: batchId });
      if (!batch) return;

      const notificationType = await TNotificationType.findOne({
        name: 'IMPORT_COMPLETE',
      });
      if (!notificationType) {
        sails.log.warn(
          'CSVImportQueueService: IMPORT_COMPLETE notification type not found'
        );
        return;
      }

      await TNotification.create({
        dateInscription: new Date(),
        notificationType: notificationType.id,
        notifier: batch.initiator,
        notified: batch.initiator,
        jobBatch: batchId,
      });

      // eslint-disable-next-line global-require
      const LanguageService = require('./LanguageService');
      const user = await TCaver.findOne({ id: batch.initiator });
      if (user && user.mail && user.sendNotificationByEmail) {
        const { summary, reportUrls } = resultPayload;
        await sails.helpers.sendEmail
          .with({
            allowResponse: false,
            emailSubject: 'CSV Import Complete',
            locale:
              (await LanguageService.getLocale(user.language)) ||
              sails.config.i18n.defaultLocale,
            recipientEmail: user.mail,
            viewName: 'csv-import-complete',
            viewValues: {
              recipientName: user.nickname,
              batchId,
              successes: summary.successes,
              duplicates: summary.duplicates,
              failures: summary.failures,
              successesUrl: reportUrls.successes,
              duplicatesUrl: reportUrls.duplicates,
              failuresUrl: reportUrls.failures,
            },
          })
          .intercept('sendSESEmailError', () => {
            sails.log.error(
              `Failed to send CSV import completion email to ${user.nickname}`
            );
            return false;
          });
      }
    } catch (err) {
      sails.log.error('CSVImportQueueService: notification error:', err);
    }
  },

  /**
   * Get aggregated progress for a batch by querying pg-boss job states.
   * @param {string} batchId
   * @returns {Object|null} progress object
   */
  async getBatchProgress(batchId) {
    const batch = await TJobBatch.findOne({ id: batchId });
    if (!batch) return null;

    const query = `
      SELECT state, data, output
      FROM pgboss.job
      WHERE name = $1
        AND data->>'batchId' = $2
    `;
    const { rows: jobs } = await CommonService.query(query, [
      QUEUE_NAME,
      batchId,
    ]);

    let completedChunks = 0;
    let processedRows = 0;
    let successes = 0;
    let duplicates = 0;
    let failures = 0;

    for (const job of jobs) {
      if (job.state === 'completed' || job.state === 'failed') {
        completedChunks += 1;
        if (job.state === 'completed' && job.output) {
          const output =
            typeof job.output === 'string'
              ? JSON.parse(job.output)
              : job.output;
          successes += (output.successes || []).length;
          duplicates += (output.duplicates || []).length;
          failures += (output.failures || []).length;
          processedRows +=
            (output.successes || []).length +
            (output.duplicates || []).length +
            (output.failures || []).length;
        } else if (job.state === 'failed') {
          // Read the exact row count from the job's data payload.
          // This relies on pg-boss retaining the job's `data` column for
          // failed jobs within the `expireInHours: 4` retention window.
          const data =
            typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
          const lostRows =
            data && Array.isArray(data.rows) ? data.rows.length : 0;
          failures += lostRows;
          processedRows += lostRows;
        }
      }
    }

    return {
      totalChunks: batch.totalChunks,
      completedChunks,
      totalRows: batch.totalRows,
      processedRows,
      successes,
      duplicates,
      failures,
    };
  },
};
