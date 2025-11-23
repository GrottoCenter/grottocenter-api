const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Name features', () => {
  let userToken;
  let moderatorToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Update', () => {
    it('should return 404 when name does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/999999')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ name: 'Updated Name' })
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not found');
          return done();
        });
    });

    it('should update name successfully', (done) => {
      const updateData = { name: 'Updated Cave Name' };

      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/7') // Cave name from fixtures
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          try {
            const { body: name } = res;
            should(name.name).equal('Updated Cave Name');
            should(name).have.property('id');
            should(name).have.property('author');
            should(name).have.property('language');

            // Reset the name back to original
            await TName.updateOne({ id: 7 }).set({
              name: 'The cave with name 7',
            });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle empty name parameter', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/8')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          // Should still return the name object even with no updates
          should(res.body).have.property('name');
          return done();
        });
    });

    it('should handle null name parameter', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/9')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ name: null })
        .expect(400, done); // Null name likely causes validation error
    });

    it('should handle string name parameter', (done) => {
      const updateData = { name: 'New Massif Name' };

      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/10')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          try {
            should(res.body.name).equal('New Massif Name');
            // Reset back
            await TName.updateOne({ id: 10 }).set({
              name: 'The massif with name 10',
            });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle special characters in name', (done) => {
      const updateData = { name: "Grotte de l'Ours & Château" };

      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/11')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          try {
            should(res.body.name).equal("Grotte de l'Ours & Château");
            // Reset back
            await TName.updateOne({ id: 11 }).set({
              name: 'The entrance with name 11',
            });
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle very long name', (done) => {
      const longName = 'A'.repeat(500);
      const updateData = { name: longName };

      supertest(sails.hooks.http.app)
        .patch('/api/v1/names/12')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(400, done); // Very long name likely causes validation error
    });
  });
});
