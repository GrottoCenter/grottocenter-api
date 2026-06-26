/* global JOrganizationMassif */
const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif GeoAssociation features', () => {
  let userToken;
  const massifId = 1; // Valid Massif ID
  const validOrganizationId = 1; // Valid org id from fixtures

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('PUT /api/v1/massifs/:id/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${massifId}/organizations/${validOrganizationId}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 404 when organizationId path segment is absent', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${massifId}/organizations/`)
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the massif does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/999999/organizations/${validOrganizationId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 if the organization does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${massifId}/organizations/${9999999}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should link the organization and return 200', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${massifId}/organizations/${validOrganizationId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id', massifId);
            should(res.body).have.property(
              'organizationId',
              validOrganizationId
            );

            const junction = await JOrganizationMassif.findOne({
              massif: massifId,
              grotto: validOrganizationId,
            });
            const junctions = await JOrganizationMassif.find({
              massif: massifId,
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
      const newOrganizationId = 2; // Another valid org
      supertest(sails.hooks.http.app)
        .put(`/api/v1/massifs/${massifId}/organizations/${newOrganizationId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id', massifId);
            should(res.body).have.property('organizationId', newOrganizationId);

            const junction = await JOrganizationMassif.findOne({
              massif: massifId,
              grotto: newOrganizationId,
            });
            const junctions = await JOrganizationMassif.find({
              massif: massifId,
            });
            // Expected count is 2 because:
            // 1 is seeded from fixtures (grotto 1 for massif 1)
            // + 0 from previous test (grotto 1 is an upsert, total remains 1)
            // + 1 from this test (grotto 2 is newly added) = 2 total.
            should(junctions.length).equal(2);
            should(junction.grotto).equal(newOrganizationId);

            return done();
          } catch (e) {
            return done(e);
          }
        });
    });
  });

  describe('DELETE /api/v1/massifs/:id/organizations/:organizationId', () => {
    it('should return 401 if unauthenticated', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/massifs/${massifId}/organizations/${validOrganizationId}`
        )
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 204 on successful removal', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/massifs/${massifId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);
          try {
            const junction = await JOrganizationMassif.findOne({
              massif: massifId,
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
          `/api/v1/massifs/${massifId}/organizations/${validOrganizationId}`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
