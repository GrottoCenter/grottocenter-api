const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline rollback', () => {
  let userToken;

  // A guideline dedicated to the success case below. Sibling test files in
  // this same folder (e.g. update.test.js) mutate the seeded guideline 1, and
  // the whole 4_routes/Guidelines/ folder runs together in one shard, so
  // asserting on guideline 1's pre-rollback state would be order-dependent.
  // This row is created here and only touched by this file.
  let guidelineId;
  const currentTitle = 'Rollback Current Title';
  const currentDescription = 'Current state before rollback.';
  const targetTitle = 'Rollback Target Title';
  const targetDescription = 'Target state to roll back to.';

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();

    // 1. Create the guideline. The AFTER INSERT trigger snapshots these
    //    initial values at date_reviewed = '2024-01-01 10:00:00'.
    const guideline = await TGuideline.create({
      title: 'Rollback Seed Title',
      description: 'Seed state.',
      author: 3,
      reviewer: 2,
      language: 'fra',
      dateInscription: '2024-01-01T10:00:00.000Z',
      dateReviewed: '2024-01-01T10:00:00.000Z',
      isDeleted: false,
    }).fetch();
    guidelineId = guideline.id;

    // 2. Move it to its "current" (pre-rollback) state. The BEFORE UPDATE
    //    trigger skips snapshotting (a row already exists at the old
    //    date_reviewed) but bumps date_reviewed to now(), so no h_guideline
    //    row holds the current values yet — letting the rollback below prove
    //    it captures the pre-rollback state.
    await TGuideline.updateOne({ id: guidelineId }).set({
      title: currentTitle,
      description: currentDescription,
    });

    // 3. The historical snapshot we will roll back to.
    await sails.sendNativeQuery(
      `INSERT INTO h_guideline
         (id, title, description, id_author, id_language, date_inscription, date_reviewed, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        guidelineId,
        targetTitle,
        targetDescription,
        3,
        'fra',
        '2024-06-01T09:00:00.000Z',
        '2024-06-01T09:00:00.000Z',
        false,
      ]
    );
  });

  describe('rollback', () => {
    it('should return 401 when unauthorized', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/1/rollback/2026-01-01T10:00:00.000Z')
        .expect(401, done);
    });

    it('should return 400 when the guideline id is not numeric', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/1abc/rollback/2026-01-01T10:00:00.000Z')
        .set('Authorization', userToken)
        .expect(400, done);
    });

    it('should return 404 when guideline does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/999999/rollback/2026-01-01T10:00:00.000Z')
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should return 404 when snapshot does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/1/rollback/1999-01-02T12:00:00.000Z')
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should successfully rollback guideline fields to snapshot state', async () => {
      // 1. Fetch the snapshots and pick the target one by title, mirroring how
      //    a client discovers the snapshot id to roll back to.
      const getRes = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}/snapshots`)
        .expect(200);

      const targetSnapshot = getRes.body.guidelines.find(
        (s) => s.title === targetTitle
      );
      should(targetSnapshot).be.ok();

      // 2. Perform rollback
      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/guidelines/${guidelineId}/rollback/${targetSnapshot.id}`)
        .set('Authorization', userToken)
        .expect(200);

      const guideline = res.body;
      should(guideline.title).equal(targetTitle);
      should(guideline.description).equal(targetDescription);

      const updated = await TGuideline.findOne(guidelineId);
      should(updated.title).equal(targetTitle);
      should(updated.description).equal(targetDescription);

      // 3. Verify that the database trigger created a snapshot representing the
      //    pre-rollback state (the only place the current values now live).
      const finalSnapshots = await HGuideline.find({
        t_id: guidelineId,
      }).sort('id DESC');
      const preRollbackSnapshot = finalSnapshots.find(
        (s) => s.description === currentDescription
      );
      should(preRollbackSnapshot).be.ok();
    });
  });
});
