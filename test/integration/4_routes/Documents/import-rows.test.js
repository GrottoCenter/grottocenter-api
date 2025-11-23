const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document import-rows', () => {
  let adminToken;
  let userToken;
  let testAuthorId;
  let testLicenseId;
  let testTypeId;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    const author = await TCaver.findOne({ id: 1 });
    testAuthorId = author.id;

    const license = await TLicense.findOne({ name: 'CC-BY-SA' });
    testLicenseId = license.id;

    const type = await TType.findOne({ name: 'Article' });
    testTypeId = type.id;
  });

  describe('Import rows', () => {
    it('should forbid non-admin users', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/import-rows')
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
        .post('/api/v1/documents/import-rows')
        .send({ data: [] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.type).equal('document');
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
        .post('/api/v1/documents/import-rows')
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

    it('should create duplicate when document already exists', async () => {
      const existingDoc = await TDocument.create({
        author: testAuthorId,
        type: testTypeId,
        license: testLicenseId,
        idDbImport: 55555,
        nameDbImport: 'Duplicate Source',
      });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/documents/import-rows')
        .send({
          data: [
            {
              id: '55555',
              'rdf:type': 'Document',
              'dct:rights/cc:attributionName': 'Duplicate Source',
              'dct:rights/karstlink:licenseType': 'CC-BY-SA',
              'gn:countryCode': 'FR',
              'rdfs:label': 'Test Title',
              'dct:creator': 'Test Author',
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
            'document duplicate'
          );
          should(res.body.total.successfulImportAsDuplicates).equal(1);
        });

      await TDocument.destroy({ id: existingDoc.id });
    });

    it('should handle import errors gracefully', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/import-rows')
        .send({
          data: [
            {
              id: '66666',
              'rdf:type': 'Document',
              'dct:rights/cc:attributionName': 'Error Source',
              'dct:rights/karstlink:licenseType': 'INVALID_LICENSE',
              'gn:countryCode': 'FR',
              'rdfs:label': 'Test Title',
              'dct:creator': 'Test Author',
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
});
