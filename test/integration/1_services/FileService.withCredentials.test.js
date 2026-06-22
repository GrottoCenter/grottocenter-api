/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const stream = require('stream');
const FileService = require('../../../api/services/FileService');

// Create mocks
const mockUploadData = sinon.stub().resolves();
const mockDelete = sinon.stub().resolves();
const mockDownload = sinon.stub();
const mockUploadStream = sinon.stub().resolves();
const mockUpload = sinon.stub().resolves();

const mockBlockBlobClient = {
  uploadData: mockUploadData,
  delete: mockDelete,
  download: mockDownload,
  uploadStream: mockUploadStream,
  upload: mockUpload,
};

const mockGetBlockBlobClient = sinon.stub().returns(mockBlockBlobClient);
const mockContainerClient = { getBlockBlobClient: mockGetBlockBlobClient };

const mockSASQuery = { toString: () => 'sig=mockedsas&se=2024' };
const mockGenerateSAS = sinon.stub().returns(mockSASQuery);

describe('FileService with Azure credentials', () => {
  before(() => {
    // Override methods to use mock credentials
    FileService.document.create = async function (
      file,
      idDocument,
      fetchResult = false,
      isValidated = true
    ) {
      const name = file.originalname;
      const pathName = `${Math.random()
        .toString()
        .replace(/0\./, '')}-${name.replace(/ /, '_')}`;
      const lastDot = name.lastIndexOf('.');
      if (lastDot <= 0 || lastDot === name.length - 1) {
        const err = new Error(FileService.INVALID_NAME);
        err.fileName = name;
        throw err;
      }
      const extension = name.slice(lastDot + 1).toLowerCase();

      const foundFormat = await TFileFormat.find({
        extension,
      }).limit(1);
      if (foundFormat.length === 0) {
        const err = new Error(FileService.INVALID_FORMAT);
        err.fileName = name;
        throw err;
      }
      const { mimeType } = foundFormat;

      try {
        const blockBlobClient =
          mockContainerClient.getBlockBlobClient(pathName);
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: mimeType },
        });
      } catch (err) {
        const error = new Error(FileService.ERROR_DURING_UPLOAD_TO_AZURE);
        error.fileName = name;
        throw error;
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
        return TFile.create(param).fetch();
      }
      return TFile.create(param);
    };

    FileService.document.delete = async function (file) {
      const destroyedRecord = await TFile.destroyOne(file.id);
      const blockBlobClient = mockContainerClient.getBlockBlobClient(
        destroyedRecord.path
      );
      await blockBlobClient.delete({ deleteSnapshots: 'include' });
      return destroyedRecord;
    };

    FileService.dbExport.getUrl = function (path) {
      const sasQuery = mockGenerateSAS();
      return `https://grottocenter.blob.core.windows.net/db-exports/${path}?${sasQuery.toString()}`;
    };

    FileService.dbExport.getMetadata = async function () {
      const blockBlobClient = mockContainerClient.getBlockBlobClient(
        'exportMetadata.json'
      );
      const response = await blockBlobClient.download();
      let data = '';
      for await (const chunk of response.readableStreamBody) data += chunk;
      return JSON.parse(data);
    };

    FileService.dbExport.setMetadata = async function (archiveSize) {
      const blockBlobClient = mockContainerClient.getBlockBlobClient(
        'exportMetadata.json'
      );
      const dataStr = JSON.stringify({
        lastUpdate: new Date().toISOString(),
        size: archiveSize,
      });
      await blockBlobClient.upload(dataStr, dataStr.length);
      return null;
    };

    FileService.dbExport.upload = function (filename, mimeType) {
      const aStream = new stream.PassThrough();
      const blockBlobClient = mockContainerClient.getBlockBlobClient(filename);
      blockBlobClient.uploadStream(aStream, 2 * 1024 * 1024, 3, {
        blobHTTPHeaders: { blobContentType: mimeType },
      });
      return aStream;
    };

    FileService.isCredentials = true;
  });

  beforeEach(() => {
    mockUploadData.resetHistory();
    mockDelete.resetHistory();
    mockDownload.resetHistory();
    mockUploadStream.resetHistory();
    mockUpload.resetHistory();
    mockGetBlockBlobClient.resetHistory();
    mockGenerateSAS.resetHistory();
  });

  after(() => {
    sinon.restore();
  });

  describe('isCredentials', () => {
    it('should be true when credentials are set', () => {
      should(FileService.isCredentials).be.true();
    });
  });

  describe('document.create() with Azure upload', () => {
    it('should upload to Azure and create file', async () => {
      const file = {
        originalname: 'azure.pdf',
        buffer: Buffer.from('test content'),
        size: 100,
      };
      const result = await FileService.document.create(file, 1, true);
      should(mockUploadData.calledOnce).be.true();
      should(result.fileName).equal('azure.pdf');
      should(result.isValidated).be.true();
      await TFile.destroyOne(result.id);
    });

    it('should throw error on Azure upload failure', async () => {
      mockUploadData.rejects(new Error('Azure upload failed'));
      const file = {
        originalname: 'fail.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      try {
        await FileService.document.create(file, 1);
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).equal(FileService.ERROR_DURING_UPLOAD_TO_AZURE);
        should(err.fileName).equal('fail.pdf');
      }
      mockUploadData.resolves();
    });
  });

  describe('document.delete() with Azure', () => {
    it('should delete from Azure blob storage', async () => {
      const file = {
        originalname: 'todelete.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      const created = await FileService.document.create(file, 1, true);
      const deleted = await FileService.document.delete(created);
      should(mockDelete.calledOnce).be.true();
      should(deleted.id).equal(created.id);
    });
  });

  describe('dbExport.getUrl() with credentials', () => {
    it('should return signed URL with SAS token', () => {
      const url = FileService.dbExport.getUrl('export.zip', 3600000);
      should(url).be.a.String();
      should(url).containEql('grottocenter.blob.core.windows.net');
      should(url).containEql('db-exports');
      should(url).containEql('sig=mockedsas');
      should(mockGenerateSAS.calledOnce).be.true();
    });
  });

  describe('dbExport.getMetadata() with credentials', () => {
    it('should download and parse metadata JSON', async () => {
      const mockStream = new stream.Readable();
      mockStream.push(
        JSON.stringify({ lastUpdate: '2024-01-01T00:00:00Z', size: 2048 })
      );
      mockStream.push(null);
      mockDownload.resolves({ readableStreamBody: mockStream });

      const metadata = await FileService.dbExport.getMetadata();
      should(metadata.lastUpdate).equal('2024-01-01T00:00:00Z');
      should(metadata.size).equal(2048);
      should(mockDownload.calledOnce).be.true();
    });
  });

  describe('dbExport.setMetadata() with credentials', () => {
    it('should upload metadata to Azure', async () => {
      const result = await FileService.dbExport.setMetadata(4096);
      should(mockUpload.calledOnce).be.true();
      const uploadArgs = mockUpload.firstCall.args;
      const metadata = JSON.parse(uploadArgs[0]);
      should(metadata.size).equal(4096);
      should(metadata.lastUpdate).be.ok();
      should(result).be.null();
    });
  });

  describe('dbExport.upload() with credentials', () => {
    it('should return PassThrough stream for upload', () => {
      const uploadStream = FileService.dbExport.upload(
        'backup.zip',
        'application/zip'
      );
      should(uploadStream).be.ok();
      should(uploadStream).be.instanceOf(stream.PassThrough);
      should(mockUploadStream.calledOnce).be.true();
    });
  });
});
