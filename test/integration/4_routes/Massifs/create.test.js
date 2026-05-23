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
      it('should return code 400 when polygon area exceeds 35000 km²', (done) => {
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
            should(res.body.code).equal('POLYGON_AREA_EXCEEDED');
            should(res.body.message).match(
              /exceeds the maximum allowed size of 35000 km²/
            );
            return done();
          });
      });
    });

    describe('Shared-edge MultiPolygon (#1606)', () => {
      it('should return 400 with POLYGON_SELF_INTERSECTION for shared-edge MultiPolygon', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Martinique - 1',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonSharedEdgeMultiPolygon,
          })
          .set('Authorization', adminToken)
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

      it('should return 400 with POLYGON_ANTIPODAL_EDGE for 180° edge polygon', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Antipodal Massif',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonAntipodalEdge,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.code).equal('POLYGON_ANTIPODAL_EDGE');
            should(res.body.message).match(/spans exactly 180/);
            return done();
          });
      });
    });

    describe('Self-intersecting polygon', () => {
      it('should return 400 for a self-intersecting polygon', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Self-Intersecting Massif',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonSelfIntersecting,
          })
          .set('Authorization', adminToken)
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
            isSensitive: true,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: massif } = res;
            should(massif.isSensitive).be.true();
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

    describe('Without description', () => {
      let createdMassif;

      after(async () => {
        should(createdMassif).be.not.undefined();
        await TMassif.destroyOne(createdMassif.id);
        await TName.destroy({ massif: createdMassif.id });
      });

      it('should return code 200 when description is omitted', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif Without Description',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonSmall,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: massif } = res;
            should(massif.name).equal('Massif Without Description');
            should(massif.descriptions).be.an.Array();
            should(massif.descriptions.length).equal(0);
            createdMassif = massif;
            return done();
          });
      });
    });

    describe('Partial description', () => {
      it('should return code 400 when description is provided without descriptionTitle', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif Partial',
            description: 'some description',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonSmall,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.text).match(
              /description and descriptionTitle must be provided together/
            );
            return done();
          });
      });

      it('should return code 400 when descriptionTitle is provided without description', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif Partial',
            descriptionTitle: 'some title',
            descriptionAndNameLanguage: { id: 'fra' },
            geogPolygon: massifPolygon.geoJsonSmall,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.text).match(
              /description and descriptionTitle must be provided together/
            );
            return done();
          });
      });
    });
  });
});
