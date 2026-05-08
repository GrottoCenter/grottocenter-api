/**
 * EnrichmentQueueService.js
 *
 * @description :: Manages the pg-boss backed job queue for asynchronous
 *   Nominatim reverse-geocoding enrichment of entrances and organizations.
 *
 * NOTE: The pg-boss instance is stored on `sails.enrichmentBoss` rather than
 * a module-level variable because Sails' include-all clears the Node require
 * cache after loading services. A `let boss` at module scope would be a
 * different variable for each require() call, causing the "queue not
 * initialized" issue.
 */

const { PgBoss } = require('pg-boss');
const logger = require('../utils/logger');

const QUEUE_NAME = 'geocoding-enrichment';

const TRANSIENT_ERROR_CODES = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];

module.exports = {
  /**
   * Set boss reference (for testing).
   * @param {PgBoss|object|null} instance
   */
  setBoss(instance) {
    sails.enrichmentBoss = instance;
  },

  /**
   * Build the PostgreSQL connection string for pg-boss.
   *
   * Prefers the explicit ENRICHMENT_QUEUE_DATABASE_URL env var.
   * Otherwise builds the string from the Sails datastore config. The `url`
   * field is only used if it looks like a full postgres:// URI; in Azure the
   * env var `sails_datastores__default__url` is often set to a bare hostname
   * (e.g. "myserver.postgres.database.azure.com") which Waterline handles
   * via individual params but pg-boss cannot parse.
   *
   * @returns {string}
   */
  getConnectionString() {
    if (process.env.ENRICHMENT_QUEUE_DATABASE_URL) {
      return process.env.ENRICHMENT_QUEUE_DATABASE_URL;
    }
    const dsConfig = sails.config.datastores.default;

    // Only trust `url` if it's a proper connection URI
    if (dsConfig.url && dsConfig.url.startsWith('postgres')) {
      return dsConfig.url;
    }

    // Build from individual params (+ use `url` as host if it's a bare hostname)
    const user = dsConfig.user || 'postgres';
    const password = dsConfig.password || '';
    const host = dsConfig.host || dsConfig.url || 'localhost';
    const port = dsConfig.port || 5432;
    const database = dsConfig.database || 'postgres';
    const ssl = dsConfig.ssl ? '?sslmode=require' : '';
    return `postgres://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl}`;
  },

  /**
   * Initialize pg-boss and register the worker.
   * Called from bootstrap.js.
   */
  async start() {
    const connectionString = module.exports.getConnectionString();
    sails.enrichmentBoss = new PgBoss({
      connectionString,
      retryLimit: 5,
      retryDelay: 30,
      retryBackoff: true,
      expireInHours: 24,
    });

    sails.enrichmentBoss.on('error', (err) => {
      sails.log.error(
        'EnrichmentQueueService pg-boss error:',
        err.message || err
      );
    });

    await sails.enrichmentBoss.start();
    await sails.enrichmentBoss.createQueue(QUEUE_NAME);

    // NOTE: Single-instance constraint — Nominatim rate limit compliance
    // (1 req/s) relies on having a single worker process. The poll interval
    // plus response latency naturally throttles to ~1 req/s. If horizontal
    // scaling is introduced (multiple API instances), an explicit per-job
    // delay or a dedicated worker process must be added.
    await sails.enrichmentBoss.work(
      QUEUE_NAME,
      { newJobCheckInterval: 5000 },
      module.exports.processJob
    );

    sails.log.info('EnrichmentQueueService: started and listening for jobs');
  },

  /**
   * Gracefully stop pg-boss.
   */
  async stop() {
    if (sails.enrichmentBoss) {
      await sails.enrichmentBoss.stop({ graceful: true, timeout: 30000 });
      sails.log.info('EnrichmentQueueService: stopped gracefully');
    }
  },

  /**
   * Enqueue an enrichment job.
   *
   * @param {number} entityId - The ID of the entrance or organization
   * @param {'entrance'|'organization'} entityType
   * @param {string} [traceId] - Optional trace ID from the originating request
   */
  async enqueue(entityId, entityType, traceId) {
    if (!sails.enrichmentBoss) {
      sails.log.warn(
        'EnrichmentQueueService: queue not initialized, skipping enqueue'
      );
      return;
    }
    await sails.enrichmentBoss.send(
      QUEUE_NAME,
      { entityId, entityType, traceId },
      { singletonKey: `${entityType}-${entityId}` }
    );
    sails.log.info(`Enrichment job enqueued: ${entityType} ${entityId}`);
  },

  /**
   * Process enrichment jobs (pg-boss v12 passes an array of jobs).
   * @param {object[]} jobs - array of pg-boss job objects
   */
  async processJob(jobs) {
    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobList) {
      if (!job.data) {
        sails.log.warn(
          `EnrichmentQueueService: job ${job.id} has no data, skipping`
        );
        // eslint-disable-next-line no-continue
        continue;
      }
      const { entityId, entityType, traceId } = job.data;

      const tid = traceId || 'enrichment';
      // eslint-disable-next-line no-await-in-loop
      await logger.run(tid, async () => {
        const startTime = Date.now();
        try {
          if (entityType === 'entrance') {
            await module.exports.processEntrance(entityId);
          } else if (entityType === 'organization') {
            await module.exports.processOrganization(entityId);
          } else {
            sails.log.warn(
              `EnrichmentQueueService: unknown entityType "${entityType}" for job ${job.id}`
            );
          }
        } catch (err) {
          if (
            err.statusCode === 429 ||
            TRANSIENT_ERROR_CODES.includes(err.code)
          ) {
            throw err;
          }
          sails.log.error(
            `EnrichmentQueueService: permanent failure for ${entityType} ${entityId} (${Date.now() - startTime}ms):`,
            err
          );
          return;
        }
        sails.log.info(
          `Enrichment job done: ${entityType} ${entityId} ${Date.now() - startTime}ms`
        );
      });
    }
  },

  /**
   * Process an entrance enrichment job.
   * @param {number} entranceId
   */
  async processEntrance(entranceId) {
    sails.log.info(`Enrichment job started: entrance ${entranceId}`);
    const entrance = await TEntrance.findOne({ id: entranceId });
    if (!entrance || entrance.isDeleted) {
      sails.log.info(
        `Enrichment job skipped: entrance ${entranceId} (not found or deleted)`
      );
      return;
    }

    const address = await sails.services.geocodingservice.reverse(
      entrance.latitude,
      entrance.longitude
    );
    if (!address) {
      sails.log.info(
        `Enrichment job completed: entrance ${entranceId} (no address from Nominatim)`
      );
      return;
    }

    await TEntrance.updateOne({ id: entranceId }).set({
      region: address.region,
      county: address.county,
      city: address.city,
      iso_3166_2: address.iso_3166_2,
    });
    sails.log.info(
      `Enrichment job completed: entrance ${entranceId} (region=${address.region}, iso_3166_2=${address.iso_3166_2})`
    );
  },

  /**
   * Process an organization enrichment job.
   * @param {number} organizationId
   */
  async processOrganization(organizationId) {
    sails.log.info(`Enrichment job started: organization ${organizationId}`);
    const org = await TGrotto.findOne({ id: organizationId });
    if (!org || org.isDeleted) {
      sails.log.info(
        `Enrichment job skipped: organization ${organizationId} (not found or deleted)`
      );
      return;
    }

    if (!org.latitude || !org.longitude) {
      sails.log.info(
        `Enrichment job skipped: organization ${organizationId} (no coordinates)`
      );
      return;
    }

    const address = await sails.services.geocodingservice.reverse(
      org.latitude,
      org.longitude
    );
    if (!address) {
      sails.log.info(
        `Enrichment job completed: organization ${organizationId} (no address from Nominatim)`
      );
      return;
    }

    await TGrotto.updateOne({ id: organizationId }).set({
      iso_3166_2: address.iso_3166_2,
    });
    sails.log.info(
      `Enrichment job completed: organization ${organizationId} (iso_3166_2=${address.iso_3166_2})`
    );
  },
};
