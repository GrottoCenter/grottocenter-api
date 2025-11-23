const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Location features', () => {
  let userToken;
  let moderatorToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Update', () => {
    describe('Invalid parameters', () => {
      it('should return 404 when location does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/locations/999999')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            title: 'Updated Title',
          })
          .expect(404)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body.message).containEql('not found');
            return done();
          });
      });

      it('should return 404 when location is deleted', async () => {
        // Create a deleted location
        const deletedLocation = await TLocation.create({
          author: 1,
          title: 'Deleted Location',
          body: 'This will be deleted',
          language: 'eng',
          entrance: 1,
          isDeleted: true,
        }).fetch();

        const res = await supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${deletedLocation.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            title: 'Updated Title',
          })
          .expect(404);

        should(res.body.message).containEql('not found');

        // Clean up
        await TLocation.destroy({ id: deletedLocation.id });
      });
    });

    describe('Valid updates', () => {
      let testLocation;

      beforeEach(async () => {
        // Create a test location
        testLocation = await TLocation.create({
          author: 1,
          title: 'Original Location Title',
          body: 'Original location body content',
          language: 'eng',
          entrance: 1,
        }).fetch();
      });

      afterEach(async () => {
        // Clean up
        if (testLocation) {
          await TLocation.destroy({ id: testLocation.id });
        }
      });

      it('should update location title only', (done) => {
        const updateData = {
          title: 'Updated Location Title',
        };

        supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${testLocation.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: location } = res;

              // Check updated values
              should(location.title).equal('Updated Location Title');
              should(location.body).equal('Original location body content'); // Should remain unchanged
              should(location.language).equal('eng'); // Should remain unchanged
              should(location.reviewer.id).equal(3); // User token caver ID

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update location body only', (done) => {
        const updateData = {
          body: 'Updated location body content with more details about the location',
        };

        supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${testLocation.id}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: location } = res;

              // Check updated values
              should(location.title).equal('Original Location Title'); // Should remain unchanged
              should(location.body).equal(
                'Updated location body content with more details about the location'
              );
              should(location.language).equal('eng'); // Should remain unchanged

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update location language only', (done) => {
        const updateData = {
          language: 'fra',
        };

        supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${testLocation.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: location } = res;

              // Check updated values
              should(location.title).equal('Original Location Title'); // Should remain unchanged
              should(location.body).equal('Original location body content'); // Should remain unchanged
              should(location.language).equal('fra');

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update multiple fields at once', (done) => {
        const updateData = {
          title: 'Completely Updated Location Title',
          body: 'Completely updated location body with new directions and information',
          language: 'fra',
        };

        supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${testLocation.id}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: location } = res;

              // Check all updated values
              should(location.title).equal('Completely Updated Location Title');
              should(location.body).equal(
                'Completely updated location body with new directions and information'
              );
              should(location.language).equal('fra');

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should handle empty update (no fields to update)', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/locations/${testLocation.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({})
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: location } = res;

              // Check values remain unchanged
              should(location.title).equal('Original Location Title');
              should(location.body).equal('Original location body content');
              should(location.language).equal('eng');
              should(location.reviewer.id).equal(3); // Should still be updated as reviewer

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });
    });
  });
});
