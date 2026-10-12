const should = require('should');
// Required at load time, together: dbSync is not a Sails service, and the
// copies Sails re-requires when it lifts are not the ones it holds
const CommonService = require('../../../api/services/CommonService');
const syncUtils = require('../../../api/dbSync/utils');
const {
  getEntity,
  normalizeIds,
  buildDocuments,
  planSync,
} = require('../../../api/dbSync/searchDocuments');

const COLLECTIONS = [
  'organizations',
  'persons',
  'massifs',
  'entrances',
  'caves',
  'documents',
  'devices',
];

// What the full rebuild builds for a collection
const rebuild = async (collectionName) => {
  const entity = getEntity(collectionName);
  const documents = [];
  const pages = syncUtils.paggingQuery(entity.name, entity.query);
  for await (const row of entity.processRows(pages)) documents.push(row);
  return documents;
};

describe('searchDocuments', () => {
  describe('normalizeIds()', () => {
    it('keeps each positive integer once, numeric strings included', () => {
      should(normalizeIds([3, '3', '12', 1, 3])).eql([3, 12, 1]);
    });

    it('drops what is not a positive integer id', () => {
      should(normalizeIds([0, -1, 1.5, 'abc', null, undefined, 4])).eql([4]);
    });

    it('returns no id for a missing list', () => {
      should(normalizeIds(undefined)).eql([]);
      should(normalizeIds(null)).eql([]);
    });
  });

  describe('getEntity()', () => {
    it('finds the entity of every search collection', () => {
      for (const collectionName of COLLECTIONS) {
        should(getEntity(collectionName).search.schema.name).equal(
          collectionName
        );
      }
    });

    it('throws on an unknown collection', () => {
      should(() => getEntity('unknown')).throw(
        'Unknown search collection unknown'
      );
    });
  });

  describe('buildDocuments()', () => {
    // Same ids as the rebuild, so both run the same joins on the same rows
    for (const collectionName of COLLECTIONS) {
      it(`builds the same ${collectionName} documents as the full rebuild`, async () => {
        const expected = await rebuild(collectionName);
        should(expected).not.be.empty();

        const documents = await buildDocuments(
          collectionName,
          expected.map((d) => d.id)
        );

        should(documents).eql(expected);
      });
    }

    it('builds only the requested ids', async () => {
      const documents = await buildDocuments('entrances', [7, 2]);
      should(documents.map((d) => d.id)).eql([2, 7]);
    });

    it('accepts string and duplicated ids', async () => {
      const documents = await buildDocuments('caves', ['1', 1, '2']);
      should(documents.map((d) => d.id)).eql([1, 2]);
    });

    it('hides the coordinates of a sensitive entrance', async () => {
      // Entrance 6 is the sensitive fixture
      const [sensitive] = await buildDocuments('entrances', [6]);
      should(sensitive.isSensitive).be.true();
      should(sensitive.latitude).be.null();
      should(sensitive.longitude).be.null();

      const [visible] = await buildDocuments('entrances', [1]);
      should(visible.isSensitive).be.false();
      should(visible.latitude).be.a.Number();
      should(visible.longitude).be.a.Number();
    });

    it('leaves out a soft-deleted device', async () => {
      // Device 2 is the soft-deleted fixture
      const documents = await buildDocuments('devices', [1, 2, 3]);
      should(documents.map((d) => d.id)).eql([1, 3]);
    });

    it('leaves out the ids that do not exist', async () => {
      const documents = await buildDocuments('entrances', [424242, 1]);
      should(documents.map((d) => d.id)).eql([1]);
    });

    it('returns no document without ids', async () => {
      should(await buildDocuments('entrances', [])).eql([]);
      should(await buildDocuments('entrances', ['abc'])).eql([]);
    });

    it('throws on an unknown collection', async () => {
      await buildDocuments('unknown', [1]).should.be.rejectedWith(
        'Unknown search collection unknown'
      );
    });
  });

  describe('planSync()', () => {
    afterEach(async () => {
      await CommonService.query(
        'UPDATE t_document SET is_validated = true, is_deleted = false WHERE id = ANY($1::int[])',
        [[2, 3]]
      );
    });

    it('upserts the indexed ids and removes the missing ones', async () => {
      const { documents, removedIds } = await planSync('entrances', [
        '1',
        424242,
      ]);
      should(documents.map((d) => d.id)).eql([1]);
      should(removedIds).eql([424242]);
    });

    it('removes a soft-deleted device', async () => {
      const { documents, removedIds } = await planSync('devices', [2]);
      should(documents).eql([]);
      should(removedIds).eql([2]);
    });

    it('keeps a document pending re-validation in the index', async () => {
      await CommonService.query(
        'UPDATE t_document SET is_validated = false WHERE id = 2'
      );

      const { documents, removedIds } = await planSync('documents', [2, 4]);

      should(documents.map((d) => d.id)).eql([4]);
      should(removedIds).eql([]);
    });

    it('removes a soft-deleted document, validated or not', async () => {
      await CommonService.query(
        'UPDATE t_document SET is_deleted = true WHERE id = 2'
      );
      await CommonService.query(
        'UPDATE t_document SET is_deleted = true, is_validated = false WHERE id = 3'
      );

      const { documents, removedIds } = await planSync('documents', [2, 3]);

      should(documents).eql([]);
      should(removedIds).eql([2, 3]);
    });

    it('removes an unknown document', async () => {
      const { removedIds } = await planSync('documents', [424242]);
      should(removedIds).eql([424242]);
    });

    it('plans nothing without ids', async () => {
      should(await planSync('caves', [])).eql({
        documents: [],
        removedIds: [],
      });
    });
  });
});
