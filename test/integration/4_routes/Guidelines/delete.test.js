const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline delete', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/guidelines/1')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when guideline does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/guidelines/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should soft delete a guideline', async () => {
      const guideline = await TGuideline.create({
        title: 'Delete Me',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.true();

      const updated = await TGuideline.findOne(guideline.id);
      should(updated.isDeleted).be.true();

      // Verify that a history snapshot was created capturing the state before deletion
      const snapshots = await HGuideline.find({ t_id: guideline.id });
      should(snapshots.length).equal(1);
      should(snapshots[0].title).equal('Delete Me');
      should(snapshots[0].isDeleted).be.false();
    });

    it('should return 404 when soft deleting an already deleted guideline', async () => {
      const guideline = await TGuideline.create({
        title: 'Already Deleted',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}`)
        .set('Authorization', moderatorToken)
        .expect(404);
    });
  });
});
