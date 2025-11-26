const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Organization features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
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
    });
  });
});
