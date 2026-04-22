const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const TokenService = require('../../../../api/services/TokenService');

const targetCaverId = 3; // user1
const targetEmail = 'user1@user1.com';
const TEST_PASSWORD = 'testtest';

// Allow fire-and-forget DB write to settle
const waitForMetadata = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 200);
  });

describe('Caver features', () => {
  describe('Ban/Unban Tests', () => {
    let adminToken;
    let userToken;
    let moderatorToken;
    let leaderToken;

    before(function setup() {
      this.timeout(120000);
      return (async () => {
        adminToken = await AuthTokenService.getRawBearerAdminToken();
        userToken = await AuthTokenService.getRawBearerUserToken();
        moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
        leaderToken = await AuthTokenService.getRawBearerLeaderToken();
      })();
    });

    afterEach(async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
      sails.services.blacklistservice.getCache().delete(targetCaverId);
    });

    // Feature: admin-ban-caver, Property 1: Ban/unban round trip
    // Validates: Requirements 1.1, 2.1
    describe('Ban/unban round trip — banning then unbanning results in banned=false', () => {
      it('should ban then unban successfully', async () => {
        const banRes = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(banRes.status).equal(200);
        should(banRes.body).have.property('banned', true);

        const unbanRes = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(unbanRes.status).equal(200);
        should(unbanRes.body).have.property('banned', false);

        const caver = await TCaver.findOne({ id: targetCaverId });
        should(caver.banned).be.false();
      });
    });

    // Feature: admin-ban-caver, Property 2: Ban revokes all active tokens
    // Validates: Requirements 1.1
    describe('Ban revokes all active tokens — after ban, tokens issued before are revoked', () => {
      it('should revoke tokens issued before the ban', async () => {
        const iatBeforeBan = Math.floor(Date.now() / 1000) - 10;

        await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json')
          .expect(200);

        const isRevoked = sails.services.blacklistservice.isRevoked(
          targetCaverId,
          iatBeforeBan
        );
        should(isRevoked).be.true();
      });
    });

    // Feature: admin-ban-caver, Property 3: Non-admin ban is rejected
    // Validates: Requirements 1.2, 1.3
    describe('Non-admin ban is rejected — returns 403, banned flag unchanged', () => {
      it('should reject ban by user role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });

      it('should reject ban by moderator role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });

      it('should reject ban by leader role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', leaderToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });
    });

    // Feature: admin-ban-caver, Property 4: Non-admin unban is rejected
    // Validates: Requirements 2.2, 2.3
    describe('Non-admin unban is rejected — returns 403, banned flag unchanged', () => {
      it('should reject unban by user role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });

      it('should reject unban by moderator role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });

      it('should reject unban by leader role', async () => {
        const caverBefore = await TCaver.findOne({ id: targetCaverId });

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', leaderToken)
          .set('Accept', 'application/json');
        should(res.status).equal(403);

        const caverAfter = await TCaver.findOne({ id: targetCaverId });
        should(caverAfter.banned).equal(caverBefore.banned);
      });
    });

    // Feature: admin-ban-caver, Property 5: Ban is idempotent
    // Validates: Requirements 1.5
    describe('Ban is idempotent — banning already-banned caver returns 200, stays true', () => {
      it('should remain banned after banning twice', async () => {
        // First ban
        await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json')
          .expect(200);

        // Second ban
        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/ban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(res.status).equal(200);
        should(res.body).have.property('banned', true);

        const caver = await TCaver.findOne({ id: targetCaverId });
        should(caver.banned).be.true();
      });
    });

    // Feature: admin-ban-caver, Property 6: Unban is idempotent
    // Validates: Requirements 2.5
    describe('Unban is idempotent — unbanning non-banned caver returns 200, stays false', () => {
      it('should remain not banned after unbanning twice', async () => {
        // Ensure not banned
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        // First unban
        await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json')
          .expect(200);

        // Second unban
        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/cavers/${targetCaverId}/unban`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(res.status).equal(200);
        should(res.body).have.property('banned', false);

        const caver = await TCaver.findOne({ id: targetCaverId });
        should(caver.banned).be.false();
      });
    });

    // Feature: admin-ban-caver, Property 7: Banned caver login rejected without token issuance
    // Validates: Requirements 3.1, 3.2, 3.3
    describe('Banned caver login rejected — 401 with generic message, no token in response', () => {
      it('should reject login with 401 when caver is banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(401);
        should(res.body).have.property('status', 'Mismatch');
        should(res.body).not.have.property('token');
      }).timeout(10000);

      it('should allow login with 200 when caver is not banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(200);
        should(res.body).have.property('token');
      }).timeout(10000);
    });

    // Feature: admin-ban-caver, Property 8: date_last_connection updated
    // Validates: Requirements 4.1, 4.2
    describe('date_last_connection updated — within reasonable window after login', () => {
      it('should update date_last_connection when banned caver attempts login', async () => {
        await CommonService.query(
          `UPDATE t_caver SET date_last_connection = NULL WHERE id = $1`,
          [targetCaverId]
        );
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        const beforeResult = await CommonService.query(
          `SELECT extract(epoch from NOW()) AS epoch`
        );
        const beforeEpoch = parseFloat(beforeResult.rows[0].epoch);

        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        const afterResult = await CommonService.query(
          `SELECT extract(epoch from NOW()) AS epoch`
        );
        const afterEpoch = parseFloat(afterResult.rows[0].epoch);

        await waitForMetadata();

        const result = await CommonService.query(
          `SELECT extract(epoch from date_last_connection) AS epoch FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        should(result.rows[0].epoch).not.be.null();
        const lastConnEpoch = parseFloat(result.rows[0].epoch);
        should(lastConnEpoch).be.greaterThanOrEqual(beforeEpoch - 2);
        should(lastConnEpoch).be.lessThanOrEqual(afterEpoch + 2);
      }).timeout(10000);

      it('should update date_last_connection when non-banned caver logs in', async () => {
        await CommonService.query(
          `UPDATE t_caver SET date_last_connection = NULL WHERE id = $1`,
          [targetCaverId]
        );
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        const beforeResult = await CommonService.query(
          `SELECT extract(epoch from NOW()) AS epoch`
        );
        const beforeEpoch = parseFloat(beforeResult.rows[0].epoch);

        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        const afterResult = await CommonService.query(
          `SELECT extract(epoch from NOW()) AS epoch`
        );
        const afterEpoch = parseFloat(afterResult.rows[0].epoch);

        await waitForMetadata();

        const result = await CommonService.query(
          `SELECT extract(epoch from date_last_connection) AS epoch FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        should(result.rows[0].epoch).not.be.null();
        const lastConnEpoch = parseFloat(result.rows[0].epoch);
        should(lastConnEpoch).be.greaterThanOrEqual(beforeEpoch - 2);
        should(lastConnEpoch).be.lessThanOrEqual(afterEpoch + 2);
      }).timeout(10000);
    });

    // Feature: admin-ban-caver, Property 9: connection_counter incremented
    // Validates: Requirements 5.1, 5.2
    describe('connection_counter incremented — counter is N+1 after login', () => {
      it('should increment connection_counter when banned caver attempts login', async () => {
        await CommonService.query(
          `UPDATE t_caver SET connection_counter = 0 WHERE id = $1`,
          [targetCaverId]
        );
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        const beforeResult = await CommonService.query(
          `SELECT connection_counter FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        const counterBefore = beforeResult.rows[0].connection_counter;

        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        await waitForMetadata();

        const afterResult = await CommonService.query(
          `SELECT connection_counter FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        const counterAfter = afterResult.rows[0].connection_counter;
        should(counterAfter).equal(counterBefore + 1);
      }).timeout(10000);

      it('should increment connection_counter when non-banned caver logs in', async () => {
        await CommonService.query(
          `UPDATE t_caver SET connection_counter = 0 WHERE id = $1`,
          [targetCaverId]
        );
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        const beforeResult = await CommonService.query(
          `SELECT connection_counter FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        const counterBefore = beforeResult.rows[0].connection_counter;

        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: targetEmail, password: TEST_PASSWORD })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        await waitForMetadata();

        const afterResult = await CommonService.query(
          `SELECT connection_counter FROM t_caver WHERE id = $1`,
          [targetCaverId]
        );
        const counterAfter = afterResult.rows[0].connection_counter;
        should(counterAfter).equal(counterBefore + 1);
      }).timeout(10000);
    });

    // Feature: admin-ban-caver, Property 10: Forgot-password silently suppresses reset for banned cavers
    // Validates: Requirements 6.1, 6.2, 6.3
    describe('Forgot-password silently suppresses reset for banned cavers — 204 regardless, email only if not banned', () => {
      it('should return 204 and not send email when caver is banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        sinon.stub(sails.helpers, 'sendEmail').value({
          with: sinon.stub().returns({
            intercept: sinon.stub().resolves(),
          }),
        });

        try {
          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/forgotPassword')
            .send({ email: targetEmail })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(204);
          should(sails.helpers.sendEmail.with.called).be.false();
        } finally {
          sinon.restore();
        }
      });

      it('should return 204 and send email when caver is not banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        sinon.stub(sails.helpers, 'sendEmail').value({
          with: sinon.stub().returns({
            intercept: sinon.stub().resolves(),
          }),
        });

        try {
          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/forgotPassword')
            .send({ email: targetEmail })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(204);
          should(sails.helpers.sendEmail.with.called).be.true();
        } finally {
          sinon.restore();
        }
      });
    });

    // Feature: admin-ban-caver, Property 11: Banned caver password change via reset token is rejected
    // Validates: Requirements 7.1, 7.3
    describe('Banned caver password change via reset token is rejected — 403 with expired message, password unchanged', () => {
      it('should reject password reset with 403 when caver is banned', async () => {
        const userFound = await TCaver.findOne({ id: targetCaverId });
        const originalPasswordHash = userFound.password;

        const resetToken = TokenService.issue(
          { userId: userFound.id },
          sails.config.custom.passwordResetTokenTTL,
          'Reset password',
          TokenService.getResetPasswordTokenSalt(userFound)
        );

        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        try {
          const res = await supertest(sails.hooks.http.app)
            .patch('/api/v1/account/password')
            .send({ password: 'newpassword123', token: resetToken })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(403);
          should(res.body).have.property(
            'message',
            'The password reset token has expired.'
          );

          const caverAfter = await TCaver.findOne({ id: targetCaverId });
          should(caverAfter.password).equal(originalPasswordHash);
        } finally {
          await TCaver.updateOne({ id: targetCaverId }).set({
            banned: false,
            password: originalPasswordHash,
          });
        }
      }).timeout(10000);

      it('should allow password reset with 204 when caver is not banned', async () => {
        const userFound = await TCaver.findOne({ id: targetCaverId });
        const originalPasswordHash = userFound.password;

        const resetToken = TokenService.issue(
          { userId: userFound.id },
          sails.config.custom.passwordResetTokenTTL,
          'Reset password',
          TokenService.getResetPasswordTokenSalt(userFound)
        );

        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        try {
          const res = await supertest(sails.hooks.http.app)
            .patch('/api/v1/account/password')
            .send({ password: 'newpassword123', token: resetToken })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(204);

          const caverAfter = await TCaver.findOne({ id: targetCaverId });
          should(caverAfter.password).not.equal(originalPasswordHash);
        } finally {
          await TCaver.updateOne({ id: targetCaverId }).set({
            banned: false,
            password: originalPasswordHash,
          });
        }
      }).timeout(10000);
    });

    // Feature: admin-ban-caver, Property 12: Sign-up conflict returns generic message
    // Validates: Requirements 8.1, 8.2
    describe('Sign-up conflict returns generic message — 409 with generic text, no specific value leaked', () => {
      it('should return 409 with generic message for email conflict', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'admin1@admin1.com',
            nickname: 'UniqueNickTest1',
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(409);
        should(res.body).have.property(
          'message',
          'Email or nickname is already used.'
        );

        const bodyStr = JSON.stringify(res.body);
        should(bodyStr).not.containEql('admin1@admin1.com');
      }).timeout(10000);

      it('should return 409 with generic message for nickname conflict', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'uniquetest@test.com',
            nickname: 'Admin1',
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(409);
        should(res.body).have.property(
          'message',
          'Email or nickname is already used.'
        );

        const bodyStr = JSON.stringify(res.body);
        should(bodyStr).not.containEql('Admin1');
      }).timeout(10000);
    });

    // Feature: admin-ban-caver, Property 13: Admin-only ban status exposure
    // Validates: Requirements 9.1, 9.2, 9.3
    describe('Admin-only ban status exposure — isBanned visible only to admins and matches banned column', () => {
      it('should expose isBanned=true to admin and hide from others when caver is banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        // Admin caller — should see isBanned matching the banned column
        const adminRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(adminRes.status).equal(200);
        should(adminRes.body).have.property('isBanned', true);

        // Non-admin authenticated caller — should NOT see isBanned
        const userRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(userRes.status).equal(200);
        should(userRes.body).not.have.property('isBanned');

        // Unauthenticated caller — should NOT see isBanned
        const anonRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Accept', 'application/json');
        should(anonRes.status).equal(200);
        should(anonRes.body).not.have.property('isBanned');
      });

      it('should expose isBanned=false to admin and hide from others when caver is not banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        // Admin caller — should see isBanned matching the banned column
        const adminRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(adminRes.status).equal(200);
        should(adminRes.body).have.property('isBanned', false);

        // Non-admin authenticated caller — should NOT see isBanned
        const userRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(userRes.status).equal(200);
        should(userRes.body).not.have.property('isBanned');

        // Unauthenticated caller — should NOT see isBanned
        const anonRes = await supertest(sails.hooks.http.app)
          .get(`/api/v1/cavers/${targetCaverId}`)
          .set('Accept', 'application/json');
        should(anonRes.status).equal(200);
        should(anonRes.body).not.have.property('isBanned');
      });
    });

    // Feature: admin-ban-caver, Property 14: Admin-only banned cavers listing returns only banned cavers
    // Validates: Requirements 10.1, 10.2, 10.3, 10.6
    describe('Admin-only banned cavers listing returns only banned cavers', () => {
      it('should include banned caver in listing and reject non-admin when caver is banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

        // Admin caller — should get the banned list
        const adminRes = await supertest(sails.hooks.http.app)
          .get('/api/v1/cavers/banned')
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(adminRes.status).equal(200);
        should(adminRes.body).have.property('banned');
        should(adminRes.body.banned).be.an.Array();

        // Every entry must have id and nickname (toSimpleCaver shape)
        adminRes.body.banned.forEach((entry) => {
          should(entry).have.property('id');
          should(entry).have.property('nickname');
        });

        const targetEntry = adminRes.body.banned.find(
          (c) => c.id === targetCaverId
        );
        should(targetEntry).be.ok();
        should(targetEntry).have.property('id', targetCaverId);
        should(targetEntry).have.property('nickname');

        // Non-admin caller — should get 403
        const userRes = await supertest(sails.hooks.http.app)
          .get('/api/v1/cavers/banned')
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(userRes.status).equal(403);
      });

      it('should exclude non-banned caver from listing and reject non-admin when caver is not banned', async () => {
        await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

        // Admin caller — should get the banned list
        const adminRes = await supertest(sails.hooks.http.app)
          .get('/api/v1/cavers/banned')
          .set('Authorization', adminToken)
          .set('Accept', 'application/json');
        should(adminRes.status).equal(200);
        should(adminRes.body).have.property('banned');
        should(adminRes.body.banned).be.an.Array();

        // Every entry must have id and nickname (toSimpleCaver shape)
        adminRes.body.banned.forEach((entry) => {
          should(entry).have.property('id');
          should(entry).have.property('nickname');
        });

        const targetEntry = adminRes.body.banned.find(
          (c) => c.id === targetCaverId
        );
        should(targetEntry).be.undefined();

        // Non-admin caller — should get 403
        const userRes = await supertest(sails.hooks.http.app)
          .get('/api/v1/cavers/banned')
          .set('Authorization', userToken)
          .set('Accept', 'application/json');
        should(userRes.status).equal(403);
      });
    });
  });
});
