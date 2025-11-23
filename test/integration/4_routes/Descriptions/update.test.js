const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Description features', () => {
  let userToken;
  let moderatorToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Update', () => {
    describe('Invalid parameters', () => {
      it('should return 404 when description does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/descriptions/999999')
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

      it('should return 404 when description is deleted', async () => {
        // Create a deleted description
        const deletedDesc = await TDescription.create({
          author: 1,
          title: 'Deleted Description',
          body: 'This will be deleted',
          language: 'eng',
          entrance: 1,
          isDeleted: true,
        }).fetch();

        const res = await supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${deletedDesc.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            title: 'Updated Title',
          })
          .expect(404);

        should(res.body.message).containEql('not found');

        // Clean up
        await TDescription.destroy({ id: deletedDesc.id });
      });
    });

    describe('Valid updates', () => {
      let testDescription;

      beforeEach(async () => {
        // Create a test description
        testDescription = await TDescription.create({
          author: 1,
          title: 'Original Title',
          body: 'Original body content',
          language: 'eng',
          entrance: 1,
        }).fetch();
      });

      afterEach(async () => {
        // Clean up
        if (testDescription) {
          await TDescription.destroy({ id: testDescription.id });
        }
      });

      it('should update description title only', (done) => {
        const updateData = {
          title: 'Updated Title',
        };

        supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${testDescription.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: description } = res;

              // Check updated values
              should(description.title).equal('Updated Title');
              should(description.body).equal('Original body content'); // Should remain unchanged
              should(description.language).equal('eng'); // Should remain unchanged
              should(description.reviewer.id).equal(3); // User token caver ID

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update description body only', (done) => {
        const updateData = {
          body: 'Updated body content with more details',
        };

        supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${testDescription.id}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: description } = res;

              // Check updated values
              should(description.title).equal('Original Title'); // Should remain unchanged
              should(description.body).equal(
                'Updated body content with more details'
              );
              should(description.language).equal('eng'); // Should remain unchanged

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update description language only', (done) => {
        const updateData = {
          language: 'fra',
        };

        supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${testDescription.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: description } = res;

              // Check updated values
              should(description.title).equal('Original Title'); // Should remain unchanged
              should(description.body).equal('Original body content'); // Should remain unchanged
              should(description.language).equal('fra');

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should update multiple fields at once', (done) => {
        const updateData = {
          title: 'Completely Updated Title',
          body: 'Completely updated body with new information',
          language: 'fra',
        };

        supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${testDescription.id}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: description } = res;

              // Check all updated values
              should(description.title).equal('Completely Updated Title');
              should(description.body).equal(
                'Completely updated body with new information'
              );
              should(description.language).equal('fra');

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });

      it('should handle empty update (no fields to update)', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/descriptions/${testDescription.id}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({})
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            try {
              const { body: description } = res;

              // Check values remain unchanged
              should(description.title).equal('Original Title');
              should(description.body).equal('Original body content');
              should(description.language).equal('eng');
              should(description.reviewer.id).equal(3); // Should still be updated as reviewer

              return done();
            } catch (testErr) {
              return done(testErr);
            }
          });
      });
    });
  });
});
