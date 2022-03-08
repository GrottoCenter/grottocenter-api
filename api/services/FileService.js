const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob');
const ramda = require('ramda');

const AZURE_CONTAINER = 'documents';
const AZURE_ACCOUNT = 'grottocenter';
const { AZURE_KEY = '', AZURE_LINK = '' } = process.env;

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_ACCOUNT,
  AZURE_KEY,
);
const blobServiceClient =
  !ramda.isEmpty(AZURE_LINK) &&
  !ramda.isEmpty(AZURE_KEY) &&
  new BlobServiceClient(AZURE_LINK, sharedKeyCredential);

const INVALID_FORMAT = 'INVALID_FORMAT';
const INVALID_NAME = 'INVALID_NAME';
const ERROR_DURING_UPLOAD_TO_AZURE = 'ERROR_DURING_UPLOAD_TO_AZURE';

const generateName = (fileName) => {
  const identifier = Math.random()
    .toString()
    .replace(/0\./, '');
  return `${identifier}-${fileName}`;
};

module.exports = {
  getAzureData: () => ({
    linkAccount: AZURE_LINK,
    container: AZURE_CONTAINER,
  }),

  // File is a multer object : https://github.com/expressjs/multer#file-information
  create: async (file, idDocument, fetchResult = false, isValidated = true) => {
    const name = file.originalname;
    const mimeType = file.mimetype;
    const pathName = generateName(name);
    const nameSplit = name.split('.');
    if (nameSplit.length !== 2) {
      throw Error(INVALID_NAME);
    }
    const extension = nameSplit[1];
    const foundFormat = await TFileFormat.find({
      mimeType: mimeType,
      extension: extension,
    }).limit(1);
    if (ramda.isEmpty(foundFormat)) {
      throw Error(INVALID_FORMAT);
    }

    if (blobServiceClient) {
      const containerClient = blobServiceClient.getContainerClient(
        AZURE_CONTAINER,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(pathName);

      sails.log.info('Uploading ' + name + ' to Azure Blob...');
      try {
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: {
            blobContentType: mimeType,
          },
        });
      } catch (err) {
        throw Error(ERROR_DURING_UPLOAD_TO_AZURE);
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
        return await TFile.create(param).fetch();
      } else {
        return await TFile.create(param);
      }
    } else {
      sails.log(
        `===== FILES UPLOAD AZURE - DEBUG =====
You are seing this message because you didn't configure your Azure credentials locally. In production website, the following file whoud have been uploaded on the azure repository.
      
      FILE NAME : ${name}
      MIME TYPE : ${mimeType}
      SIZE : ${file.size} bytes
      `,
      );
    }
  },

  update: async (file) => {
    return await TFile.updateOne(file.id).set({
      fileName: file.fileName,
    });
  },

  delete: async (file) => {
    const pathName = file.path;

    const containerClient = blobServiceClient.getContainerClient(
      AZURE_CONTAINER,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(pathName);
    await blockBlobClient.delete({
      deleteSnapshots: 'include',
    });

    return await TFile.destroyOne(file.id);
  },
};
