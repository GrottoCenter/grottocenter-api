const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');
const MassifService = require('../../../../api/services/MassifService');
const EntranceService = require('../../../../api/services/EntranceService');

describe('Massif features', () => {
  let userToken;
  let adminToken;
  let testMassifId;
  let testDoc1Id;
  let testDoc2Id;
  let testDescId;
  let testNameId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    adminToken = await AuthTokenService.getRawBearerAllGroupsToken();
    const massif = await TMassif.create({ author: 1, reviewer: 2 }).fetch();
    testMassifId = massif.id;
    const doc1 = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
    }).fetch();
    testDoc1Id = doc1.id;
    const doc2 = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
    }).fetch();
    testDoc2Id = doc2.id;
    const desc = await TDescription.create({
      author: 1,
      title: 'Test',
      body: 'Test',
    }).fetch();
    testDescId = desc.id;
    const name = await TName.create({
      name: 'Test',
      language: 'fra',
      massif: massif.id,
      isMain: true,
    }).fetch();
    testNameId = name.id;
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await TMassif.destroy({ id: testMassifId });
    await TDocument.destroy({ id: testDoc1Id });
    await TDocument.destroy({ id: testDoc2Id });
    await TDescription.destroy({ id: testDescId });
    await TName.destroy({ id: testNameId });
  });

  describe('update', () => {
    it('should return 404 ', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/massifs/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200', (done) => {
      const updateData = {
        id: testMassifId,
        descriptions: [testDescId],
        documents: [testDoc1Id, testDoc2Id],
        geogPolygon: massifPolygon.geoJsonSmall,
        names: [testNameId],
        isSensitive: true,
      };
      sinon.stub(EntranceService, 'updateInSearch').resolves();

      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send(updateData)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);

          const massifUpdated = await TMassif.findOne(testMassifId)
            .populate('names')
            .populate('descriptions')
            .populate('documents');
          massifUpdated.caves = await MassifService.getCaves(testMassifId);

          // We check that the update controller doesnt change sensitivity status
          // Sensitivity must only be changed via dedicated /mark-sensitive and /unmark-sensitive endpoints
          should(massifUpdated.isSensitive).be.false();

          should(massifUpdated.descriptions).containDeep([{ id: testDescId }]);
          should(massifUpdated.documents).containDeep([
            { id: testDoc1Id },
            { id: testDoc2Id },
          ]);
          should(massifUpdated.geogPolygon).not.be.null();
          should(massifUpdated.names).containDeep([{ id: testNameId }]);

          // reviewer must be set so the DB trigger classifies subsequent edits as 'update'
          // not 'create' in the recent changes feed (issue #1769)
          const userCaver = await TCaver.findOne({ mail: 'user1@user1.com' });
          should(massifUpdated.reviewer).equal(userCaver.id);

          return done();
        });
    });

    it('should return 400 when polygon area exceeds 35000 km²', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({
          geogPolygon: massifPolygon.geoJsonOversized,
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('POLYGON_AREA_EXCEEDED');
          should(res.body.message).match(
            /exceeds the maximum allowed size of 35000 km²/
          );
          return done();
        });
    });

    it('should return 400 when polygon has invalid geometry (#1606)', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({
          geogPolygon: massifPolygon.geoJsonSharedEdgeMultiPolygon,
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('POLYGON_SELF_INTERSECTION');
          should(res.body.message).match(/edges cross each other/);
          return done();
        });
    });

    it('should return 200 when no geogPolygon is provided', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({
          descriptions: [testDescId],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should update name text via inline name field', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { text: 'Updated Massif Name' } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const updatedName = await TName.findOne({ id: testNameId });
            should(updatedName.name).equal('Updated Massif Name');

            // Reset
            await TName.updateOne({ id: testNameId }).set({ name: 'Test' });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should update name language via inline name field', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { language: 'eng' } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const updatedName = await TName.findOne({ id: testNameId });
            should(updatedName.language).equal('eng');

            // Reset
            await TName.updateOne({ id: testNameId }).set({
              language: 'fra',
            });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should update both name text and language atomically', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { text: 'Le Massif', language: 'fra' } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const updatedName = await TName.findOne({ id: testNameId });
            should(updatedName.name).equal('Le Massif');
            should(updatedName.language).equal('fra');

            // Reset
            await TName.updateOne({ id: testNameId }).set({
              name: 'Test',
              language: 'fra',
            });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should return 400 when name language does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { language: 'zzz' } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when name language is null', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { language: null } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when name text is too long', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ name: { text: 'A'.repeat(500) } })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should strip isSensitiveLocked when sent by a non-admin', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ isSensitiveLocked: true })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          const massif = await TMassif.findOne(testMassifId);
          should(massif.isSensitiveLocked).be.false();
          return done();
        });
    });

    it('should persist isSensitiveLocked when sent by an admin', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${testMassifId}`)
        .send({ isSensitiveLocked: true })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          const massif = await TMassif.findOne(testMassifId);
          should(massif.isSensitiveLocked).be.true();
          // Reset
          await TMassif.updateOne(testMassifId).set({
            isSensitiveLocked: false,
          });
          return done();
        });
    });
  });
});
