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

      it('should update name text via inline name field', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { text: 'Updated Org Name' } })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              const { body: organization } = res;
              should(organization.name).equal('Updated Org Name');

              // Reset
              await TName.updateOne({ id: 1 }).set({
                name: 'Organization 1',
              });
              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update name language via inline name field', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { language: 'eng' } })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              const { body: organization } = res;
              should(organization.language).equal('eng');

              // Reset
              await TName.updateOne({ id: 1 }).set({ language: 'fra' });
              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update both name text and language atomically', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { text: 'The Organization', language: 'eng' } })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              const { body: organization } = res;
              should(organization.name).equal('The Organization');
              should(organization.language).equal('eng');

              // Reset
              await TName.updateOne({ id: 1 }).set({
                name: 'Organization 1',
                language: 'fra',
              });
              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should return 400 when name language does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { language: 'zzz' } })
          .expect(400, done);
      });

      it('should return 400 when name language is null', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { language: null } })
          .expect(400, done);
      });

      it('should return 400 when name text is too long', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ name: { text: 'A'.repeat(500) } })
          .expect(400, done);
      });

      // https://github.com/GrottoCenter/grottocenter-api/issues/1774
      it('should return 400 when postalCode is too long', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ postalCode: '4400 Flémalle' })
          .expect(400)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              should(res.body.message).containEql('Postal code');
              // Nothing must have been persisted
              const organization = await TGrotto.findOne({ id: 1 });
              should(organization.postalCode).not.equal('4400 Flémalle');
              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should return 200 when postalCode is exactly 10 characters', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/organizations/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ postalCode: '1234567890' })
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.postalCode).equal('1234567890');
            return done();
          });
      });
    });
  });
});
