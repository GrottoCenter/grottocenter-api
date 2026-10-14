const should = require('should');
const sinon = require('sinon');
const Documents = require('typesense/lib/Typesense/Documents').default;
const typesense = require('../../../config/typesense');

describe('config/typesense', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('deleteDocuments()', () => {
    it('removes a batch of ids in one request', async () => {
      const deleteStub = sinon
        .stub(Documents.prototype, 'delete')
        .resolves({ num_deleted: 2 });

      await typesense.deleteDocuments('devices', [3, 424242]);

      should(deleteStub.args).eql([[{ filter_by: 'id:[3,424242]' }]]);
    });

    // A caller that retries must not race a removal still in flight
    it('sends each batch once the previous one is done, and stops at a failure', async () => {
      const ids = Array.from({ length: 600 }, (_, i) => 100001 + i);
      let inFlight = 0;
      let maxInFlight = 0;
      const deleteStub = sinon
        .stub(Documents.prototype, 'delete')
        .callsFake(async () => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => {
            setTimeout(resolve, 10);
          });
          inFlight -= 1;
          if (deleteStub.callCount === 2) throw new Error('Delete failed');
          return { num_deleted: 0 };
        });

      await typesense
        .deleteDocuments('persons', ids)
        .should.be.rejectedWith('Delete failed');

      should(maxInFlight).equal(1);
      should(deleteStub.callCount).equal(2);
      should(inFlight).equal(0);
    });

    it('sends no request without ids', async () => {
      const deleteStub = sinon.stub(Documents.prototype, 'delete');
      await typesense.deleteDocuments('devices', []);
      should(deleteStub.called).be.false();
    });
  });

  describe('exportIds()', () => {
    it('reads the ids of the exported documents', async () => {
      const exportStub = sinon
        .stub(Documents.prototype, 'export')
        .resolves('{"id":"3"}\n{"id":"12"}\n');

      should(await typesense.exportIds('caves')).eql([3, 12]);
      should(exportStub.args).eql([[{ include_fields: 'id' }]]);
    });

    it('returns no id for an empty collection', async () => {
      sinon.stub(Documents.prototype, 'export').resolves('');
      should(await typesense.exportIds('caves')).eql([]);
    });
  });
});
