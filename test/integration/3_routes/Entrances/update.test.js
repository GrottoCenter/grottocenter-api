const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Entrance features', () => {
  let adminToken;
  let userToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
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
        };
        await TEntrance.update(entranceId).set(cleanedData);
      });

      describe('Unmark an entrance as sensitive', () => {
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
        it('should return code 200 on unmarking sensitive entrance by an admin', (done) => {
          supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entranceId}`)
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .send({
              isSensitive: false,
            })
            .expect(403, done);
        });
      });

      it('should return code 200 on basic data update', (done) => {
        const newValues = {
          address: 'new address',
          city: 'new city',
          county: 'new county',
          externalUrl: 'https://new.entrance.com',
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
            const populatedEntrance = await TEntrance.findOne(
              entranceId
            ).populate('cave');
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
            const populatedEntrance = await TEntrance.findOne(
              entranceId
            ).populate('names');
            should(populatedEntrance.names[0].name).equal('new entrance name');
            should(populatedEntrance.names[0].language).equal('aut');
            return done();
          });
      });
    });
  });
});
