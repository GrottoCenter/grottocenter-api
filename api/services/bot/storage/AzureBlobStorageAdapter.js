/**
 * Storage adapter publishing the bot pages to an Azure Blob static website
 * (the `$web` container), through @azure/storage-blob as FileService does.
 *
 * A page is uploaded with Content-Type `text/html; charset=utf-8` unless the
 * caller names another (the sitemaps: `application/xml; charset=utf-8` for the
 * index, `application/gzip` for a shard, whose body is a Buffer). The
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

  // `body` is a string (UTF-8) or a Buffer (bytes, sent as is).
  // `metadata` (optional, a flat object of strings, e.g. { redirectto: url })
  // becomes the blob's metadata. An upload replaces the blob's metadata as a
  // whole, so a page uploaded without any drops the `redirectto` it had.
  // `contentType` (optional) defaults to HTML.
  async put(key, body, { metadata, contentType = HTML_CONTENT_TYPE } = {}) {
    await this.container
      .getBlockBlobClient(key)
      .upload(body, Buffer.byteLength(body, 'utf8'), {
        blobHTTPHeaders: { blobContentType: contentType },
        ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
      });
  }

  async delete(key) {
    // Resolves when the blob is already gone
    await this.container.getBlockBlobClient(key).deleteIfExists();
  }

  // The bytes of a page, or null when there is none. The size is known from
  // the response headers before the body is read: a page over `maxBytes`
  // rejects with E_BOT_PAGE_TOO_LARGE and the stream is dropped unread.
  async get(key, { maxBytes = Infinity } = {}) {
    let response;
    try {
      response = await this.container.getBlockBlobClient(key).download(0);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
    const stream = response.readableStreamBody;
    if (response.contentLength > maxBytes) {
      stream?.destroy();
      throw Object.assign(new Error(`${key} is over ${maxBytes} bytes`), {
        code: 'E_BOT_PAGE_TOO_LARGE',
      });
    }
    const chunks = [];
    let size = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of stream) {
      size += chunk.length;
      if (size > maxBytes) {
        stream.destroy();
        throw Object.assign(new Error(`${key} is over ${maxBytes} bytes`), {
          code: 'E_BOT_PAGE_TOO_LARGE',
        });
      }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
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
