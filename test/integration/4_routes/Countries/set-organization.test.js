/* global JOrganizationCountry */
const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Country GeoAssociation features', () => {
  let userToken;
  let userId;
  const countryId = 'FR';
  const validOrganizationId = 1; // Valid org id from fixtures

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const tokenObj = await AuthTokenService.getUserToken();
    userId = tokenObj.id;
  });

  describe('PUT /api/v1/countries/:id/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/organizations/${validOrganizationId}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 404 when organizationId path segment is absent', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/countries/${countryId}/organizations/`)
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the country does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/countries/XX/organizations/${validOrganizationId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the organization does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/countries/${countryId}/organizations/${9999999}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should link the organization and return 200', (done) => {
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id', countryId);
            should(res.body).have.property(
              'organizationId',
              validOrganizationId
            );

            const junction = await JOrganizationCountry.findOne({
              country: countryId,
              grotto: validOrganizationId,
            });
            const junctions = await JOrganizationCountry.find({
              country: countryId,
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
      const newOrganizationId = 3; // Assuming 3 exists
      supertest(sails.hooks.http.app)
        .put(
          `/api/v1/countries/${countryId}/organizations/${newOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            const junction = await JOrganizationCountry.findOne({
              country: countryId,
              grotto: newOrganizationId,
            });
            const junctions = await JOrganizationCountry.find({
              country: countryId,
            });
            should(res.body).have.property('id', countryId);
            should(res.body).have.property('organizationId', newOrganizationId);
            // Expected count is 3 because:
            // 2 are seeded from fixtures (grotto 1 + grotto 2 for FR)
            // + 0 from previous test (grotto 1 is an upsert, total remains 2)
            // + 1 from this test (grotto 3 is newly added) = 3 total.
            should(junctions.length).equal(3);
            should(junction.grotto).equal(newOrganizationId);
            should(junction.author).equal(userId);
            return done();
          } catch (e) {
            return done(e);
          }
        });
    });
  });

  describe('DELETE /api/v1/countries/:id/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/countries/${countryId}/organizations/${validOrganizationId}`
        )
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 204 on successful removal', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/countries/${countryId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const junction = await JOrganizationCountry.findOne({
              country: countryId,
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
          `/api/v1/countries/${countryId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
