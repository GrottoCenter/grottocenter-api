const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

const AuthTokenService = require('../../AuthTokenService');
const EnrichmentQueueService = require('../../../../api/services/EnrichmentQueueService');

describe('Organization features', () => {
  let userToken;
  let enqueueStub;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    enqueueStub = sinon.stub(EnrichmentQueueService, 'enqueue').resolves();
  });

  after(() => {
    enqueueStub.restore();
  });

  describe('Update', async () => {
    describe('Successfull updates', () => {
      const organizationToUpdate = {
        address: '860 Rue Paul Rimbaud',
        city: 'Montpellier',
        county: 'Héraut',
        customMessage: 'Great city !',
        latitude: 43.62505,
        longitude: 3.862038,
        mail: 'organization@organization.com',
        postalCode: '84000',
        region: 'Occitanie',
        url: 'https://fr.wikipedia.org/wiki/Montpellier',
        yearBirth: 2022,
      };
      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/organizations/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(organizationToUpdate)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            const { body: organization } = res;
            for (const key of Object.keys(organizationToUpdate)) {
              should(organization[key]).equal(organizationToUpdate[key]);
            }

            return done();
          });
      });

      it('should return 200 and trim postalCode with trailing whitespace', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/organizations/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            address: "  Rue de l'Étang  ",
            postalCode: '56220 ',
            url: 'https://example.com',
          })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            const { body: organization } = res;
            should(organization.postalCode).equal('56220');
            should(organization.address).equal("Rue de l'Étang");
            return done();
          });
      });

      it('should return 200 when latitude and longitude are empty strings', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/organizations/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            latitude: '',
            longitude: '',
            url: 'https://example.com',
          })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            const { body: organization } = res;
            should(organization.latitude).equal(null);
            should(organization.longitude).equal(null);
            return done();
          });
      });
    });
  });
});
