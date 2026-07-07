#!/usr/bin/env node

/* eslint-disable no-await-in-loop, no-loop-func, global-require, no-console */

/**
 * Backfill Thumbnails Script
 *
 * Generates thumbnails for existing image files that don't have any.
 * Lifts Sails to access models, config, and services.
 *
 * Usage:
 *   node scripts/backfill-thumbnails.js
 *   node scripts/backfill-thumbnails.js --dry-run
 *   node scripts/backfill-thumbnails.js --batch-size 5
 */

const Sails = require('sails');
const rc = require('sails/accessible/rc');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob');

// Parse CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchSizeIndex = args.indexOf('--batch-size');
const batchSize =
  batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1], 10) || 10 : 10;

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

    // Process in batches
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file) => {
          try {
            // Download original from Azure
            const blockBlobClient = containerClient.getBlockBlobClient(
              file.path
            );

            const downloadResponse = await blockBlobClient.download(0);
            const chunks = [];
            for await (const chunk of downloadResponse.readableStreamBody) {
              chunks.push(chunk);
            }
            const imageBuffer = Buffer.concat(chunks);

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
