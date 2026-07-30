#!/usr/bin/env node

/* eslint-disable no-await-in-loop, no-loop-func, global-require, no-console */

/**
 * Backfill Thumbnails Script
 *
 * Generates thumbnails for existing image files that don't have any, and
 * regenerates thumbnails for images that already have them but were stored
 * with the wrong orientation (EXIF Orientation != 1 or missing).
 *
 * Lifts Sails to access models, config, and services.
 *
 * Usage:
 *   node scripts/backfill-thumbnails.js
 *   node scripts/backfill-thumbnails.js --dry-run
 *   node scripts/backfill-thumbnails.js --batch-size 5
 *   node scripts/backfill-thumbnails.js --fix-orientation   # also re-generates already-thumbnailed images with wrong orientation
 */

const Sails = require('sails');
const rc = require('sails/accessible/rc');
const sharp = require('sharp');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob');

// Parse CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fixOrientation = args.includes('--fix-orientation');
const batchSizeIndex = args.indexOf('--batch-size');
const batchSize =
  batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1], 10) || 1 : 1;

// Maximum blob size to download (50 MB) — skip larger files to avoid OOM
const MAX_BLOB_BYTES = 50 * 1024 * 1024;

async function run() {
  // Lift Sails in non-server mode
  const sailsApp = await new Promise((resolve, reject) => {
    Sails.lift(
      {
        ...rc('sails'),
        hooks: {
          blueprints: false,
          orm: require('sails-hook-orm'),
          grunt: false,
          http: false,
          pubsub: false,
          sockets: false,
          views: false,
        },
        log: { level: 'warn' },
      },
      (err, app) => {
        if (err) return reject(err);
        return resolve(app);
      }
    );
  });

  try {
    // Query file records without thumbnails in pages to avoid loading all into memory
    const pageSize = 500;
    let skip = 0;
    let page;
    const imageFiles = [];

    do {
      page = await TFile.find({
        where: {
          thumbnailSmall: null,
          thumbnailMedium: null,
          thumbnailLarge: null,
        },
      })
        .populate('fileFormat')
        .limit(pageSize)
        .skip(skip);

      page.forEach((f) => {
        if (!f.fileFormat || !f.fileFormat.mimeType) return;
        const { mimeType } = f.fileFormat;
        if (mimeType === 'image/svg+xml') return;
        if (ThumbnailService.isProcessable(mimeType)) {
          imageFiles.push(f);
        }
      });

      skip += pageSize;
    } while (page.length === pageSize);

    console.log(`Found ${imageFiles.length} image files without thumbnails.`);

    // When --fix-orientation is passed, also collect images that already have
    // thumbnails but may have been generated before .autoOrient() was added.
    // We check the EXIF orientation of the downloaded buffer at process time
    // and skip files that are already correctly oriented (orientation == 1 or absent).
    if (fixOrientation) {
      let orientSkip = 0;
      let orientPage;
      do {
        orientPage = await TFile.find({
          where: {
            or: [
              { thumbnailSmall: { '!=': null } },
              { thumbnailMedium: { '!=': null } },
              { thumbnailLarge: { '!=': null } },
            ],
          },
        })
          .populate('fileFormat')
          .limit(pageSize)
          .skip(orientSkip);

        orientPage.forEach((f) => {
          if (!f.fileFormat || !f.fileFormat.mimeType) return;
          const { mimeType } = f.fileFormat;
          if (mimeType === 'image/svg+xml') return;
          if (ThumbnailService.isProcessable(mimeType)) {
            imageFiles.push(f);
          }
        });

        orientSkip += pageSize;
      } while (orientPage.length === pageSize);

      console.log(
        `Found ${imageFiles.length} total image files to process (including orientation re-check).`
      );
    }

    console.log('File IDs to process:', imageFiles.map((f) => f.id).join(', '));

    if (dryRun) {
      console.log('[DRY RUN] Would process', imageFiles.length, 'files.');
      console.log('[DRY RUN] No changes made.');
      sailsApp.lower();
      process.exit(0);
      return;
    }

    if (imageFiles.length === 0) {
      console.log('Nothing to process.');
      sailsApp.lower();
      process.exit(0);
      return;
    }

    // Check Azure credentials
    if (!process.env.AZURE_KEY) {
      console.error(
        'ERROR: Azure credentials not configured. Set AZURE_KEY environment variable.'
      );
      sailsApp.lower();
      process.exit(1);
      return;
    }

    // Build Azure container client
    const sharedKeyCredential = new StorageSharedKeyCredential(
      'grottocenter',
      process.env.AZURE_KEY
    );
    const blobServiceClient = new BlobServiceClient(
      'https://grottocenter.blob.core.windows.net/',
      sharedKeyCredential
    );
    const containerClient = blobServiceClient.getContainerClient('documents');

    let processed = 0;
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;

    // Process in batches (default: sequential to limit memory pressure)
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file) => {
          try {
            // Check blob size before downloading to avoid OOM on huge files
            const blockBlobClient = containerClient.getBlockBlobClient(
              file.path
            );

            let properties;
            try {
              properties = await blockBlobClient.getProperties();
            } catch (propErr) {
              if (propErr.statusCode === 404) {
                throw new Error('The specified blob does not exist.');
              }
              throw propErr;
            }

            if (properties.contentLength > MAX_BLOB_BYTES) {
              console.log(
                `SKIPPED file ${file.id}: blob too large (${Math.round(properties.contentLength / 1024 / 1024)} MB), skipping to avoid OOM`
              );
              skipped += 1;
              return;
            }

            // Download original from Azure
            const downloadResponse = await blockBlobClient.download(0);
            const chunks = [];
            for await (const chunk of downloadResponse.readableStreamBody) {
              chunks.push(chunk);
            }
            const imageBuffer = Buffer.concat(chunks);

            // When --fix-orientation: skip images that are already upright
            // (EXIF orientation absent or == 1) — no re-generation needed.
            if (fixOrientation) {
              const meta = await sharp(imageBuffer).metadata();
              const { orientation } = meta;
              if (!orientation || orientation === 1) {
                skipped += 1;
                processed += 1;
                return;
              }
            }

            // Generate thumbnails
            const thumbnailPaths = await ThumbnailService.generate(
              imageBuffer,
              file.path,
              containerClient
            );

            // Update DB record
            if (
              thumbnailPaths.small ||
              thumbnailPaths.medium ||
              thumbnailPaths.large
            ) {
              await TFile.updateOne(file.id).set({
                thumbnailSmall: thumbnailPaths.small,
                thumbnailMedium: thumbnailPaths.medium,
                thumbnailLarge: thumbnailPaths.large,
              });
              succeeded += 1;
            } else if (thumbnailPaths.hadError) {
              console.error(
                `WARNING: file ${file.id} failed thumbnail generation (not just too small)`
              );
              failed += 1;
            } else {
              skipped += 1;
            }
          } catch (err) {
            console.error(`ERROR processing file ${file.id}:`, err.message);
            failed += 1;
          }
          processed += 1;
        })
      );

      console.log(
        `Processed ${processed}/${imageFiles.length} files, ${failed} error(s)`
      );

      // Hint GC to reclaim buffers between batches (run with --expose-gc for
      // deterministic collection; without it this is a no-op)
      if (global.gc) {
        global.gc();
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total files: ${imageFiles.length}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Skipped (too small): ${skipped}`);
    console.log(`Failed: ${failed}`);

    sailsApp.lower();
    process.exit(failed > 0 && succeeded === 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error:', err);
    sailsApp.lower();
    process.exit(1);
  }
}

run();
