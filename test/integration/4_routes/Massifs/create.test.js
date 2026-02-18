const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');

describe('Massif features', () => {
  describe('create', () => {
    let adminToken;
    let testDoc1Id;
    let testDoc2Id;

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
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
    });

    after(async () => {
      await TDocument.destroy({ id: testDoc1Id });
      await TDocument.destroy({ id: testDoc2Id });
    });

    describe('Missing parameters', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({})
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Oversized polygon', () => {
      it('should return code 400 when polygon area exceeds 8000 km²', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Oversized Massif',
            description: 'too large',
            descriptionTitle: 'Title',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonOversized,
          })
          .set('Authorization', adminToken)
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
    });

    describe('Complete data', () => {
      let createdMassif;

      after(async () => {
        // Destroy created data
        should(createdMassif).be.not.undefined();
        await TMassif.destroyOne(createdMassif.id);
        await TDescription.destroy(createdMassif.descriptions.map((d) => d.id));
        await TName.destroy({ massif: createdMassif.id });
      });

      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif 1',
            description: 'description du massif',
            descriptionTitle: 'Titre',
            descriptionAndNameLanguage: { id: 'fra' },
            documents: [testDoc1Id, testDoc2Id],
            geogPolygon: massifPolygon.geoJsonSmall,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: massif } = res;
            should(massif.name).equal('Massif 1');
            should(massif.descriptions.length).equal(1);
            should(massif.descriptions).containDeep([
              {
                title: 'Titre',
                body: 'description du massif',
                language: 'fra',
              },
            ]);
            should(massif.documents.length).equal(2);
            should(massif.documents).containDeep([
              { id: testDoc1Id },
              { id: testDoc2Id },
            ]);
            should(massif.geogPolygon).equal(
              massifPolygon.geoJsonSmallToString
            );
            createdMassif = massif;
            return done();
          });
      });
    });
  });
});
