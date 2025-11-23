const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Update with new entities', () => {
    it('should return 404 when entrance does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/999999/new-entities')
        .send({
          entrance: { names: [], descriptions: [] },
          newNames: [],
          newDescriptions: [],
          newLocations: [],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 when entrance is deleted', async () => {
      const deletedEntrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();
      await supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${deletedEntrance.id}/new-entities`)
        .send({
          entrance: { names: [], descriptions: [] },
          newNames: [],
          newDescriptions: [],
          newLocations: [],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);

      // Clean up
      await TEntrance.destroy({ id: deletedEntrance.id });
    });

    it('should update entrance without new entities', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: { names: [], descriptions: [], locations: [] },
          newNames: [],
          newDescriptions: [],
          newLocations: [],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          return done();
        });
    });

    it('should update entrance with new names', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: { names: [], descriptions: [], locations: [] },
          newNames: [{ name: 'New Name', language: 'eng', author: 1 }],
          newDescriptions: [],
          newLocations: [],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          const entrance = await TEntrance.findOne(1).populate('names');
          should(entrance.names.length).be.greaterThan(0);
          return done();
        });
    });

    it('should update entrance with new descriptions', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: { names: [], descriptions: [], locations: [] },
          newNames: [],
          newDescriptions: [
            {
              title: 'New Desc',
              body: 'Test body',
              language: 'eng',
              author: 1,
            },
          ],
          newLocations: [],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          const entrance = await TEntrance.findOne(1).populate('descriptions');
          should(entrance.descriptions.length).be.greaterThan(0);
          return done();
        });
    });

    it('should update entrance with new locations', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: { names: [], descriptions: [], locations: [] },
          newNames: [],
          newDescriptions: [],
          newLocations: [
            { title: 'New Loc', body: 'Test loc', language: 'eng', author: 1 },
          ],
          newRiggings: [],
          newComments: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          const entrance = await TEntrance.findOne(1).populate('locations');
          should(entrance.locations.length).be.greaterThan(0);
          return done();
        });
    });

    it('should update entrance with new comments', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: {
            names: [],
            descriptions: [],
            locations: [],
            comments: [],
          },
          newNames: [],
          newDescriptions: [],
          newLocations: [],
          newRiggings: [],
          newComments: [
            {
              title: 'New Comment',
              body: 'Test comment',
              language: 'eng',
              author: 1,
            },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          const entrance = await TEntrance.findOne(1).populate('comments');
          should(entrance.comments.length).be.greaterThan(0);
          return done();
        });
    });

    it('should update entrance with multiple new entities', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1/new-entities')
        .send({
          entrance: {
            names: [],
            descriptions: [],
            locations: [],
            comments: [],
          },
          newNames: [{ name: 'Multi Name', language: 'fra', author: 1 }],
          newDescriptions: [
            {
              title: 'Multi Desc',
              body: 'Multi body',
              language: 'fra',
              author: 1,
            },
          ],
          newLocations: [
            {
              title: 'Multi Loc',
              body: 'Multi loc',
              language: 'fra',
              author: 1,
            },
          ],
          newRiggings: [],
          newComments: [
            {
              title: 'Multi Comment',
              body: 'Multi comment',
              language: 'fra',
              author: 1,
            },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', 1);
          return done();
        });
    });
  });
});
