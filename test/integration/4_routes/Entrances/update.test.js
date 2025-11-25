const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

const AuthTokenService = require('../../AuthTokenService');
const GeocodingService = require('../../../../api/services/GeocodingService');

describe('Entrance features', () => {
  let allGroupsToken;
  let userToken;
  before(async () => {
    allGroupsToken = await AuthTokenService.getRawBearerAllGroupsToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Update', async () => {
    describe('Invalid entrance id', () => {
      it('should return code 404 on inexisting entrance', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/987654321`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Different updates', () => {
      const entranceId = 1;
      let initialEntrance = {};

      before(async () => {
        initialEntrance = await TEntrance.findOne(entranceId)
          .populate('author')
          .populate('cave')
          .populate('comments')
          .populate('descriptions')
          .populate('documents')
          .populate('geology')
          .populate('histories')
          .populate('locations')
          .populate('names')
          .populate('riggings');
      });

      after(async () => {
        // Reset entrance
        const cleanedData = {
          ...initialEntrance,
          author: initialEntrance.author?.id,
          cave: initialEntrance.cave?.id,
          comments: initialEntrance.comments.map((x) => x.id),
          descriptions: initialEntrance.descriptions.map((x) => x.id),
          documents: initialEntrance.documents.map((x) => x.id),
          histories: initialEntrance.histories.map((x) => x.id),
          names: initialEntrance.names.map((x) => x.id),
          reviewer: initialEntrance.reviewer?.id,
          riggings: initialEntrance.riggings.map((x) => x.id),
          locations: initialEntrance.locations.map((x) => x.id),
        };
        await TEntrance.update(entranceId).set(cleanedData);
      });

      describe('Unmark an entrance as sensitive', () => {
        before(async () => {
          // Ensure entrance is sensitive before tests
          await TEntrance.update(entranceId).set({ isSensitive: true });
        });

        it('should return code 403 on unmarking sensitive entrance by an user', (done) => {
          supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entranceId}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .send({
              isSensitive: false,
            })
            .expect(403, done);
        });
        it('should return code 200 on unmarking sensitive entrance by an admin (which is user too)', (done) => {
          supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entranceId}`)
            .set('Authorization', allGroupsToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .send({
              isSensitive: false,
            })
            .expect(200, done);
        });
      });
      it("should return code 200 on unmarking sensitive entrance (even if it's not sensitive already) by an user", (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            isSensitive: false,
          })
          .expect(200, done);
      });

      it('should return code 200 on basic data update', (done) => {
        const newValues = {
          city: 'new city',
          county: 'new county',
          isSensitive: true,
          region: 'new region',
        };
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(newValues)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: entrance } = res;
            for (const key of Object.keys(newValues)) {
              should(entrance[key]).equal(newValues[key]);
            }
            return done();
          });
      });

      it('should return code 200 on cave update', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            cave: 1,
          })
          .expect(200)
          .end(async (err) => {
            if (err) return done(err);
            const populatedEntrance =
              await TEntrance.findOne(entranceId).populate('cave');
            should(populatedEntrance.cave.id).equal(1);
            return done();
          });
      });

      it('should return code 200 on name update', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            name: {
              text: 'new entrance name',
              language: 'aut',
            },
          })
          .expect(200)
          .end(async (err) => {
            if (err) return done(err);
            const populatedEntrance =
              await TEntrance.findOne(entranceId).populate('names');
            should(populatedEntrance.names[0].name).equal('new entrance name');
            should(populatedEntrance.names[0].language).equal('aut');
            return done();
          });
      });

      it('should update coordinates and trigger reverse geocoding', async function () {
        this.timeout(10000);
        let stub;
        try {
          stub = sinon.stub(GeocodingService, 'reverse').resolves({
            region: 'Test Region',
            county: 'Test County',
            city: 'Test City',
            id_country: 'FR',
            iso_3166_2: 'FR-ARA',
          });

          await supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entranceId}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .send({
              latitude: 45.5,
              longitude: 6.5,
            })
            .expect(200);

          const updatedEntrance = await TEntrance.findOne(entranceId);
          should(updatedEntrance.latitude).be.approximately(45.5, 0.01);
          should(updatedEntrance.longitude).be.approximately(6.5, 0.01);
        } finally {
          if (stub) stub.restore();
        }
      });

      it('should not update coordinates when marking as sensitive by non-admin', async () => {
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .send({
            isSensitive: true,
            latitude: 46.0,
            longitude: 7.0,
          })
          .expect(200);

        const entrance = await TEntrance.findOne(entranceId);
        should(entrance.isSensitive).be.true();
      });
    });
  });
});
