const should = require('should');
const sinon = require('sinon');
// Required at load time, together: dbSync is not a Sails service, and the
// copies Sails re-requires when it lifts are not the ones it holds
const FileService = require('../../../api/services/FileService');
const typesense = require('../../../config/typesense');
const { makeDbSync } = require('../../../api/dbSync/dbSync');

describe('DbSync', () => {
  describe('makeDbSync()', () => {
    let uploadStub;
    let setMetadataStub;
    let createCollectionStub;
    let switchAliasStub;
    let importDocumentsStub;

    beforeEach(() => {
      uploadStub = sinon.stub(FileService.dbExport, 'upload');
      setMetadataStub = sinon.stub(FileService.dbExport, 'setMetadata');

      createCollectionStub = sinon
        .stub(typesense, 'createTimestampedCollection')
        .callsFake(async (schema) => `${schema.name}_test`);
      importDocumentsStub = sinon.stub(typesense, 'importDocuments').resolves();
      switchAliasStub = sinon
        .stub(typesense, 'switchCollectionAlias')
        .resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('rebuilds and switches the search collection of every entity', async () => {
      await makeDbSync();

      const names = [
        'massifs',
        'entrances',
        'caves',
        'documents',
        'organizations',
        'persons',
        'devices',
      ];
      should(createCollectionStub.getCalls().map((c) => c.args[0].name)).eql(
        names
      );
      should(switchAliasStub.getCalls().map((c) => c.args[0])).eql(names);
    });

    it('imports the fixture rows into the timestamped collections', async () => {
      await makeDbSync();

      const imported = {};
      for (const call of importDocumentsStub.getCalls()) {
        const [collectionName, documents] = call.args;
        imported[collectionName] = (imported[collectionName] ?? []).concat(
          documents.map((d) => d.id)
        );
      }
      should(imported.entrances_test.sort((a, b) => a - b)).eql([
        1, 2, 3, 4, 5, 6, 7, 8, 999,
      ]);
    });

    it('no longer writes the file export', async () => {
      await makeDbSync();

      should(uploadStub.called).be.false();
      should(setMetadataStub.called).be.false();
    });

    it('keeps syncing the other collections when an import fails', async () => {
      importDocumentsStub.rejects(
        Object.assign(new Error('import failed'), { importResults: [] })
      );

      await makeDbSync();

      // Every collection with rows fails, none hangs, none is switched
      should(createCollectionStub.callCount).equal(7);
      should(switchAliasStub.called).be.false();
    });
  });
});
