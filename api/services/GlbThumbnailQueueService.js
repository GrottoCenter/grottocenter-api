/**
 * GlbThumbnailQueueService.js
 *
 * @description :: Renders a static preview of uploaded GLB models in the
 *   background, on the shared pg-boss instance, and stores it as the file's
 *   thumbnails so that a document page can show an image before loading the
 *   3D viewer. Thumbnails stay null while the job is pending or if the model
 *   cannot be rendered: the original file is never affected.
 */

const glbRenderer = require('../utils/glbRenderer');

const QUEUE_NAME = 'glb-thumbnail';
const QUEUE_OPTIONS = {
  // Retries cover storage hiccups; a model that fails to render is not retried
  retryLimit: 2,
  retryDelay: 60,
  // Download, rendering (bounded by the worker timeout) and upload
  expireInSeconds: 15 * 60,
};

module.exports = {
  QUEUE_NAME,
  QUEUE_OPTIONS,

  /**
   * Create the queue and register its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'GlbThumbnailQueueService: pg-boss not available, skipping'
      );
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    // Default batch size and concurrency of 1: one rendering at a time
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('GlbThumbnailQueueService: started and listening for jobs');
  },

  /**
   * Enqueue the thumbnail generation of a GLB file.
   * @param {number} fileId - The TFile id
   */
  async enqueue(fileId) {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'GlbThumbnailQueueService: queue not initialized, skipping enqueue'
      );
      return;
    }
    await boss.send(QUEUE_NAME, { fileId }, { singletonKey: `file-${fileId}` });
  },

  /**
   * Process thumbnail jobs (pg-boss v12 passes an array of jobs).
   * Throwing lets pg-boss record the failure and retry.
   * @param {object[]} jobs - array of pg-boss job objects
   */
  async processJob(jobs) {
    for (const job of jobs) {
      if (!job.data || !job.data.fileId) {
        sails.log.warn(
          `GlbThumbnailQueueService: job ${job.id} has no file id, skipping`
        );
      } else {
        // eslint-disable-next-line no-await-in-loop
        await module.exports.processFile(job.data.fileId);
      }
    }
  },

  /**
   * Render a GLB file and store its thumbnails.
   * @param {number} fileId - The TFile id
   * @throws {Error} When the storage fails, so that the job is retried
   */
  async processFile(fileId) {
    const file = await TFile.findOne(fileId);
    if (!file) {
      sails.log.info(`GlbThumbnailQueueService: file ${fileId} is gone`);
      return;
    }

    const startTime = Date.now();
    const glb = await FileService.document.download(file.path);

    let png;
    try {
      png = await glbRenderer.renderGlbInWorker(glb);
    } catch (err) {
      // The same model would fail again: give up, the file stays usable
      sails.log.error(
        `GlbThumbnailQueueService: cannot render file ${fileId}:`,
        err.message
      );
      return;
    }

    const thumbnails = await FileService.document.storeThumbnails(
      png,
      file.path
    );
    if (thumbnails.hadError) {
      throw new Error(`Thumbnail upload failed for file ${fileId}`);
    }

    const updated = await TFile.updateOne(fileId).set({
      thumbnailSmall: thumbnails.small,
      thumbnailMedium: thumbnails.medium,
      thumbnailLarge: thumbnails.large,
    });
    if (!updated) {
      // Deleted while rendering: its thumbnail blobs are left orphaned, the
      // same trade-off as partial uploads in ThumbnailService.generate
      sails.log.warn(
        `GlbThumbnailQueueService: file ${fileId} deleted during rendering`
      );
      return;
    }
    sails.log.info(
      `GlbThumbnailQueueService: file ${fileId} done in ${Date.now() - startTime}ms`
    );
  },
};
