const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');
const MassifService = require('../../../../api/services/MassifService');

describe('Massif features', () => {
  let userToken;
  let testMassifId;
  let testDoc1Id;
  let testDoc2Id;
  let testDescId;
  let testNameId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
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
    }).fetch();
    testNameId = name.id;
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
      };
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

          should(massifUpdated.descriptions).containDeep([{ id: testDescId }]);
          should(massifUpdated.documents).containDeep([
            { id: testDoc1Id },
            { id: testDoc2Id },
          ]);
          should(massifUpdated.geogPolygon).not.be.null();
          should(massifUpdated.names).containDeep([{ id: testNameId }]);
          return done();
        });
    });

    it('should return 400 when polygon area exceeds 8000 km²', (done) => {
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
          should(res.text).match(
            /exceeds the maximum allowed size of 8000 km²/
          );
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
  });
});
