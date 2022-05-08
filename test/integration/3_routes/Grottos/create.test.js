const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization features', () => {
  describe('create', () => {
    let userToken;
    before(async () => {
      sails.log.info('Asking for user auth token...');
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Complete data', () => {
      let createdOrganization;
      after(async () => {
        // Destroy created data
        should(createdOrganization).be.not.undefined();
        await TGrotto.destroyOne(createdOrganization.id);

        await TName.destroy(createdOrganization.names.map((n) => n.id));
      });

      it('should return code 200', (done) => {
        const organizationToCreate = {
          address: '860 Rue Paul Rimbaud',
          city: 'Montpellier',
          country: { id: 'Fr' },
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
        };
        supertest(sails.hooks.http.app)
          .post('/api/v1/organizations')
          .send(organizationToCreate)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
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
            should(organization.yearBirth).equal(2022);

            createdOrganization = organization;

            return done();
          });
      });
    });
  });
});
