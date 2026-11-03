/**
 * Storage adapter publishing the bot pages to an Azure Blob static website
 * (the `$web` container), through @azure/storage-blob as FileService does.
 *
 * Every page is uploaded with Content-Type `text/html; charset=utf-8`. The
 * blob's ETag and Last-Modified are forwarded by the edge Worker for
 * conditional requests, so no cache header is set here and no CDN purge is
 * needed: the Worker never caches these pages.
 *
 * Configuration comes from the environment (see config/custom.js and
 * docs/bot-surface.md): nothing is hardcoded.
 */

const { BlobServiceClient } = require('@azure/storage-blob');

const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';

class AzureBlobStorageAdapter {
  /** @param {import('@azure/storage-blob').ContainerClient} containerClient */
  constructor(containerClient) {
    if (!containerClient) {
      throw new Error('AzureBlobStorageAdapter needs a container client');
    }
    this.container = containerClient;
  }

  static fromConnectionString(connectionString, containerName) {
    if (!connectionString || !containerName) {
      throw new Error(
        'The Azure bot pages storage needs a connection string and a container name'
      );
    }
    return new AzureBlobStorageAdapter(
      BlobServiceClient.fromConnectionString(
        connectionString
      ).getContainerClient(containerName)
    );
  }

  async put(key, html) {
    await this.container
      .getBlockBlobClient(key)
      .upload(html, Buffer.byteLength(html, 'utf8'), {
        blobHTTPHeaders: { blobContentType: HTML_CONTENT_TYPE },
      });
  }

  async delete(key) {
    // Resolves when the blob is already gone
    await this.container.getBlockBlobClient(key).deleteIfExists();
  }

  async *list() {
    // eslint-disable-next-line no-restricted-syntax
    for await (const blob of this.container.listBlobsFlat()) {
      yield blob.name;
    }
  }
}

AzureBlobStorageAdapter.HTML_CONTENT_TYPE = HTML_CONTENT_TYPE;

module.exports = AzureBlobStorageAdapter;
