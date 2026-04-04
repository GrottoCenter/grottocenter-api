const supertest = require('supertest');
const should = require('should');

const TEST_PASSWORD = 'testtest';
const targetCaverId = 3; // user1
const targetEmail = 'user1@user1.com';

// Allow fire-and-forget DB write to settle
const waitForMetadata = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 200);
  });

describe('Caver features', () => {
  describe('Login - Banned caver', () => {
    beforeEach(async () => {
      // Reset connection metadata before each test
      await CommonService.query(
        `UPDATE t_caver SET connection_counter = 0, date_last_connection = NULL WHERE id = $1`,
        [targetCaverId]
      );
    });

    afterEach(async () => {
      // Reset banned flag after each test
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
    });

    it('should return 401 when a banned caver logs in with valid credentials', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: targetEmail, password: TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      should(res.body).have.property('status', 'Mismatch');
      should(res.body).not.have.property('token');
    });

    it('should update date_last_connection for a banned caver after login attempt', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });
      const before = new Date();

      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: targetEmail, password: TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      await waitForMetadata();
      const caver = await TCaver.findOne({ id: targetCaverId });
      should(caver.dateLastConnection).not.be.null();
      const lastConn = new Date(caver.dateLastConnection);
      should(lastConn.getTime()).be.greaterThanOrEqual(before.getTime() - 1000);
    });

    it('should increment connection_counter for a banned caver after login attempt', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: targetEmail, password: TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      await waitForMetadata();
      const result = await CommonService.query(
        `SELECT connection_counter FROM t_caver WHERE id = $1`,
        [targetCaverId]
      );
      should(result.rows[0].connection_counter).equal(1);
    });

    it('should update date_last_connection for a non-banned caver after successful login', async () => {
      const before = new Date();

      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: targetEmail, password: TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      await waitForMetadata();
      const caver = await TCaver.findOne({ id: targetCaverId });
      should(caver.dateLastConnection).not.be.null();
      const lastConn = new Date(caver.dateLastConnection);
      should(lastConn.getTime()).be.greaterThanOrEqual(before.getTime() - 1000);
    });

    it('should increment connection_counter for a non-banned caver after successful login', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: targetEmail, password: TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      await waitForMetadata();
      const result = await CommonService.query(
        `SELECT connection_counter FROM t_caver WHERE id = $1`,
        [targetCaverId]
      );
      should(result.rows[0].connection_counter).equal(1);
    });
  });
});
