const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/record/:id endpoint
 * This tests:
 *   - retrieving single records by numeric ID
 *   - proper response structure for existing records
 *   - 404 handling for non-existent records
 *   - record content validation
 */
describe('Bibliographic Metadata Get Record Controller', () => {
  let adminToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return a single record by numeric ID', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/1')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check record structure
        res.body.should.have.property('id', 1);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:1'
        );
        res.body.should.have.property('lastUpdate');
        res.body.should.have.property('listSets');
        res.body.should.have.property('dcTitle', 'Document 1 on sound');
        res.body.should.have.property('dcCreators');
        res.body.should.have.property('dcPublisher', 'Publisher 1');
        res.body.should.have.property('dcDate');
        res.body.should.have.property('dcLanguages');
        res.body.should.have.property('dcDescriptions');
        res.body.should.have.property('dcCoverages');
        res.body.should.have.property('dcSubjects');
        res.body.should.have.property('dcFormats');
        res.body.should.have.property('dcIdentifiers');
        res.body.should.have.property('dcRelations');
        res.body.should.have.property('dcSources');
        res.body.should.have.property('dcRights');
        res.body.should.have.property('dcTypeGrottocenter', 'sound');
        res.body.should.have.property('dcTypeDcmi', 'sound');
        res.body.should.have.property('metadataStatus', 'registered');
        res.body.should.have.property('children');

        // Check array fields are arrays
        res.body.listSets.should.be.an.Array();
        res.body.dcCreators.should.be.an.Array();
        res.body.dcLanguages.should.be.an.Array();
        res.body.dcDescriptions.should.be.an.Array();
        res.body.dcCoverages.should.be.an.Array();
        res.body.dcSubjects.should.be.an.Array();
        res.body.dcFormats.should.be.an.Array();
        res.body.dcIdentifiers.should.be.an.Array();
        res.body.dcRelations.should.be.an.Array();
        res.body.dcSources.should.be.an.Array();
        res.body.dcRights.should.be.an.Array();
        res.body.children.should.be.an.Array();

        // Check specific content
        res.body.listSets.should.containEql('grottocenter');
        res.body.listSets.should.containEql('grottocenter:sound');

        return done();
      });
  });

  it('should return a record with creators', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/2')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 2);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:2'
        );
        res.body.should.have.property('dcTitle', 'Document 2 on image');
        res.body.should.have.property('dcCreators');
        res.body.dcCreators.should.be.an.Array();
        res.body.dcCreators.length.should.be.greaterThan(0);
        res.body.dcCreators.should.containEql('Author 2A');
        res.body.dcCreators.should.containEql('Author 2B');
        res.body.should.have.property('dcTypeGrottocenter', 'image');
        res.body.listSets.should.containEql('grottocenter:image');

        return done();
      });
  });

  it('should return a record with contributor', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/3')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 3);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:3'
        );
        res.body.should.have.property(
          'dcTitle',
          'Document 3 on interactive_resource'
        );
        res.body.should.have.property('dcContributor', 'Contributor 3');
        res.body.should.have.property(
          'dcTypeGrottocenter',
          'interactive_resource'
        );
        res.body.listSets.should.containEql(
          'grottocenter:interactive_resource'
        );
        res.body.should.have.property('children');
        res.body.children.should.be.an.Array();
        res.body.children.should.containEql(4);

        return done();
      });
  });

  it('should return a collection record with children', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/7')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 7);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:7'
        );
        res.body.should.have.property('dcTitle', 'Document 7 on collection');
        res.body.should.have.property('dcTypeGrottocenter', 'collection');
        res.body.should.have.property('dcTypeDcmi', 'collection');
        res.body.listSets.should.containEql('grottocenter:collection');
        res.body.should.have.property('metadataStatus', 'registered');
        res.body.children.should.be.an.Array();
        res.body.children.should.containEql(8);

        return done();
      });
  });

  it('should return a deleted record', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/13')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 13);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:13'
        );
        res.body.should.have.property('dcTitle', 'Document 13 on collection');
        res.body.should.have.property('metadataStatus', 'deleted');
        res.body.should.have.property('dcTypeGrottocenter', 'collection');
        res.body.listSets.should.containEql('grottocenter:collection');
        res.body.children.should.be.an.Array();
        res.body.children.should.containEql(3);
        res.body.children.should.containEql(14);

        return done();
      });
  });

  it('should validate DC metadata fields for a complete record', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/6')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 6);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:6'
        );
        res.body.should.have.property('dcTitle', 'Document 6 on map');

        // Check Dublin Core metadata fields
        res.body.dcCreators.should.be.an.Array();
        res.body.dcCreators.should.containEql('Author 6A');
        res.body.dcCreators.should.containEql('Author 6B');
        res.body.should.have.property('dcContributor', 'Contributor 6');
        res.body.should.have.property('dcPublisher', 'Publisher 6');
        res.body.dcLanguages.should.containEql('fre');
        res.body.dcDescriptions.should.containEql(
          'This is a description of document 6.'
        );
        res.body.dcCoverages.should.containEql('FR-XXX');
        res.body.dcCoverages.should.containEql('FRA');
        res.body.dcSubjects.should.containEql('Subject 2');
        res.body.dcSubjects.should.containEql('Subject 8');
        res.body.dcFormats.should.containEql('pdf');
        res.body.dcFormats.should.containEql('jpg');
        res.body.dcIdentifiers.should.containEql('doi:10.1000/gc6');
        res.body.dcIdentifiers.should.containEql(
          'url:https://grottocenter.org/doc/6.pdf'
        );
        res.body.dcSources.should.containEql(
          'Bulletin Bibliographique Spéléologique / Speleo Abstracts'
        );
        res.body.dcRights.should.containEql('CC0');
        res.body.should.have.property('dcTypeGrottocenter', 'map');
        res.body.should.have.property('dcTypeDcmi', 'image');

        return done();
      });
  });

  it('should return 404 for non-existent record', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/999')
      .set('Authorization', adminToken)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('message');
        res.body.message.should.match(/Record with ID.*not found/);

        return done();
      });
  });

  it('should return 404 for invalid ID', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/invalid')
      .set('Authorization', adminToken)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('message');
        res.body.message.should.match(/Record with ID.*not found/);

        return done();
      });
  });

  it('should handle numeric ID correctly', (done) => {
    // Test with numeric ID (should work without encoding issues)
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/1')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 1);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:1'
        );

        return done();
      });
  });

  it('should return record with multiple languages', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/5')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 5);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:5'
        );
        res.body.dcLanguages.should.be.an.Array();
        res.body.dcLanguages.should.containEql('fre');
        res.body.dcLanguages.should.containEql('eng');

        return done();
      });
  });

  it('should return record with relations', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/8')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 8);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:8'
        );
        res.body.dcRelations.should.be.an.Array();
        res.body.dcRelations.should.containEql('oai:grottocenter.org:7');

        return done();
      });
  });

  it('should return record with null publisher', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/4')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 4);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:4'
        );
        res.body.should.have.property('dcPublisher', null);
        res.body.should.have.property('dcTitle', 'Document 4 on sound');

        return done();
      });
  });

  it('should return dataset record', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/record/11')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('id', 11);
        res.body.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:11'
        );
        res.body.should.have.property('dcTypeGrottocenter', 'dataset');
        res.body.should.have.property('dcTypeDcmi', 'dataset');
        res.body.listSets.should.containEql('grottocenter:dataset');
        res.body.children.should.be.an.Array();
        res.body.children.should.containEql(12);

        return done();
      });
  });
});
