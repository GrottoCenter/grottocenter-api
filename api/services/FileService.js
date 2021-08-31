const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob');

const AZURE_CONTAINER = 'documents';
const AZURE_ACCOUNT = 'grottocenter';

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_ACCOUNT,
  process.env.AZURE_KEY,
);
const blobServiceClient = new BlobServiceClient(
  process.env.AZURE_LINK,
  sharedKeyCredential,
);

const INVALID_FORMAT = 'INVALID_FORMAT';

const generateName = (fileName) => {
  const identifier = Math.random()
    .toString()
    .replace(/0\./, '');
  return `${identifier}-${fileName}`;
};

module.exports = {
  getAzureData: () => ({
    linkAccount: process.env.AZURE_LINK,
    container: AZURE_CONTAINER,
  }),

  // File is a multer object : https://github.com/expressjs/multer#file-information
  create: async (file, idDocument, fetchResult = false, isValidated = true) => {
    const name = file.originalname;
    const mimeType = file.mimetype;
    const pathName = generateName(name);

    const containerClient = blobServiceClient.getContainerClient(
      AZURE_CONTAINER,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(pathName);

    const foundFormat = await TFileFormat.findOne({ mimeType: mimeType });
    if (!foundFormat) {
      throw Error(INVALID_FORMAT);
    }

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    const param = {
      dateInscription: new Date(),
      fileName: name,
      document: idDocument,
      fileFormat: foundFormat.id,
      path: pathName,
      isValidated,
    };
    if (fetchResult) {
      return await TFile.create(param).fetch();
    } else {
      return await TFile.create(param);
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
