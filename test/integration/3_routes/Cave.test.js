let supertest = require('supertest');
let should = require('should');
const AuthTokenService = require('../AuthTokenService');

const CAVE_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'author',
  'dateInscription',
  'dateReviewed',
  'depth',
  'descriptions',
  'documents',
  'entrances',
  'histories',
  'isDeleted',
  'isDiving',
  'length',
  'name',
  'names',
  'temperature',
];

describe('Cave features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: cave } = res;
          should(cave).have.properties(CAVE_PROPERTIES);
          should(cave.name).not.be.empty();
          should(cave.names).not.be.empty();
          should(cave.author).not.be.empty();
          return done();
        });
    });
  });
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: caves } = res;
          caves.forEach((cave) => {
            should(cave).have.properties(CAVE_PROPERTIES);
            should(cave.name).not.be.empty();
            should(cave.names).not.be.empty();
            should(cave.author).not.be.empty();
          });
          return done();
        });
    });
  });

  describe('create', () => {
    const caveCreationData = {
      depth: 42,
      descriptions: [
        {
          body: 'There are many rocks.',
          language: 'eng',
          title: 'Geology',
        },
        { body: "It's wet", language: 'eng', title: 'Hydrology' },
        {
          body: 'Very beautiful',
          language: 'eng',
          title: 'First gallery',
        },
      ],
      documents: [1, 2],
      isDiving: true,
      latitude: 22.440979208779,
      length: 530,
      longitude: -83.980479240417,
      massif: 1,
      name: { text: 'La Cavité XYZ', language: 'eng' },
      temperature: 8.36,
    };

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

            return done();
          });
      });
    });
  });
});
