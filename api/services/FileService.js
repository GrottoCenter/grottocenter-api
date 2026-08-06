const crypto = require('crypto');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob');
const stream = require('stream');
const fs = require('fs');
const path = require('path');

// Ensure crypto is available globally for Azure SDK
if (!global.crypto) {
  global.crypto = crypto;
}

const AZURE_ACCOUNT = 'grottocenter';
const AZURE_CONTAINER_DOCUMENTS = 'documents';
const AZURE_CONTAINER_DB_SNAPSHOTS = 'db-exports';

const { AZURE_KEY = '' } = process.env;

// Local storage root for dev environment (when AZURE_KEY is not set)
const LOCAL_UPLOADS_ROOT = path.resolve(__dirname, '../../.local-uploads');
const LOCAL_DOCUMENTS_DIR = path.join(LOCAL_UPLOADS_ROOT, 'documents');
const LOCAL_DB_EXPORTS_DIR = path.join(LOCAL_UPLOADS_ROOT, 'db-exports');

let credentials = null;

if (AZURE_KEY) {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    AZURE_ACCOUNT,
    AZURE_KEY
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${AZURE_ACCOUNT}.blob.core.windows.net/`,
    sharedKeyCredential
  );
  credentials = {
    sharedKeyCredential,
    dbExportBlobClient: blobServiceClient.getContainerClient(
      AZURE_CONTAINER_DB_SNAPSHOTS
    ),
    documentsBlobClient: blobServiceClient.getContainerClient(
      AZURE_CONTAINER_DOCUMENTS
    ),
  };
} else {
  // Create local storage directories for dev environment
  fs.mkdirSync(LOCAL_DOCUMENTS_DIR, { recursive: true });
  fs.mkdirSync(LOCAL_DB_EXPORTS_DIR, { recursive: true });
}

const INVALID_FORMAT = 'INVALID_FORMAT';
const INVALID_NAME = 'INVALID_NAME';
const ERROR_DURING_UPLOAD_TO_AZURE = 'ERROR_DURING_UPLOAD_TO_AZURE';

class FileError extends Error {
  constructor(message, fileName) {
    super(message);
    this.fileName = fileName;
  }
}

const generateName = (fileName) => {
  const identifier = Math.random().toString().replace(/0\./, '');
  const newFileName = fileName.replace(/ /, '_');
  return `${identifier}-${newFileName}`;
};

/**
 * Get the base URL for local file serving in dev mode.
 * Uses the Sails config if available, otherwise defaults to localhost:1337.
 */
function getLocalBaseUrl() {
  const port =
    (sails && sails.config && sails.config.port) || process.env.PORT || 1337;
  return `http://localhost:${port}`;
}

