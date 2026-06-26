/* global JOrganizationRegion */
const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Region GeoAssociation features', () => {
  let userToken;
  const countryId = 'FR';
  const regionId = '01'; // Ain
  const fullRegionId = `${countryId}-${regionId}`;
  const validOrganizationId = 1; // Valid org id from fixtures

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('PUT /api/v1/countries/:countryId/regions/:regionId/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${validOrganizationId}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 404 when organizationId path segment is absent', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/`
        )
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the region does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/INVALID/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the organization does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${9999999}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should link the organization and return 200', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id', fullRegionId);
            should(res.body).have.property(
              'organizationId',
              validOrganizationId
            );

            const junction = await JOrganizationRegion.findOne({
              region: fullRegionId,
              grotto: validOrganizationId,
            });
            const junctions = await JOrganizationRegion.find({
              region: fullRegionId,
            });
            should(junctions.length).be.greaterThan(0);
            should(junction.grotto).equal(validOrganizationId);

            return done();
          } catch (e) {
            return done(e);
          }
        });
    });

    it('should add the organization without replacing existing ones', (done) => {
      const newOrganizationId = 3; // Another valid org
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${newOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id', fullRegionId);
            should(res.body).have.property('organizationId', newOrganizationId);

            const junction = await JOrganizationRegion.findOne({
              region: fullRegionId,
              grotto: newOrganizationId,
            });
            const junctions = await JOrganizationRegion.find({
              region: fullRegionId,
            });
            // Expected count is 3 because:
            // 2 are seeded from fixtures (for region FR-01)
            // + 0 from previous test (upserting existing association)
            // + 1 from this test (newly added association) = 3 total.
            should(junctions.length).equal(3);
            should(junction.grotto).equal(newOrganizationId);

            return done();
          } catch (e) {
            return done(e);
          }
        });
    });
  });

  describe('DELETE /api/v1/countries/:countryId/regions/:regionId/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${validOrganizationId}`
        )
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 204 on successful removal', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const junction = await JOrganizationRegion.findOne({
              region: fullRegionId,
              grotto: validOrganizationId,
            });
            should.not.exist(junction);
            return done();
          } catch (e) {
            return done(e);
          }
        });
    });

    it('should return 404 if no association exists', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/countries/${countryId}/regions/${regionId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
