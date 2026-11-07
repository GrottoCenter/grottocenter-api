const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const entranceCreationData = require('./FAKE_DATA');

const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');
const waitForLockWait = require('../../waitForLockWait');

describe('Entrance features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Move to cave', async () => {
    describe('Invalid parameters', () => {
      it('should return code 404 on inexisting entrance', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/entrances/987654321/cave/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/entrances/1/cave/12345678`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Single entrance cave move', () => {
      const entranceId = 12345;
      const initialCaveId = 12345;
      const destinationCaveId = 54321;

      before(async () => {
        await TEntrance.create({
          ...entranceCreationData,
          id: entranceId,
        });
        await TCave.create({ id: initialCaveId });
        await TCave.create({
          id: destinationCaveId,
        });
        await TCave.addToCollection(initialCaveId, 'entrances', [entranceId]);
      });

      after(async () => {
        const cave = await TCave.findOne(initialCaveId);
        should(cave).be.undefined(); // Cave has been deleted (no trigger in test database to prevent deletion)

        // Destroy remaining data
        await TCave.destroyOne(destinationCaveId);
        await TEntrance.destroyOne(entranceId);
      });

      describe('Move entrance from single cave to network', () => {
        it('should return code 200, move the entrance from its single cave to a network', (done) => {
          supertest(sails.hooks.http.app)
            .patch(`/api/v1/entrances/${entranceId}/cave/${destinationCaveId}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              const { body: entranceRes } = res;
              should(entranceRes.cave.id).equal(destinationCaveId);
              return done();
            });
        });
      });
    });

    describe('Move entrance without an initial cave', () => {
      const entranceId = 12346;
      const destinationCaveId = 54322;

      before(async () => {
        await TEntrance.create({
          ...entranceCreationData,
          id: entranceId,
        });
        await TCave.create({ id: destinationCaveId });
      });

      after(async () => {
        await TEntrance.destroyOne(entranceId);
        await TCave.destroyOne(destinationCaveId);
      });

      it('should return code 200 and move the entrance to the cave', async () => {
        const res = await supertest(sails.hooks.http.app)
          .patch(`/api/v1/entrances/${entranceId}/cave/${destinationCaveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        should(res.body.cave.id).equal(destinationCaveId);

        const entrance = await TEntrance.findOne(entranceId);
        should(entrance.cave).equal(destinationCaveId);
        const destinationCave = await TCave.findOne(destinationCaveId);
        should(destinationCave.isDeleted).be.false();
      });
    });

    describe('Move entrance from one network to another one', () => {
      const entranceId = 12345;
      const otherEntrance1Id = 2345;
      const otherEntrance2Id = 3456;
      const otherEntrance3Id = 4567;
      const initialNetworkId = 12345;
      const destinationNetworkId = 54321;

      before(async () => {
        await TEntrance.createEach([
          {
            ...entranceCreationData,
            id: entranceId,
          },
          {
            ...entranceCreationData,
            id: otherEntrance1Id,
          },
          {
            ...entranceCreationData,
            id: otherEntrance2Id,
          },
          {
            ...entranceCreationData,
            id: otherEntrance3Id,
          },
        ]);
        await TCave.create({ id: initialNetworkId });
        await TCave.create({ id: destinationNetworkId });

        // Populate networks
        await TCave.addToCollection(initialNetworkId, 'entrances', [
          entranceId,
          otherEntrance1Id,
        ]);

        await TCave.addToCollection(destinationNetworkId, 'entrances', [
          otherEntrance2Id,
          otherEntrance3Id,
        ]);
      });

      after(async () => {
        const network = await TCave.findOne(initialNetworkId);
        should(network).not.be.undefined();

        // Destroy remaining data
        await TCave.destroyOne(initialNetworkId);
        await TCave.destroyOne(destinationNetworkId);
        await TEntrance.destroyOne(entranceId);
      });

      describe('Move entrance from network to network', () => {
        it('should return code 200, move the entrance from its network to a network', (done) => {
          supertest(sails.hooks.http.app)
            .patch(
              `/api/v1/entrances/${entranceId}/cave/${destinationNetworkId}`
            )
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              const { body: entranceRes } = res;
              should(entranceRes.cave.id).equal(destinationNetworkId);
              return done();
            });
        });
      });
    });

    describe('Scientific data (#1982)', () => {
      const move = (entranceId, caveId) =>
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/entrances/${entranceId}/cave/${caveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

      const created = {
        caves: [],
        entrances: [],
        points: [],
        observations: [],
      };
      const createCave = async () => {
        const cave = await TCave.create({}).fetch();
        created.caves.push(cave.id);
        return cave.id;
      };
      const createEntrance = async (cave) => {
        const entrance = await TEntrance.create({
          ...entranceCreationData,
          cave,
        }).fetch();
        created.entrances.push(entrance.id);
        return entrance.id;
      };
      const createPoint = async (values) => {
        const point = await TPoint.create({
          author: 1,
          label: 'Spring',
          ...values,
        }).fetch();
        created.points.push(point.id);
        return point.id;
      };
      const createObservation = async (values) => {
        const observation = await TObservation.create({
          author: 1,
          observationType: 1,
          observationTypeCode: 'physical_measurements',
          observationDate: new Date('2026-01-01T00:00:00Z'),
          ...values,
        }).fetch();
        created.observations.push(observation.id);
        return observation.id;
      };
      // A cave with one entrance, two points (one soft-deleted), an
      // observation on a point and one recorded on the cave directly.
      const createSourceCave = async () => {
        const caveId = await createCave();
        const entranceId = await createEntrance(caveId);
        const pointId = await createPoint({ cave: caveId });
        const deletedPointId = await createPoint({
          cave: caveId,
          isDeleted: true,
        });
        const onPointId = await createObservation({
          cave: caveId,
          point: pointId,
        });
        const directId = await createObservation({ cave: caveId });
        return {
          caveId,
          entranceId,
          pointIds: [pointId, deletedPointId],
          observationIds: [onPointId, directId],
          pointId,
          onPointId,
        };
      };
      const caveOf = async (model, ids) =>
        (await model.find({ id: ids })).map((r) => r.cave);

      afterEach(async () => {
        sinon.restore();
        await TObservation.destroy({ id: created.observations.splice(0) });
        await TPoint.destroy({ id: created.points.splice(0) });
        await TEntrance.destroy({ id: created.entrances.splice(0) });
        await TCave.destroy({ id: created.caves.splice(0) });
      });

      it('should transfer the scientific data when the last entrance forms a network', async () => {
        const source = await createSourceCave();
        const destinationId = await createCave();
        await createEntrance(destinationId);
        const destinationPointId = await createPoint({
          cave: destinationId,
          label: 'Spring',
        });

        await move(source.entranceId, destinationId).expect(200);

        should(await caveOf(TPoint, source.pointIds)).eql([
          destinationId,
          destinationId,
        ]);
        should(await caveOf(TObservation, source.observationIds)).eql([
          destinationId,
          destinationId,
        ]);
        const onPoint = await TObservation.findOne({ id: source.onPointId });
        should(onPoint.point).equal(source.pointId);
        // Points already on the destination are untouched, not merged
        const destinationPoint = await TPoint.findOne({
          id: destinationPointId,
        });
        should(destinationPoint.cave).equal(destinationId);
        should(destinationPoint.label).equal('Spring');

        const res = await supertest(sails.hooks.http.app)
          .get(`/api/v1/points?caveId=${destinationId}`)
          .set('Authorization', userToken)
          .expect(200);
        should(res.body.points.map((p) => p.id).sort((a, b) => a - b)).eql(
          [source.pointId, destinationPointId].sort((a, b) => a - b)
        );
      });

      it('should transfer the scientific data when the last entrance joins an existing network', async () => {
        const source = await createSourceCave();
        const destinationId = await createCave();
        await createEntrance(destinationId);
        await createEntrance(destinationId);

        await move(source.entranceId, destinationId).expect(200);

        should(await caveOf(TPoint, source.pointIds)).eql([
          destinationId,
          destinationId,
        ]);
        should(await caveOf(TObservation, source.observationIds)).eql([
          destinationId,
          destinationId,
        ]);
        // The test database has no soft-delete trigger: the emptied cave is
        // removed instead of soft-deleted.
        should(await TCave.findOne({ id: source.caveId })).be.undefined();
      });

      it('should leave the scientific data on a source that keeps other entrances', async () => {
        const source = await createSourceCave();
        await createEntrance(source.caveId);
        const destinationId = await createCave();

        await move(source.entranceId, destinationId).expect(200);

        should(await caveOf(TPoint, source.pointIds)).eql([
          source.caveId,
          source.caveId,
        ]);
        should(await caveOf(TObservation, source.observationIds)).eql([
          source.caveId,
          source.caveId,
        ]);
        const sourceCave = await TCave.findOne({ id: source.caveId });
        should(sourceCave.isDeleted).be.false();
      });

      it('should move the scientific data from the cave a concurrent move left the entrance in', async () => {
        const source = await createSourceCave();
        const firstDestinationId = await createCave();
        const secondDestinationId = await createCave();

        let secondMove;
        // A first move of the entrance, from its cave to an empty cave, holds
        // both caves...
        await sails.getDatastore().transaction(async (db) => {
          await CommonService.query(
            'SELECT id FROM t_cave WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
            [[source.caveId, firstDestinationId]],
            db
          );
          await CommonService.query(
            'UPDATE t_entrance SET id_cave = $2 WHERE id = $1',
            [source.entranceId, firstDestinationId],
            db
          );
          await CommonService.query(
            'UPDATE t_point SET id_cave = $2 WHERE id_cave = $1',
            [source.caveId, firstDestinationId],
            db
          );
          await CommonService.query(
            'UPDATE t_observation SET id_cave = $2 WHERE id_cave = $1',
            [source.caveId, firstDestinationId],
            db
          );
          await CommonService.query(
            'UPDATE t_cave SET is_deleted = true, redirect_to = $2 WHERE id = $1',
            [source.caveId, firstDestinationId],
            db
          );
          // ...while a second move of the same entrance still reads it in its
          // original cave, and waits.
          secondMove = move(source.entranceId, secondDestinationId).then(
            (res) => res
          );
          await waitForLockWait();
        });

        const res = await secondMove;
        should(res.status).equal(200);
        should(res.body.cave.id).equal(secondDestinationId);

        // The data follows the entrance from the cave it actually left
        should(await caveOf(TPoint, source.pointIds)).eql([
          secondDestinationId,
          secondDestinationId,
        ]);
        should(await caveOf(TObservation, source.observationIds)).eql([
          secondDestinationId,
          secondDestinationId,
        ]);
        // The test database has no soft-delete trigger: the emptied cave is
        // removed instead of soft-deleted.
        should(await TCave.findOne({ id: firstDestinationId })).be.undefined();
        // The original cave, already deleted by the first move, is left as
        // the first move left it instead of being deleted a second time.
        const original = await TCave.findOne({ id: source.caveId });
        should(original.isDeleted).be.true();
        should(original.redirectTo).equal(firstDestinationId);
      });

      it('should roll the whole move back when it fails', async () => {
        const source = await createSourceCave();
        const destinationId = await createCave();
        const stub = sinon
          .stub(TCave, 'destroyOne')
          .throws(new Error('simulated failure'));

        await move(source.entranceId, destinationId).expect(500);
        should(stub.callCount).equal(1);
        sinon.restore();

        const entrance = await TEntrance.findOne({ id: source.entranceId });
        should(entrance.cave).equal(source.caveId);
        should(await caveOf(TPoint, source.pointIds)).eql([
          source.caveId,
          source.caveId,
        ]);
        should(await caveOf(TObservation, source.observationIds)).eql([
          source.caveId,
          source.caveId,
        ]);
        const sourceCave = await TCave.findOne({ id: source.caveId });
        should(sourceCave.redirectTo).be.null();
      });
    });
  });
});
