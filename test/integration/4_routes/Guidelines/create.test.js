const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline create', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('create', () => {
    it('should return 400 when missing mandatory fields', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({ title: 'New Guideline' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when title is empty or only whitespace', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: '   ',
          countries: ['FR'],
          language: 'fra',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when title exceeds 150 chars', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: 'a'.repeat(151),
          countries: ['FR'],
          language: 'fra',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when description exceeds 500 chars', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: 'Title',
          description: 'a'.repeat(501),
          countries: ['FR'],
          language: 'fra',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when no entity is specified', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: 'Title',
          language: 'fra',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when language is invalid', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: 'Title',
          countries: ['FR'],
          language: 'xyz',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 404 when target entity does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send({
          title: 'Title',
          countries: ['XX'],
          language: 'fra',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(404, done);
    });

    it('should successfully create guideline and snapshot', async () => {
      const payload = {
        title: 'Valid Country Guideline',
        description: 'Under 500 chars',
        countries: ['FR'],
        language: 'fra',
      };

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines')
        .send(payload)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(200);

      const guideline = res.body;
      should(guideline.title).equal(payload.title);
      should(guideline.countries).containEql('FR');

      // Verify history snapshot
      const snapshot = await HGuideline.findOne({ t_id: guideline.id });
      should(snapshot).not.be.undefined();
      should(snapshot.title).equal(payload.title);
    });
  });
});
