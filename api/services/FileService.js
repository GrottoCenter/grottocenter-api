const crypto = require('crypto');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob');
const stream = require('stream');

// Ensure crypto is available globally for Azure SDK
if (!global.crypto) {
  global.crypto = crypto;
}

const AZURE_ACCOUNT = 'grottocenter';
const AZURE_CONTAINER_DOCUMENTS = 'documents';
const AZURE_CONTAINER_DB_SNAPSHOTS = 'db-exports';

const { AZURE_KEY = '' } = process.env;

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

function noCredentialWarning(name, args) {
  const fmtArgs = Object.entries(args)
    .map((e) => e.join(': '))
    .join(', ');
  sails.log.warn(`Azure ${name} Missing credential, ${fmtArgs}`);
  return null;
}

function getSignedReadUrl(container, path, expiresOnMs) {
  const sasQuery = generateBlobSASQueryParameters(
    {
      blobName: path,
      containerName: container,
      expiresOn: new Date(Date.now() + expiresOnMs),
      permissions: BlobSASPermissions.parse('r'),
    },
    credentials.sharedKeyCredential
  );

  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${container}/${path}?${sasQuery.toString()}`;
}

module.exports = {
  INVALID_FORMAT,
  INVALID_NAME,
  ERROR_DURING_UPLOAD_TO_AZURE,

  isCredentials: !!credentials,

  document: {
    getUrl(path) {
      // The documents container allow anonymous access
      return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER_DOCUMENTS}/${path}`;
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
      const { mimeType } = foundFormat;

      if (!credentials) {
        noCredentialWarning('Document upload', {
          name,
          mimeType,
          size: file.size,
        });
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

      const param = {
        dateInscription: new Date(),
        fileName: name,
        document: idDocument,
        fileFormat: foundFormat[0].id,
        path: pathName,
        isValidated,
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
        noCredentialWarning('Document delete', file);
      } else {
        const blockBlobClient =
          credentials.documentsBlobClient.getBlockBlobClient(
            destroyedRecord.path
          );
        await blockBlobClient.delete({ deleteSnapshots: 'include' });
      }
      return destroyedRecord;
    },
  },

  dbExport: {
    getUrl(path, expiresOnMs) {
      if (!credentials) return noCredentialWarning('dbExport getUrl', { path });
      return getSignedReadUrl(AZURE_CONTAINER_DB_SNAPSHOTS, path, expiresOnMs);
    },

    async getMetadata() {
      if (!credentials) return noCredentialWarning('dbExport getMetadata', {});
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
      if (!credentials) return noCredentialWarning('dbExport setMetadata', {});
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
      if (!credentials)
        return noCredentialWarning('dbExport upload', { filename });

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
