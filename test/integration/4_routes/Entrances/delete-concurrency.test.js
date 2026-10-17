const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');

// Two permanent deletes of the same entrance used to interleave: each loaded
// the entrance at its start, then the slower one crashed on the cave the faster
// one had already removed, after applying part of its merge (#1852).
describe('Entrance features', () => {
  describe('Delete - Concurrency', () => {
    let adminToken;
    let EntranceService;
    let NameService;

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      // Required here: the controllers use the modules Sails loaded on lift
      // eslint-disable-next-line global-require
      EntranceService = require('../../../../api/services/EntranceService');
      // eslint-disable-next-line global-require
      NameService = require('../../../../api/services/NameService');
    });

    afterEach(() => sinon.restore());

    const deleteEntrance = (id, query) =>
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${id}?${query}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

    // A soft-deleted entrance, sole entrance of its cave, with a name and a
    // location, each with a history row
    const createDeletedEntrance = async ({ isDeleted = true } = {}) => {
      const cave = await TCave.create({
        author: 1,
        dateInscription: new Date(),
        dateReviewed: new Date(),
      }).fetch();
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '45.1',
        longitude: '6.4',
        dateInscription: new Date(),
        cave: cave.id,
        isDeleted,
      }).fetch();
      const name = await TName.create({
        author: 1,
        name: 'Concurrent entrance',
        entrance: entrance.id,
        language: 'eng',
        isMain: true,
        dateInscription: new Date(),
      }).fetch();
      const location = await TLocation.create({
        author: 1,
        entrance: entrance.id,
        body: 'Location body',
        title: 'Location',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();
      await CommonService.query(
        `INSERT INTO h_name (id, id_author, date_reviewed, date_inscription,
          name, is_main, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old name', true, $2, 'eng')`,
        [name.id, entrance.id]
      );
      await CommonService.query(
        `INSERT INTO h_location (id, id_author, date_reviewed, date_inscription,
          body, title, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old location', 'Old title', $2, 'eng')`,
        [location.id, entrance.id]
      );
      return { cave, entrance, name, location };
    };

    const createTarget = async () => {
      const cave = await TCave.create({
        author: 1,
        dateInscription: new Date(),
        dateReviewed: new Date(),
      }).fetch();
      return TEntrance.create({
        author: 1,
        latitude: '45.2',
        longitude: '6.5',
        dateInscription: new Date(),
        cave: cave.id,
      }).fetch();
    };

    const countRows = async (sql, params) =>
      Number((await CommonService.query(sql, params)).rows[0].count);

    const historyOf = (table, entranceId) =>
      countRows(`SELECT count(*) FROM ${table} WHERE id_entrance = $1`, [
        entranceId,
      ]);

    it('should return 404 without merging when a concurrent request already deleted the entrance', async () => {
      const { cave, entrance } = await createDeletedEntrance();
      const target = await createTarget();
      const staleSnapshot = await EntranceService.getPopulatedEntrance(
        entrance.id
      );

      // The faster request wins
      await deleteEntrance(entrance.id, 'isPermanent=1').expect(200);

      // The slower one still holds the snapshot it loaded before
      const stub = sinon.stub(EntranceService, 'getPopulatedEntrance');
      stub.onFirstCall().resolves(staleSnapshot);
      stub.callThrough();

      await deleteEntrance(
        entrance.id,
        `isPermanent=1&entityId=${target.id}`
      ).expect(404);
      should(stub.callCount).be.above(0);

      should(await TEntrance.findOne(entrance.id)).be.undefined();
      should(await TCave.findOne(cave.id)).be.undefined();
      should(await historyOf('h_name', target.id)).equal(0);
      should(await historyOf('h_location', target.id)).equal(0);
      should(
        await countRows(
          'SELECT count(*) FROM t_entrance WHERE redirect_to = $1',
          [target.id]
        )
      ).equal(0);
    });

    it('should return 409 when the entrance was restored meanwhile', async () => {
      const { entrance } = await createDeletedEntrance({ isDeleted: false });
      const staleSnapshot = {
        ...(await EntranceService.getPopulatedEntrance(entrance.id)),
        isDeleted: true,
      };

      const stub = sinon.stub(EntranceService, 'getPopulatedEntrance');
      stub.onFirstCall().resolves(staleSnapshot);
      stub.callThrough();

      await deleteEntrance(entrance.id, 'isPermanent=1').expect(409);
      should(stub.callCount).be.above(0);

      const kept = await TEntrance.findOne(entrance.id);
      should(kept).not.be.undefined();
      should(kept.isDeleted).be.false();
    });

    it('should let only one of two overlapping permanent deletes succeed', async () => {
      const { cave, entrance, name } = await createDeletedEntrance();
      const target = await createTarget();

      const responses = await Promise.all([
        deleteEntrance(entrance.id, 'isPermanent=1'),
        deleteEntrance(entrance.id, `isPermanent=1&entityId=${target.id}`),
      ]);

      should(responses.map((r) => r.status).sort()).eql([200, 404]);
      should(await TEntrance.findOne(entrance.id)).be.undefined();
      should(await TCave.findOne(cave.id)).be.undefined();

      // The history follows the request that won, never half of each
      const merged = responses[1].status === 200;
      should(await historyOf('h_name', target.id)).equal(merged ? 1 : 0);
      should(await historyOf('h_location', target.id)).equal(merged ? 1 : 0);
      should(
        await countRows('SELECT count(*) FROM h_name WHERE id = $1', [name.id])
      ).equal(1);
    });

    it('should run on its own connection when the pool has no other free one', async () => {
      const { cave, entrance } = await createDeletedEntrance();
      const target = await createTarget();
      const datastore = sails.getDatastore();
      const { max } = datastore.manager.pool.options;

      // Hold every connection but one: the request takes it for its
      // transaction, then must not need another one before committing
      let release;
      const released = new Promise((resolve) => {
        release = resolve;
      });
      const acquired = [];
      // A Waterline deferred only runs once `.then()` is called on it
      const leases = Array.from({ length: max - 1 }, () =>
        datastore
          .leaseConnection(async () => {
            acquired.push(true);
            await released;
          })
          .then(() => {})
      );
      while (acquired.length < max - 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      }

      let status;
      try {
        status = await Promise.race([
          deleteEntrance(
            entrance.id,
            `isPermanent=1&entityId=${target.id}`
          ).then((res) => res.status),
          new Promise((resolve) => {
            setTimeout(() => resolve('stalled'), 5000);
          }),
        ]);
      } finally {
        release();
        await Promise.all(leases);
      }

      should(status).equal(200);
      should(await TEntrance.findOne(entrance.id)).be.undefined();
      should(await TCave.findOne(cave.id)).be.undefined();
      should(await historyOf('h_name', target.id)).equal(1);
    }).timeout(15000);

    it('should roll back every write when the permanent merge fails midway', async () => {
      const { cave, entrance, location } = await createDeletedEntrance();
      const target = await createTarget();
      const stub = sinon
        .stub(NameService, 'permanentDelete')
        .rejects(new Error('Simulated failure'));

      await deleteEntrance(
        entrance.id,
        `isPermanent=1&entityId=${target.id}`
      ).expect(500);
      should(stub.callCount).be.above(0);

      const kept = await TEntrance.findOne(entrance.id);
      should(kept).not.be.undefined();
      should(kept.cave).equal(cave.id);
      should(await TCave.findOne(cave.id)).not.be.undefined();
      should((await TLocation.findOne(location.id)).entrance).equal(
        entrance.id
      );
      should(await historyOf('h_name', entrance.id)).equal(1);
      should(await historyOf('h_location', entrance.id)).equal(1);
      should(await historyOf('h_location', target.id)).equal(0);
    });
  });
});
