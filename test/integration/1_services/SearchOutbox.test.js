const should = require('should');
const sinon = require('sinon');
// Required at load time, together: the module holds these copies, and the ones
// Sails re-requires when it lifts are different objects
const CommonService = require('../../../api/services/CommonService');
const SearchService = require('../../../api/services/SearchService');
const typesense = require('../../../config/typesense');
const { expand, drain } = require('../../../api/dbSync/searchOutbox');

const clearOutbox = () => CommonService.query('DELETE FROM t_search_outbox');

const readOutbox = async () => {
  const { rows } = await CommonService.query(
    `SELECT kind, id_entity AS "entityId", operation, old_values AS "oldValues"
     FROM t_search_outbox ORDER BY id`
  );
  return rows;
};

const enqueue = (kind, entityId, operation = 'U', oldValues = {}) =>
  CommonService.query(
    `INSERT INTO t_search_outbox (kind, id_entity, operation, old_values)
     VALUES ($1, $2, $3, $4)`,
    [kind, entityId, operation, oldValues]
  );

// The non-empty target lists, sorted
const lists = (targets) =>
  Object.fromEntries(
    Object.entries(targets)
      .filter(([, ids]) => ids.size > 0)
      .map(([collection, ids]) => [collection, [...ids].sort((a, b) => a - b)])
  );

const row = (kind, entityId, oldValues = {}, operation = 'U') => ({
  kind,
  entityId,
  operation,
  oldValues: operation === 'I' ? null : oldValues,
});

