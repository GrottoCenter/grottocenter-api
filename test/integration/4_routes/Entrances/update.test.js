const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

const AuthTokenService = require('../../AuthTokenService');
const CountryResolverService = require('../../../../api/services/CountryResolverService');
const EnrichmentQueueService = require('../../../../api/services/EnrichmentQueueService');

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

        // Reset names to original state
        await TName.destroy({ entrance: entranceId });
        for (const name of initialEntrance.names) {
          // eslint-disable-next-line no-await-in-loop
          await TName.create({
            id: name.id,
            name: name.name,
            isMain: name.isMain,
            author: name.author?.id || name.author,
            reviewer: name.reviewer?.id || name.reviewer,
            dateInscription: name.dateInscription,
            dateReviewed: name.dateReviewed,
            language: name.language?.id || name.language,
            entrance: entranceId,
          });
        }
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

      it('should return code 200 on toggling boolean characteristic fields', (done) => {
        const booleanValues = {
          hasBat: true,
          dangerFlooding: true,
          dangerCo2: true,
          dangerRockfall: true,
          dangerPollution: true,
          needCleanGear: true,
          needStayOnTrail: true,
          hasRules: true,
          isTouristic: true,
        };
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entranceId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(booleanValues)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: entrance } = res;
            for (const key of Object.keys(booleanValues)) {
              should(entrance[key]).equal(true);
            }

            // Now toggle them back to false
            const falseValues = {
              hasBat: false,
              dangerFlooding: false,
              dangerCo2: false,
              dangerRockfall: false,
              dangerPollution: false,
              needCleanGear: false,
              needStayOnTrail: false,
              hasRules: false,
              isTouristic: false,
            };
            return supertest(sails.hooks.http.app)
              .put(`/api/v1/entrances/${entranceId}`)
              .set('Authorization', userToken)
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .send(falseValues)
              .expect(200)
              .end((err2, res2) => {
                if (err2) return done(err2);
                const { body: updated } = res2;
                for (const key of Object.keys(falseValues)) {
                  should(updated[key]).equal(false);
                }
                return done();
              });
          });
      }).timeout(10000);

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

      it('should return code 200 on name update', async () => {
        // Ensure entrance 1 has a main name before the test
        await TName.destroy({ entrance: entranceId });
        await TName.create({
          entrance: entranceId,
          name: 'Original Name',
          isMain: true,
          author: 1,
          language: 'eng',
          dateInscription: new Date(),
        });

        return new Promise((resolve, reject) => {
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
              if (err) return reject(err);
              try {
                const populatedEntrance =
                  await TEntrance.findOne(entranceId).populate('names');
                should(populatedEntrance.names[0].name).equal(
                  'new entrance name'
                );
                should(populatedEntrance.names[0].language).equal('aut');
                return resolve();
              } catch (testErr) {
                return reject(testErr);
              }
            });
        });
      }).timeout(10000);

      it('should update coordinates and trigger reverse geocoding', async () => {
        let resolveStub;
        let enqueueStub;
        try {
          resolveStub = sinon
            .stub(CountryResolverService, 'resolve')
            .returns('FR');
          enqueueStub = sinon
            .stub(EnrichmentQueueService, 'enqueue')
            .resolves();

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
          if (resolveStub) resolveStub.restore();
          if (enqueueStub) enqueueStub.restore();
        }
      }).timeout(10000);

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
      }).timeout(10000);

      it('should not change isSensitive when isTouristic is toggled from false to true', async () => {
        const cave = await TCave.create({ author: 1 }).fetch();
        const entrance = await TEntrance.create({
          author: 1,
          latitude: 45.0,
          longitude: 5.0,
          cave: cave.id,
          isSensitive: true,
          isTouristic: false,
        }).fetch();

        try {
          await supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entrance.id}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .send({
              isTouristic: true,
            })
            .expect(200);

          const updated = await TEntrance.findOne(entrance.id);
          should(updated.isSensitive).be.true();
          should(updated.isTouristic).be.true();
        } finally {
          await TEntrance.destroyOne(entrance.id);
          await TCave.destroyOne(cave.id);
        }
      }).timeout(10000);

      it('should not change isSensitive when isTouristic is toggled from true to false', async () => {
        const cave = await TCave.create({ author: 1 }).fetch();
        const entrance = await TEntrance.create({
          author: 1,
          latitude: 45.0,
          longitude: 5.0,
          cave: cave.id,
          isSensitive: false,
          isTouristic: true,
        }).fetch();

        try {
          await supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entrance.id}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .send({
              isTouristic: false,
            })
            .expect(200);

          const updated = await TEntrance.findOne(entrance.id);
          should(updated.isSensitive).be.false();
          should(updated.isTouristic).be.false();
        } finally {
          await TEntrance.destroyOne(entrance.id);
          await TCave.destroyOne(cave.id);
        }
      }).timeout(10000);

      it('should not change isSensitive when isTouristic is toggled on a sensitive touristic entrance', async () => {
        const cave = await TCave.create({ author: 1 }).fetch();
        const entrance = await TEntrance.create({
          author: 1,
          latitude: 45.0,
          longitude: 5.0,
          cave: cave.id,
          isSensitive: true,
          isTouristic: true,
        }).fetch();

        try {
          await supertest(sails.hooks.http.app)
            .put(`/api/v1/entrances/${entrance.id}`)
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .send({
              isTouristic: false,
            })
            .expect(200);

          const updated = await TEntrance.findOne(entrance.id);
          should(updated.isSensitive).be.true();
          should(updated.isTouristic).be.false();
        } finally {
          await TEntrance.destroyOne(entrance.id);
          await TCave.destroyOne(cave.id);
        }
      }).timeout(10000);
    });
  });
});
