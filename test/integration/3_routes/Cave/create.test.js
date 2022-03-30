const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CAVE_PROPERTIES = require('./CAVE_PROPERTIES');
const caveCreationData = require('./FAKE_DATA');

describe('Cave features', () => {
  describe('create', () => {
    let userToken;
    before(async () => {
      sails.log.info('Asking for user auth token...');
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Missing parameters', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/caves')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
      it('should return code 400 on badly formatted name', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/caves')
          .send({
            name: {
              invalidProperty: 'test',
            },
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
      it('should return code 400 on badly formatted descriptions', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/caves')
          .send({
            name: {
              text: 'test',
              language: 'eng',
            },
            descriptions: [
              {
                invalidProperty: 'test',
              },
            ],
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Complete data', () => {
      let createdCave;

      after(async () => {
        // Destroy created data
        should(createdCave).be.not.undefined();
        await TCave.destroyOne(createdCave.id);
        await TDescription.destroy(createdCave.descriptions.map((d) => d.id));
        await TName.destroy(createdCave.names.map((n) => n.id));
      });

      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/caves')
          .send(caveCreationData)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: cave } = res;
            should(cave).have.properties(CAVE_PROPERTIES);
            should(cave.depth).equal(caveCreationData.depth);
            should(cave.documents.length).equal(
              caveCreationData.documents.length,
            );
            should(cave.latitude).equal(caveCreationData.latitude);
            should(cave.length).equal(caveCreationData.length);
            should(cave.longitude).equal(caveCreationData.longitude);
            should(cave.massif).equal(caveCreationData.massif);
            should(cave.temperature).equal(caveCreationData.temperature);

            createdCave = cave;

            return done();
          });
      });
    });
  });
});