function getSignedReadUrl(container, blobPath, expiresOnMs) {
  const sasQuery = generateBlobSASQueryParameters(
    {
      blobName: blobPath,
      containerName: container,
      expiresOn: new Date(Date.now() + expiresOnMs),
      permissions: BlobSASPermissions.parse('r'),
    },
    credentials.sharedKeyCredential
  );

  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${container}/${blobPath}?${sasQuery.toString()}`;
}

module.exports = {
  INVALID_FORMAT,
  INVALID_NAME,
  ERROR_DURING_UPLOAD_TO_AZURE,

  isCredentials: !!credentials,

  /**
   * Test-only: Retrieve the current module-level credentials object.
   * Used by tests to save original credentials before injecting mocks.
   * @returns {object|null}
   */
  getCredentialsForTest() {
    return credentials;
  },

  /**
   * Test-only: Override the module-level credentials object.
   * Allows integration tests to inject a mock blob client without
   * reimplementing create/delete. Call with `null` to restore original.
   * @param {object|null} mockCredentials
   */
  setCredentialsForTest(mockCredentials) {
    credentials = mockCredentials;
    this.isCredentials = !!mockCredentials;
  },

  /**
   * Get the container client for CSV import reports.
   * Reuses documents container with prefix isolation.
   * In dev mode (no credentials), returns a local filesystem adapter.
   * @returns {import('@azure/storage-blob').ContainerClient|object|null}
   */
  getReportsContainerClient() {
    if (!credentials) {
      // Return a local adapter that mimics the ContainerClient interface
      return {
        containerName: AZURE_CONTAINER_DOCUMENTS,
        getBlockBlobClient(blobPath) {
          const localPath = path.join(LOCAL_DOCUMENTS_DIR, blobPath);
          return {
            url: `${getLocalBaseUrl()}/local-uploads/documents/${blobPath}`,
            async upload(content, _byteLength, _options) {
              fs.mkdirSync(path.dirname(localPath), { recursive: true });
              fs.writeFileSync(localPath, content);
              sails.log.info(`[Local Storage] Report saved: ${localPath}`);
            },
          };
        },
      };
    }
    return credentials.documentsBlobClient;
  },

  document: {
    getUrl(filePath) {
      if (!credentials) {
        return `${getLocalBaseUrl()}/local-uploads/documents/${filePath}`;
      }
      // The documents container allow anonymous access
      return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER_DOCUMENTS}/${filePath}`;
    },

    // File is a multer object : https://github.com/expressjs/multer#file-information
    /**
     *
     * @param {*} file
     * @param {*} idDocument
     * @param {*} fetchResult
     * @param {*} isValidated
     * @throws {FileError}
     * @returns
     */
    // eslint-disable-next-line consistent-return
    async create(
      file,
      idDocument,
      fetchResult = false,
      isValidated = true,
      connection = null
    ) {
      const name = file.originalname;
      const pathName = generateName(name);
      const lastDot = name.lastIndexOf('.');
      if (lastDot <= 0 || lastDot === name.length - 1) {
        throw new FileError(INVALID_NAME, name);
      }
      const extension = name.slice(lastDot + 1).toLowerCase();

      let formatQuery = TFileFormat.find({ extension }).limit(1);
      if (connection) {
        formatQuery = formatQuery.usingConnection(connection);
      }
      const foundFormat = await formatQuery;
      if (foundFormat.length === 0) {
        throw new FileError(INVALID_FORMAT, name);
      }
      const { mimeType } = foundFormat[0];

      if (!credentials) {
        // Dev mode: store file locally
        const localPath = path.join(LOCAL_DOCUMENTS_DIR, pathName);
        fs.writeFileSync(localPath, file.buffer);
        sails.log.info(
          `[Local Storage] Document saved: ${localPath} (${mimeType}, ${file.size} bytes)`
        );
      } else {
        sails.log.info(`Uploading ${name} to Azure Blob...`);
        try {
          const blockBlobClient =
            credentials.documentsBlobClient.getBlockBlobClient(pathName);
          await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: mimeType },
          });
        } catch (err) {
          throw new FileError(ERROR_DURING_UPLOAD_TO_AZURE, name);
        }
      }

      let thumbnailPaths = { small: null, medium: null, large: null };
      const fileMimeType = foundFormat[0].mimeType;
      if (credentials && ThumbnailService.isProcessable(fileMimeType)) {
        try {
          thumbnailPaths = await ThumbnailService.generate(
            file.buffer,
            pathName,
            credentials.documentsBlobClient
          );
        } catch (err) {
          sails.log.error('Thumbnail generation failed:', err);
          // Continue — thumbnails are optional
        }
      }

      const param = {
        dateInscription: new Date(),
        fileName: name,
        document: idDocument,
        fileFormat: foundFormat[0].id,
        path: pathName,
        isValidated,
        thumbnailSmall: thumbnailPaths.small,
        thumbnailMedium: thumbnailPaths.medium,
        thumbnailLarge: thumbnailPaths.large,
      };
      if (fetchResult) {
        let createQuery = TFile.create(param);
        if (connection) {
          createQuery = createQuery.usingConnection(connection);
        }
        const createdFile = await createQuery.fetch();
        return createdFile;
      }
      let createQuery = TFile.create(param);
      if (connection) {
        createQuery = createQuery.usingConnection(connection);
      }
      await createQuery;
    },

    async update(file) {
      const res = await TFile.updateOne(file.id).set({
        fileName: file.fileName,
      });
      return res;
    },

    async delete(file) {
      const destroyedRecord = await TFile.destroyOne(file.id);
      if (!credentials) {
        // Dev mode: delete from local filesystem
        const localPath = path.join(LOCAL_DOCUMENTS_DIR, destroyedRecord.path);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          sails.log.info(`[Local Storage] Document deleted: ${localPath}`);
        }
      } else {
        const blockBlobClient =
          credentials.documentsBlobClient.getBlockBlobClient(
            destroyedRecord.path
          );
        await blockBlobClient.delete({ deleteSnapshots: 'include' });

        // Best-effort cleanup of thumbnail blobs
        const thumbnailPaths = [
          destroyedRecord.thumbnailSmall,
          destroyedRecord.thumbnailMedium,
          destroyedRecord.thumbnailLarge,
        ].filter(Boolean);
        await Promise.all(
          thumbnailPaths.map(async (thumbPath) => {
            try {
              const thumbBlobClient =
                credentials.documentsBlobClient.getBlockBlobClient(thumbPath);
              await thumbBlobClient.delete({ deleteSnapshots: 'include' });
            } catch (err) {
              sails.log.error(
                `Failed to delete thumbnail blob ${thumbPath}:`,
                err
              );
            }
          })
        );
      }
      return destroyedRecord;
    },
  },

  dbExport: {
    getUrl(filePath, expiresOnMs) {
      if (!credentials) {
        return `${getLocalBaseUrl()}/local-uploads/db-exports/${filePath}`;
      }
      return getSignedReadUrl(
        AZURE_CONTAINER_DB_SNAPSHOTS,
        filePath,
        expiresOnMs
      );
    },

    async getMetadata() {
      if (!credentials) {
        const metadataPath = path.join(
          LOCAL_DB_EXPORTS_DIR,
          'exportMetadata.json'
        );
        if (!fs.existsSync(metadataPath)) {
          sails.log.warn(
            `[Local Storage] DB export metadata not found: ${metadataPath}`
          );
          return null;
        }
        const data = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(data);
      }
      const metadataBlobClient =
        credentials.dbExportBlobClient.getBlockBlobClient(
          'exportMetadata.json'
        );
      const response = await metadataBlobClient.download();
      let data = '';
      for await (const chunk of response.readableStreamBody) data += chunk;
      return JSON.parse(data);
    },

    async setMetadata(archiveSize) {
      if (!credentials) {
        const metadataPath = path.join(
          LOCAL_DB_EXPORTS_DIR,
          'exportMetadata.json'
        );
        const dataStr = JSON.stringify({
          lastUpdate: new Date().toISOString(),
          size: archiveSize,
        });
        fs.writeFileSync(metadataPath, dataStr);
        sails.log.info(
          `[Local Storage] DB export metadata saved: ${metadataPath}`
        );
        return null;
      }
      const metadataBlobClient =
        credentials.dbExportBlobClient.getBlockBlobClient(
          'exportMetadata.json'
        );
      const dataStr = JSON.stringify({
        lastUpdate: new Date().toISOString(),
        size: archiveSize,
      });
      await metadataBlobClient.upload(dataStr, dataStr.length);
      return null;
    },

    upload(filename, mimeType) {
      if (!credentials) {
        // Dev mode: write to local filesystem via a PassThrough stream
        const localPath = path.join(LOCAL_DB_EXPORTS_DIR, filename);
        const aStream = new stream.PassThrough();
        const writeStream = fs.createWriteStream(localPath);
        aStream.pipe(writeStream);
        writeStream.on('finish', () => {
          sails.log.info(
            `[Local Storage] DB export saved: ${localPath} (${mimeType})`
          );
        });
        return aStream;
      }

      const ONE_MEGABYTE = 1024 * 1024;
      const BUFFER_SIZE = 2 * ONE_MEGABYTE;
      const MAX_BUFFERS = 3;

      try {
        const aStream = stream.PassThrough();
        const blockBlobClient =
          credentials.dbExportBlobClient.getBlockBlobClient(filename);
        blockBlobClient.uploadStream(aStream, BUFFER_SIZE, MAX_BUFFERS, {
          blobHTTPHeaders: { blobContentType: mimeType },
        });
        return aStream;
      } catch (err) {
        throw new FileError(ERROR_DURING_UPLOAD_TO_AZURE, filename);
      }
    },
  },
};
