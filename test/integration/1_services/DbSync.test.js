const should = require('should');
const sinon = require('sinon');
const stream = require('stream');
const CommonService = require('../../../api/services/CommonService');
const FileService = require('../../../api/services/FileService');
const typesense = require('../../../config/typesense');
const { makeDbSync } = require('../../../api/dbSync/dbSync');

describe('DbSync', () => {
  describe('makeDbSync with file export enabled', () => {
    let queryStub;
    let uploadStub;
    let setMetadataStub;
    let createCollectionStub;
    let switchAliasStub;
    let importDocumentsStub;
    let isCredentialsOriginal;

    before(() => {
      isCredentialsOriginal = FileService.isCredentials;
    });

    beforeEach(() => {
      // Stub CommonService.query to return empty results (no rows to process)
      queryStub = sinon.stub(CommonService, 'query').resolves({
        rowCount: 0,
        rows: [],
      });

      // Stub FileService credentials and upload
      FileService.isCredentials = true;
      uploadStub = sinon
        .stub(FileService.dbExport, 'upload')
        .returns(new stream.PassThrough());
      setMetadataStub = sinon
        .stub(FileService.dbExport, 'setMetadata')
        .resolves();

      // Stub typesense operations
      createCollectionStub = sinon
        .stub(typesense, 'createTimestampedCollection')
        .resolves('test-collection');
      importDocumentsStub = sinon.stub(typesense, 'importDocuments').resolves();
      switchAliasStub = sinon
        .stub(typesense, 'switchCollectionAlias')
        .resolves();
    });

    afterEach(() => {
      sinon.restore();
      FileService.isCredentials = isCredentialsOriginal;
    });

    it('should create a zip archive and upload it', async () => {
      await makeDbSync(true);

      should(uploadStub.calledOnce).be.true();
      should(uploadStub.firstCall.args[0]).equal('grottocenterDbExport.zip');
      should(uploadStub.firstCall.args[1]).equal('application/zip');
      should(setMetadataStub.calledOnce).be.true();

      // setMetadata receives archive size (a number)
      const archiveSize = setMetadataStub.firstCall.args[0];
      should(archiveSize).be.a.Number();
    });

    it('should process all entity collections', async () => {
      await makeDbSync(true);

      // 7 collections (massif, entrance, cave, document, organization, person, device)
      // Each gets at least one query call
      should(queryStub.callCount).be.aboveOrEqual(7);
    });

    it('should create typesense collections for entities with search config', async () => {
      await makeDbSync(true);

      // All 7 entities have search config
      should(createCollectionStub.callCount).equal(7);
      should(switchAliasStub.callCount).equal(7);
      // importDocuments is not called when query returns 0 rows
      should(importDocumentsStub.called).be.false();
    });
  });

  describe('makeDbSync with file export disabled', () => {
    let queryStub;
    let uploadStub;
    let setMetadataStub;
    let isCredentialsOriginal;

    before(() => {
      isCredentialsOriginal = FileService.isCredentials;
    });

    beforeEach(() => {
      queryStub = sinon.stub(CommonService, 'query').resolves({
        rowCount: 0,
        rows: [],
      });

      FileService.isCredentials = true;
      uploadStub = sinon
        .stub(FileService.dbExport, 'upload')
        .returns(new stream.PassThrough());
      setMetadataStub = sinon
        .stub(FileService.dbExport, 'setMetadata')
        .resolves();

      sinon
        .stub(typesense, 'createTimestampedCollection')
        .resolves('test-collection');
      sinon.stub(typesense, 'importDocuments').resolves();
      sinon.stub(typesense, 'switchCollectionAlias').resolves();
    });

    afterEach(() => {
      sinon.restore();
      FileService.isCredentials = isCredentialsOriginal;
    });

    it('should skip file export when isFileExportEnabled is false', async () => {
      await makeDbSync(false);

      should(uploadStub.called).be.false();
      should(setMetadataStub.called).be.false();
    });

    it('should abort when no Azure credentials are available', async () => {
      FileService.isCredentials = false;

      await makeDbSync(true);

      should(uploadStub.called).be.false();
      should(queryStub.called).be.false();
    });
  });
});
