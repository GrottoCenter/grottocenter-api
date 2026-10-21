const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const EnrichmentQueueService = require('../../../../api/services/EnrichmentQueueService');

describe('Organization features', () => {
  describe('create', () => {
    let userToken;
    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Complete data', () => {
      let createdOrganization;
      let enqueueStub;

      before(() => {
        enqueueStub = sinon.stub(EnrichmentQueueService, 'enqueue').resolves();
      });

      after(async () => {
        enqueueStub.restore();
        // Destroy created data
        should(createdOrganization).be.not.undefined();
        await TGrotto.destroyOne(createdOrganization.id);
        await TName.destroy({ grotto: createdOrganization.id });
      });

      it('should return code 200', (done) => {
        const organizationToCreate = {
          address: '860 Rue Paul Rimbaud',
          city: 'Montpellier',
          county: 'Héraut',
          customMessage: 'Great city !',
          latitude: 43.62505,
          longitude: 3.862038,
          mail: 'organization@organization.com',
          name: { text: 'Organisation Montpellier', language: 'fr' },
          postalCode: '84000',
          region: 'Occitanie',
          type: 'SPELEOLOGY',
          url: 'https://fr.wikipedia.org/wiki/Montpellier',
          yearBirth: 2022,
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
            for (const key of Object.keys(organizationToCreate)) {
              if (key === 'name') {
                should(organization[key]).equal(organizationToCreate[key].text);
              } else {
                should(organization[key]).equal(organizationToCreate[key]);
              }
            }

            createdOrganization = organization;

            return done();
          });
      }).timeout(4000);
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1806
    describe('Type', () => {
      const createdIds = [];

      after(async () => {
        await TName.destroy({ grotto: createdIds });
        await TGrotto.destroy({ id: createdIds });
      });

      const postOrganization = (body, query = {}) =>
        supertest(sails.hooks.http.app)
          .post('/api/v1/organizations')
          .query(query)
          .send({
            name: { text: 'Organisation typée', language: 'fr' },
            ...body,
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

      // Rejected before any write: no organization may be created untyped
      const shouldBeRejected = async (body, query, message) => {
        const countBefore = await TGrotto.count();
        const res = await postOrganization(body, query).expect(400);
        should(res.body.message).containEql(message);
        should(await TGrotto.count()).equal(countBefore);
      };

      it('should return 400 when the type is absent', async () => {
        await shouldBeRejected(
          {},
          {},
          'You must provide the organization type'
        );
      });

      it('should read the type from the request body only', async () => {
        // A type in the query string is not the documented contract
        await shouldBeRejected(
          {},
          { type: 'LIBRARY' },
          'You must provide the organization type'
        );
      });

      it('should store the type given', async () => {
        const res = await postOrganization({ type: 'LIBRARY' }).expect(200);
        createdIds.push(res.body.id);
        should(res.body.type).equal('LIBRARY');
        const stored = await TGrotto.findOne({ id: res.body.id });
        should(stored.type).equal('LIBRARY');
      });

      // https://github.com/GrottoCenter/grottocenter-api/issues/1923
      it('should create an organization typed OTHER', async () => {
        const res = await postOrganization({ type: 'OTHER' }).expect(200);
        createdIds.push(res.body.id);
        should(res.body.type).equal('OTHER');
        const stored = await TGrotto.findOne({ id: res.body.id });
        should(stored.type).equal('OTHER');
      });

      it('should return 400 for an unknown type', async () => {
        await shouldBeRejected(
          { type: 'FAN_CLUB' },
          {},
          'Invalid organization type'
        );
      });

      it('should return 400 for a null type', async () => {
        await shouldBeRejected({ type: null }, {}, 'Invalid organization type');
      });
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1774
    describe('Invalid data', () => {
      it('should return 400 when postalCode is too long', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/organizations')
          .send({
            name: { text: 'Organisation Flémalle', language: 'fr' },
            postalCode: '4400 Flémalle',
            type: 'SPELEOLOGY',
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('Postal code');
            return done();
          });
      });
    });
  });
});
