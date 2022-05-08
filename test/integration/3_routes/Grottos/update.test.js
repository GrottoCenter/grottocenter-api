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
      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/organizations/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            address: '860 Rue Paul Rimbaud',
            city: 'Montpellier',
            country: { id: 'FR' },
            county: 'Héraut',
            customMessage: 'Great city !',
            latitude: '43.62505 ',
            longitude: '3.862038',

            mail: 'organization@organization.com',
            name: { text: 'Organisation Montpellier', languge: 'fr' },
            postalCode: '84000',
            region: 'Occitanie',
            url: 'https://fr.wikipedia.org/wiki/Montpellier',
            yearBirth: '2022',
          })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            const { body: organization } = res;
            should(organization.address).equal('860 Rue Paul Rimbaud');
            should(organization.city).equal('Montpellier');
            should(organization.county).equal('Héraut');
            should(organization.customMessage).equal('Great city !');
            should(organization.latitude).equal(43.62505);
            should(organization.longitude).equal(3.862038);
            should(organization.postalCode).equal('84000');
            should(organization.region).equal('Occitanie');
            should(organization.url).equal(
              'https://fr.wikipedia.org/wiki/Montpellier'
            );
            return done();
          });
      });
    });
  });
});
