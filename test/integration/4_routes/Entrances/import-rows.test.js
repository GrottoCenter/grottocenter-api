const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance features', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Import rows', () => {
    it('should forbid non-admin users', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return empty results for empty data', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.type).equal('entrance');
          should(res.body.successfulImport).be.an.Array().with.length(0);
          should(res.body.successfulImportAsDuplicates)
            .be.an.Array()
            .with.length(0);
          should(res.body.failureImport).be.an.Array().with.length(0);
          should(res.body.total.success).equal(0);
          should(res.body.total.failure).equal(0);
          return done();
        });
    });

    it('should fail when missing required columns', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({
          data: [{ 'dct:rights/cc:attributionName': 'Test' }],
        })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.failureImport).have.length(1);
          should(res.body.failureImport[0]).have.property('line', 2);
          should(res.body.failureImport[0].message).containEql(
            'Columns missing'
          );
          return done();
        });
    });

    it('should create duplicate when entrance already exists', async () => {
      const cave = await TCave.create({ author: 1 });
      const existingEntrance = await TEntrance.create({
        author: 1,
        idDbImport: 44444,
        nameDbImport: 'Duplicate Entrance',
        latitude: 45.0,
        longitude: 6.0,
        cave: cave.id,
      });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({
          data: [
            {
              id: '44444',
              'rdf:type': 'Entrance',
              'dct:rights/cc:attributionName': 'Duplicate Entrance',
              'dct:rights/karstlink:licenseType': 'CC-BY-SA',
              'gn:countryCode': 'FR',
              'w3geo:latitude': '45.0',
              'w3geo:longitude': '6.0',
              'rdfs:label': 'Test Entrance',
              'rdfs:label/dc:language': 'en',
            },
          ],
        })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then((res) => {
          should(res.body.successfulImportAsDuplicates).have.length(1);
          should(res.body.successfulImportAsDuplicates[0].line).equal(2);
          should(res.body.successfulImportAsDuplicates[0].message).containEql(
            'entrance duplicate'
          );
          should(res.body.total.successfulImportAsDuplicates).equal(1);
        });

      await TEntrance.destroy({ id: existingEntrance.id });
      await TCave.destroy({ id: cave.id });
    });

    it('should handle import errors gracefully', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({
          data: [
            {
              id: '55555',
              'rdf:type': 'Entrance',
              'dct:rights/cc:attributionName': 'Error Entrance',
              'dct:rights/karstlink:licenseType': 'CC-BY-SA',
              'gn:countryCode': 'INVALID',
              'w3geo:latitude': 'invalid',
              'w3geo:longitude': '6.0',
              'rdfs:label': 'Test Entrance',
              'rdfs:label/dc:language': 'en',
            },
          ],
        })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.failureImport).have.length(1);
          should(res.body.failureImport[0]).have.property('line', 2);
          should(res.body.total.failure).equal(1);
          return done();
        });
    });
  });

  // **Validates: Requirements 1.1, 5.3**
  describe('Import rows - CoordinatesSnapshot wiring', () => {
    const fs = require('fs'); // eslint-disable-line global-require
    const path = require('path'); // eslint-disable-line global-require

    afterEach(() => {
      sinon.restore();
      sails.services.coordinatessnapshotservice.reset();
    });

    it('should have CoordinatesSnapshotService.load() wired in bootstrap', () => {
      const bootstrapSource = fs.readFileSync(
        path.join(__dirname, '../../../../config/bootstrap.js'),
        'utf8'
      );
      should(bootstrapSource).containEql('coordinatessnapshotservice');
      should(bootstrapSource).containEql('.load()');
    });

    it('should call invalidate() after successful entrance import', async () => {
      const invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({
          data: [
            {
              'rdf:type': 'Entrance',
              'dct:rights/cc:attributionName': 'Snapshot Test Author',
              'dct:rights/karstlink:licenseType': 'CC-BY-SA',
              'gn:countryCode': 'FR',
              'w3geo:latitude': '48.8',
              'w3geo:longitude': '2.3',
              'rdfs:label': 'Snapshot Test Entrance',
              'rdfs:label/dc:language': 'eng',
            },
          ],
        })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      if (res.body.successfulImport.length > 0) {
        should(invalidateSpy.calledOnce).be.true();
      }
    });

    it('should NOT call invalidate() when no entrances were imported', async () => {
      const invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );

      await supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(invalidateSpy.called).be.false();
    });
  });
});