// Fixtures: entrances 1, 2 are in cave 1, 3 in cave 2, 4 and 5 in cave 3, 7 in
// cave 5, which has no name row and goes by the name of entrance 7. Massif 1
// contains entrances 1, 2, 4, 5, 7, 8 and is linked to document 1. Document 6
// is about cave 1; documents 2 and 3 are children of 1, document 4 of 3.
describe('searchOutbox', () => {
  beforeEach(clearOutbox);

  describe('triggers', () => {
    it('records the previous value of the fan-out columns an update changed', async () => {
      // The point is computed from the coordinates
      await CommonService.query(
        'UPDATE t_entrance SET longitude = 5 WHERE id = 3'
      );
      await CommonService.query(
        'UPDATE t_entrance SET longitude = -3 WHERE id = 3'
      );

      const [moved] = await readOutbox();
      should(moved).containDeep({
        kind: 'entrance',
        entityId: 3,
        operation: 'U',
      });
      should(Object.keys(moved.oldValues)).eql(['point_geom']);
      should(moved.oldValues.point_geom.coordinates).eql([-3, -1]);
    });

    it('enqueues an update that changes no fan-out column, without old values', async () => {
      await CommonService.query(
        'UPDATE t_entrance SET altitude = 1234 WHERE id = 3'
      );
      await CommonService.query(
        'UPDATE t_entrance SET altitude = NULL WHERE id = 3'
      );

      const rows = await readOutbox();
      should(rows).have.length(2);
      should(rows[0]).eql({
        kind: 'entrance',
        entityId: 3,
        operation: 'U',
        oldValues: {},
      });
    });

    it('enqueues nothing for an update that changes nothing', async () => {
      await CommonService.query(
        'UPDATE t_entrance SET altitude = altitude WHERE id = 3'
      );
      should(await readOutbox()).eql([]);
    });

    it('records no old values on insert, and every fan-out column on delete', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        cave: 3,
        latitude: 45,
        longitude: 6,
      }).fetch();
      await CommonService.query('DELETE FROM t_entrance WHERE id = $1', [
        entrance.id,
      ]);

      const [inserted, deleted] = await readOutbox();
      should(inserted).eql({
        kind: 'entrance',
        entityId: entrance.id,
        operation: 'I',
        oldValues: null,
      });
      should(deleted).containDeep({
        kind: 'entrance',
        entityId: entrance.id,
        operation: 'D',
        oldValues: { id_cave: 3, is_deleted: false, redirect_to: null },
      });
      should(deleted.oldValues.point_geom.coordinates).eql([6, 45]);
    });

    it('enqueues a caver only for the columns search reads', async () => {
      await CommonService.query(
        'UPDATE t_caver SET last_failed_login_at = now() WHERE id = 5'
      );
      should(await readOutbox()).eql([]);

      await CommonService.query(
        "UPDATE t_caver SET nickname = 'Renamed' WHERE id = 5"
      );
      await CommonService.query(
        "UPDATE t_caver SET nickname = 'Author1', last_failed_login_at = NULL WHERE id = 5"
      );

      const [renamed] = await readOutbox();
      should(renamed).eql({
        kind: 'caver',
        entityId: 5,
        operation: 'U',
        oldValues: { nickname: 'Author1' },
      });
    });

    it('ignores a pending modification of a document', async () => {
      await CommonService.query(
        `UPDATE t_document SET modified_doc_json = '{"pages": "12"}' WHERE id = 5`
      );
      await CommonService.query(
        'UPDATE t_document SET modified_doc_json = NULL WHERE id = 5'
      );
      should(await readOutbox()).eql([]);
    });

    it('enqueues the entity a name belonged to and the one it belongs to', async () => {
      const name = await TName.create({
        author: 1,
        entrance: 3,
        name: 'Moving name',
        language: 'fra',
        isMain: false,
      }).fetch();
      try {
        await clearOutbox();
        await CommonService.query(
          'UPDATE t_name SET id_entrance = 4 WHERE id = $1',
          [name.id]
        );

        const rows = await readOutbox();
        should(rows.map((r) => [r.kind, r.entityId]).sort()).eql([
          ['entrance_name', 3],
          ['entrance_name', 4],
        ]);
      } finally {
        await TName.destroyOne({ id: name.id });
      }
    });

    it('enqueues the document of a link', async () => {
      await CommonService.query(
        'INSERT INTO j_document_massif (id_document, id_massif) VALUES (5, 2)'
      );
      await CommonService.query(
        'DELETE FROM j_document_massif WHERE id_document = 5 AND id_massif = 2'
      );

      const rows = await readOutbox();
      should(rows.map((r) => [r.kind, r.entityId, r.operation])).eql([
        ['documents', 5, 'I'],
        ['documents', 5, 'D'],
      ]);
    });

    it('records the soft delete of an organization as an update', async () => {
      const organization = await TGrotto.create({ author: 1 }).fetch();
      await clearOutbox();
      // t_grotto soft-deletes on a first DELETE, and deletes on the second
      await CommonService.query('DELETE FROM t_grotto WHERE id = $1', [
        organization.id,
      ]);
      await CommonService.query('DELETE FROM t_grotto WHERE id = $1', [
        organization.id,
      ]);

      const [softDeleted, deleted] = await readOutbox();
      should(softDeleted).eql({
        kind: 'organization',
        entityId: organization.id,
        operation: 'U',
        oldValues: { is_deleted: false },
      });
      should(deleted.operation).equal('D');
    });
  });

  describe('expand()', () => {
    it('re-indexes the old and the new cave of an entrance that moved', async () => {
      const targets = await expand([row('entrance', 2, { id_cave: 2 })]);
      // Both caves have a name of their own: their dependents are unchanged
      should(lists(targets)).eql({ caves: [1, 2], entrances: [2] });
    });

    it('re-indexes the massifs an entrance left and entered', async () => {
      // Entrance 3 is in no massif; its old point was in massif 1
      const targets = await expand([
        row('entrance', 3, {
          point_geom: { type: 'Point', coordinates: [78.5, 62.8] },
        }),
      ]);
      should(lists(targets)).eql({ massifs: [1], entrances: [3] });
    });

    it('fans a deleted entrance out from its old values', async () => {
      const targets = await expand([
        row(
          'entrance',
          424242,
          {
            id_cave: 3,
            point_geom: { type: 'Point', coordinates: [73.4, 61.2] },
            is_deleted: false,
            redirect_to: null,
          },
          'D'
        ),
      ]);
      should(lists(targets)).eql({
        caves: [3],
        massifs: [1],
        entrances: [424242],
      });
    });

    it('re-indexes only the entrance when no fan-out column changed', async () => {
      const targets = await expand([row('entrance', 4)]);
      should(lists(targets)).eql({ entrances: [4] });
    });

    it('re-indexes the dependents of a cave named after the renamed entrance', async () => {
      await CommonService.query(
        'UPDATE t_document SET id_cave = 5 WHERE id = 5'
      );
      try {
        const targets = await expand([row('entrance_name', 7)]);
        should(lists(targets)).eql({
          caves: [5],
          entrances: [7],
          documents: [5],
        });
      } finally {
        await CommonService.query(
          'UPDATE t_document SET id_cave = NULL WHERE id = 5'
        );
      }
    });

    it('leaves the dependents of a cave with its own name alone', async () => {
      // Entrance 2 is in cave 1, which document 6 is about
      const targets = await expand([row('entrance_name', 2)]);
      should(lists(targets)).eql({ caves: [1], entrances: [2] });
    });

    it('re-indexes the entrances of a changed cave, not its documents', async () => {
      const targets = await expand([row('cave', 1)]);
      should(lists(targets)).eql({ caves: [1], entrances: [1, 2] });
    });

    it('re-indexes the documents of a cave deleted or restored', async () => {
      const targets = await expand([row('cave', 1, { is_deleted: false })]);
      should(lists(targets)).eql({
        caves: [1],
        entrances: [1, 2],
        documents: [6],
      });
    });

    // Merges are not flattened on soft delete: mergedTwice -> merged -> 1
    describe('merged cave', () => {
      let merged;
      let mergedTwice;

      before(async () => {
        merged = await TCave.create({
          author: 1,
          isDeleted: true,
          redirectTo: 1,
        }).fetch();
        mergedTwice = await TCave.create({
          author: 1,
          isDeleted: true,
          redirectTo: merged.id,
        }).fetch();
        await CommonService.query(
          'UPDATE t_document SET id_cave = $1 WHERE id = 4',
          [merged.id]
        );
        await CommonService.query(
          'UPDATE t_document SET id_cave = $1 WHERE id = 5',
          [mergedTwice.id]
        );
      });

      after(async () => {
        await CommonService.query(
          'UPDATE t_document SET id_cave = NULL WHERE id = ANY($1::int[])',
          [[4, 5]]
        );
        await TCave.destroy({ id: [merged.id, mergedTwice.id] });
      });

      it('re-indexes the documents of the caves merged into a renamed one, however indirectly', async () => {
        const targets = await expand([row('cave_name', 1)]);
        should(lists(targets).documents).eql([4, 5, 6]);
      });
    });

    it('re-indexes the entrances inside the old and the new polygon of a massif', async () => {
      const {
        rows: [{ polygon }],
      } = await CommonService.query(
        "SELECT to_jsonb(m) ->> 'geog_polygon' AS polygon FROM t_massif m WHERE id = 1"
      );
      // Massif 2 contains no entrance; its old polygon was the one of massif 1
      const targets = await expand([
        row('massif', 2, { geog_polygon: polygon }),
      ]);
      should(lists(targets)).eql({
        massifs: [2],
        entrances: [1, 2, 4, 5, 7, 8],
      });
    });

    it('re-indexes the entrances and documents of a renamed massif', async () => {
      const targets = await expand([row('massif_name', 1)]);
      should(lists(targets)).eql({
        massifs: [1],
        entrances: [1, 2, 4, 5, 7, 8],
        documents: [1],
      });
    });

    it('re-indexes the documents of an organization deleted or restored', async () => {
      // Document 1 has organization 1 as author
      should(
        lists(await expand([row('organization', 1, { is_deleted: false })]))
      ).eql({ organizations: [1], documents: [1] });
      should(lists(await expand([row('organization', 1)]))).eql({
        organizations: [1],
      });
    });

    it('re-indexes what a caver authored when their nickname changes', async () => {
      // Caver 5 created entrances 4 and 5; caver 6 co-authored documents 1, 2, 4
      const targets = await expand([
        row('caver', 5, { nickname: 'Old' }),
        row('caver', 6, { nickname: 'Old' }),
      ]);
      should(lists(targets)).eql({
        persons: [5, 6],
        entrances: [4, 5],
        documents: [1, 2, 4],
      });
    });

    it('re-indexes only the person for another caver change', async () => {
      should(lists(await expand([row('caver', 5)]))).eql({ persons: [5] });
    });

    it('re-indexes the children of a document', async () => {
      should(lists(await expand([row('document', 1)]))).eql({
        documents: [1, 2, 3],
      });
    });

    it('re-indexes a single document for a direct kind', async () => {
      const targets = await expand([
        row('devices', 3),
        row('entrances', 6, null, 'I'),
        row('documents', 4),
        row('organizations', 2),
      ]);
      should(lists(targets)).eql({
        devices: [3],
        entrances: [6],
        documents: [4],
        organizations: [2],
      });
    });

    it('skips an unknown kind', async () => {
      should(lists(await expand([row('unknown', 1)]))).eql({});
    });
  });

  describe('drain()', () => {
    let syncStub;
    let clock;

    // The collection and ids of each sync, without its options
    const syncedChunks = () => syncStub.args.map((args) => args.slice(0, 2));

    beforeEach(() => {
      syncStub = sinon.stub(SearchService, 'syncDocuments').resolves();
      // Only Date: the database driver still needs real timers
      clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('re-indexes the expanded targets and empties the outbox', async () => {
      await enqueue('document', 3);
      await enqueue('devices', 1, 'I', null);

      should(await drain()).equal(2);

      should(syncedChunks()).eql([
        ['documents', [3, 4]],
        ['devices', [1]],
      ]);
      should(await readOutbox()).eql([]);
    });

    it('keeps the rows when the sync fails', async () => {
      syncStub.rejects(new Error('Typesense unreachable'));
      await enqueue('devices', 1);

      await drain().should.be.rejectedWith('Typesense unreachable');

      should(await readOutbox()).have.length(1);
    });

    it('processes the outbox one batch after the other', async () => {
      await enqueue('devices', 1);
      await enqueue('devices', 2);
      await enqueue('devices', 3);

      should(await drain({ batchSize: 2 })).equal(3);

      should(syncedChunks()).eql([
        ['devices', [1, 2]],
        ['devices', [3]],
      ]);
      should(await readOutbox()).eql([]);
    });

    it('stops between batches once its time budget is spent', async () => {
      await enqueue('devices', 1);
      await enqueue('devices', 2);
      // The first batch spends the budget
      syncStub.callsFake(async () => clock.tick(2000));

      should(await drain({ batchSize: 1, timeBudgetMs: 1000 })).equal(1);

      should(syncStub.callCount).equal(1);
      should(await readOutbox()).have.length(1);
    });

    // One batch, two collections: two sync chunks
    it('keeps a batch whose fan-out outlasts the time budget', async () => {
      await enqueue('devices', 1);
      await enqueue('entrances', 2);
      syncStub.callsFake(async () => clock.tick(2000));

      should(await drain({ timeBudgetMs: 1000 })).equal(0);

      should(syncedChunks()).eql([['entrances', [2]]]);
      should(await readOutbox()).have.length(2);
    });

    it('stops and keeps the batch when the job is aborted mid-fan-out', async () => {
      await enqueue('devices', 1);
      await enqueue('entrances', 2);
      const controller = new AbortController();
      syncStub.callsFake(async () => controller.abort(new Error('expired')));

      await drain({ signal: controller.signal }).should.be.rejectedWith(
        'expired'
      );

      should(syncStub.callCount).equal(1);
      should(await readOutbox()).have.length(2);
    });

    it('keeps the batch when the job is aborted during its last sync', async () => {
      await enqueue('devices', 1);
      const controller = new AbortController();
      syncStub.callsFake(async () => controller.abort(new Error('expired')));

      await drain({ signal: controller.signal }).should.be.rejectedWith(
        'expired'
      );

      should(await readOutbox()).have.length(1);
    });

    // Device 1 is live, device 2 soft-deleted: one chunk imports, then removes
    it('keeps the batch and starts no removal when aborted during the import', async () => {
      syncStub.restore();
      const controller = new AbortController();
      const importStub = sinon
        .stub(typesense, 'importDocuments')
        .callsFake(async () => controller.abort(new Error('expired')));
      const deleteStub = sinon.stub(typesense, 'deleteDocument').resolves();
      await enqueue('devices', 1);
      await enqueue('devices', 2);

      await drain({ signal: controller.signal }).should.be.rejectedWith(
        'expired'
      );

      should(importStub.callCount).equal(1);
      should(deleteStub.called).be.false();
      should(await readOutbox()).have.length(2);
    });

    it('waits for the removals under way when aborted during them', async () => {
      syncStub.restore();
      const controller = new AbortController();
      sinon.stub(typesense, 'importDocuments').resolves();
      let finishRemoval;
      sinon.stub(typesense, 'deleteDocument').callsFake(
        () =>
          new Promise((resolve) => {
            controller.abort(new Error('expired'));
            finishRemoval = resolve;
          })
      );
      await enqueue('devices', 1);
      await enqueue('devices', 2);

      let settled = false;
      const draining = drain({ signal: controller.signal }).finally(() => {
        settled = true;
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      should(settled).be.false();

      finishRemoval();
      await draining.should.be.rejectedWith('expired');
      should(await readOutbox()).have.length(2);
    });

    it('does nothing on an empty outbox', async () => {
      should(await drain()).equal(0);
      should(syncStub.called).be.false();
    });
  });
});
