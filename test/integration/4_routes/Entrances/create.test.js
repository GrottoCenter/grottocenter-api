const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Entrance features', () => {
  let userToken;
  let adminToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    adminToken = await AuthTokenService.getRawBearerAllGroupsToken();
  });

  describe('Create', () => {
    describe('Invalid parameters', () => {
      it('should return code 400 when name is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            cave: 1,
            latitude: 45.0,
            longitude: 2.0,
          })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('name');
            return done();
          });
      });

      it('should return code 400 when name text is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            cave: 1,
            name: { language: 'eng' },
            latitude: 45.0,
            longitude: 2.0,
          })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('name');
            return done();
          });
      });

      it('should return code 400 when name language is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            cave: 1,
            name: { text: 'Test Entrance' },
            latitude: 45.0,
            longitude: 2.0,
          })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('name');
            return done();
          });
      });

      it('should return code 400 when cave does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            cave: 999999,
            name: { text: 'Test Entrance', language: 'eng' },
            latitude: 45.0,
            longitude: 2.0,
          })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('cave');
            return done();
          });
      });
    });

    describe('Valid entrance creation', () => {
      const createdEntranceIds = [];

      after(async () => {
        // Clean up all created entrances
        for (const id of createdEntranceIds) {
          // eslint-disable-next-line no-await-in-loop
          await TName.destroy({ entrance: id });
          // eslint-disable-next-line no-await-in-loop
          await TEntrance.destroy({ id });
        }
      });

      it('should return code 200 and create entrance with minimal data', (done) => {
        const entranceData = {
          cave: 1,
          name: { text: 'Test Entrance', language: 'eng' },
          latitude: 45.0,
          longitude: 2.0,
        };

        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(entranceData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: entrance } = res;
              createdEntranceIds.push(entrance.id);

              // Check basic properties (skip @context as it's not always present)
              should(entrance).have.property('id');
              should(entrance).have.property('name');
              should(entrance).have.property('names');
              should(entrance).have.property('cave');
              should(entrance).have.property('author');

              // Check specific values
              should(entrance.cave.id).equal(1);
              should(entrance.name).equal('Test Entrance');
              should(entrance.names[0].name).equal('Test Entrance');
              should(entrance.names[0].language).equal('eng');
              should(parseFloat(entrance.latitude)).equal(45.0);
              should(parseFloat(entrance.longitude)).equal(2.0);
              should(entrance.isOfInterest).equal(false);
              should(entrance.author.id).equal(3); // User token caver ID

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should return code 200 and create entrance with complete data', (done) => {
        const entranceData = {
          cave: 1,
          name: { text: 'Complete Test Entrance', language: 'fra' },
          latitude: 46.0,
          longitude: 3.0,
          altitude: 1200,
          city: 'Test City',
          county: 'Test County',
          region: 'Test Region',
          yearDiscovery: 2020,
          geology: 'Q35758',
        };

        supertest(sails.hooks.http.app)
          .post('/api/v1/entrances')
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(entranceData)
          .end(async (err, res) => {
            if (err) {
              sails.log.error('Request error:', err);
              return done(err);
            }

            try {
              if (res.status !== 200) {
                sails.log.error('Unexpected status:', res.status, res.body);
                return done(new Error(`Expected 200 but got ${res.status}`));
              }

              const { body: entrance } = res;
              createdEntranceIds.push(entrance.id);

              // Check specific values
              should(entrance.name).equal('Complete Test Entrance');
              should(entrance.names[0].language).equal('fra');
              should(entrance.altitude).equal(1200);
              // Note: discoveryYear is stored as yearDiscovery in the database
              should(entrance.yearDiscovery).equal(2020);

              return done();
            } catch (testErr) {
              sails.log.error('Test assertion error:', testErr);
              return done(testErr);
            }
          });
      }).timeout(10000);
    });
  });
});
