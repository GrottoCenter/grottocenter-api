const supertest = require('supertest');
const should = require('should');
const entranceCreationData = require('./FAKE_DATA');

const AuthTokenService = require('../../AuthTokenService');

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
  });
});
