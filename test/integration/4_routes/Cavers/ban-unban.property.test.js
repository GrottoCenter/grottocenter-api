/* eslint-disable no-await-in-loop */
const supertest = require('supertest');
const should = require('should');
const fc = require('fast-check');
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
  describe('Ban/Unban Property-Based Tests', () => {
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
    it('Property 1: Ban/unban round trip — banning then unbanning results in banned=false', function prop1() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (cycles) => {
          try {
            for (let i = 0; i < cycles; i += 1) {
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
            }

            const caver = await TCaver.findOne({ id: targetCaverId });
            should(caver.banned).be.false();
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            sails.services.blacklistservice.getCache().delete(targetCaverId);
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 2: Ban revokes all active tokens
    // Validates: Requirements 1.1
    it('Property 2: Ban revokes all active tokens — after ban, tokens issued before are revoked', function prop2() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (cycles) => {
          try {
            for (let i = 0; i < cycles; i += 1) {
              await TCaver.updateOne({ id: targetCaverId }).set({
                banned: false,
              });
              sails.services.blacklistservice.getCache().delete(targetCaverId);

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
            }
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            sails.services.blacklistservice.getCache().delete(targetCaverId);
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 3: Non-admin ban is rejected
    // Validates: Requirements 1.2, 1.3
    it('Property 3: Non-admin ban is rejected — returns 403, banned flag unchanged', function prop3() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom('user', 'moderator', 'leader'),
          fc.integer({ min: 1, max: 3 }),
          async (role, cycles) => {
            const tokenMap = {
              user: userToken,
              moderator: moderatorToken,
              leader: leaderToken,
            };
            const token = tokenMap[role];

            try {
              for (let i = 0; i < cycles; i += 1) {
                const caverBefore = await TCaver.findOne({
                  id: targetCaverId,
                });

                const res = await supertest(sails.hooks.http.app)
                  .post(`/api/v1/cavers/${targetCaverId}/ban`)
                  .set('Authorization', token)
                  .set('Accept', 'application/json');
                should(res.status).equal(403);

                const caverAfter = await TCaver.findOne({
                  id: targetCaverId,
                });
                should(caverAfter.banned).equal(caverBefore.banned);
              }
            } finally {
              await TCaver.updateOne({ id: targetCaverId }).set({
                banned: false,
              });
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 4: Non-admin unban is rejected
    // Validates: Requirements 2.2, 2.3
    it('Property 4: Non-admin unban is rejected — returns 403, banned flag unchanged', function prop4() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom('user', 'moderator', 'leader'),
          fc.integer({ min: 1, max: 3 }),
          async (role, cycles) => {
            const tokenMap = {
              user: userToken,
              moderator: moderatorToken,
              leader: leaderToken,
            };
            const token = tokenMap[role];

            try {
              for (let i = 0; i < cycles; i += 1) {
                const caverBefore = await TCaver.findOne({
                  id: targetCaverId,
                });

                const res = await supertest(sails.hooks.http.app)
                  .post(`/api/v1/cavers/${targetCaverId}/unban`)
                  .set('Authorization', token)
                  .set('Accept', 'application/json');
                should(res.status).equal(403);

                const caverAfter = await TCaver.findOne({
                  id: targetCaverId,
                });
                should(caverAfter.banned).equal(caverBefore.banned);
              }
            } finally {
              await TCaver.updateOne({ id: targetCaverId }).set({
                banned: false,
              });
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 5: Ban is idempotent
    // Validates: Requirements 1.5
    it('Property 5: Ban is idempotent — banning already-banned caver returns 200, stays true', function prop5() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (extraBans) => {
          try {
            // Initial ban
            await supertest(sails.hooks.http.app)
              .post(`/api/v1/cavers/${targetCaverId}/ban`)
              .set('Authorization', adminToken)
              .set('Accept', 'application/json')
              .expect(200);

            for (let i = 0; i < extraBans; i += 1) {
              const res = await supertest(sails.hooks.http.app)
                .post(`/api/v1/cavers/${targetCaverId}/ban`)
                .set('Authorization', adminToken)
                .set('Accept', 'application/json');
              should(res.status).equal(200);
              should(res.body).have.property('banned', true);
            }

            const caver = await TCaver.findOne({ id: targetCaverId });
            should(caver.banned).be.true();
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            sails.services.blacklistservice.getCache().delete(targetCaverId);
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 6: Unban is idempotent
    // Validates: Requirements 2.5
    it('Property 6: Unban is idempotent — unbanning non-banned caver returns 200, stays false', function prop6() {
      this.timeout(30000);
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (extraUnbans) => {
            try {
              // Ensure not banned
              await TCaver.updateOne({ id: targetCaverId }).set({
                banned: false,
              });

              for (let i = 0; i < extraUnbans; i += 1) {
                const res = await supertest(sails.hooks.http.app)
                  .post(`/api/v1/cavers/${targetCaverId}/unban`)
                  .set('Authorization', adminToken)
                  .set('Accept', 'application/json');
                should(res.status).equal(200);
                should(res.body).have.property('banned', false);
              }

              const caver = await TCaver.findOne({ id: targetCaverId });
              should(caver.banned).be.false();
            } finally {
              await TCaver.updateOne({ id: targetCaverId }).set({
                banned: false,
              });
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 7: Banned caver login rejected without token issuance
    // Validates: Requirements 3.1, 3.2, 3.3
    it('Property 7: Banned caver login rejected — 401 with generic message, no token in response', function prop7() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/login')
              .send({ email: targetEmail, password: TEST_PASSWORD })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            if (isBanned) {
              should(res.status).equal(401);
              should(res.body).have.property('status', 'Mismatch');
              should(res.body).not.have.property('token');
            } else {
              should(res.status).equal(200);
              should(res.body).have.property('token');
            }
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 8: date_last_connection updated
    // Validates: Requirements 4.1, 4.2
    it('Property 8: date_last_connection updated — within reasonable window after login', function prop8() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            // Store a DB-side "before" marker and reset date_last_connection
            await CommonService.query(
              `UPDATE t_caver SET date_last_connection = NULL WHERE id = $1`,
              [targetCaverId]
            );
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

            // Record DB time before login
            const beforeResult = await CommonService.query(
              `SELECT extract(epoch from NOW()) AS epoch`
            );
            const beforeEpoch = parseFloat(beforeResult.rows[0].epoch);

            await supertest(sails.hooks.http.app)
              .post('/api/v1/login')
              .send({ email: targetEmail, password: TEST_PASSWORD })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            // Record DB time after login
            const afterResult = await CommonService.query(
              `SELECT extract(epoch from NOW()) AS epoch`
            );
            const afterEpoch = parseFloat(afterResult.rows[0].epoch);

            // Allow fire-and-forget DB write to settle
            await waitForMetadata();

            // Read date_last_connection as epoch from DB to avoid timezone parsing issues
            const result = await CommonService.query(
              `SELECT extract(epoch from date_last_connection) AS epoch FROM t_caver WHERE id = $1`,
              [targetCaverId]
            );
            should(result.rows[0].epoch).not.be.null();
            const lastConnEpoch = parseFloat(result.rows[0].epoch);
            should(lastConnEpoch).be.greaterThanOrEqual(beforeEpoch - 2);
            should(lastConnEpoch).be.lessThanOrEqual(afterEpoch + 2);
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            await CommonService.query(
              `UPDATE t_caver SET date_last_connection = NULL WHERE id = $1`,
              [targetCaverId]
            );
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 9: connection_counter incremented
    // Validates: Requirements 5.1, 5.2
    it('Property 9: connection_counter incremented — counter is N+1 after login', function prop9() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            await CommonService.query(
              `UPDATE t_caver SET connection_counter = 0 WHERE id = $1`,
              [targetCaverId]
            );
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

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

            // Allow fire-and-forget DB write to settle
            await waitForMetadata();

            const afterResult = await CommonService.query(
              `SELECT connection_counter FROM t_caver WHERE id = $1`,
              [targetCaverId]
            );
            const counterAfter = afterResult.rows[0].connection_counter;
            should(counterAfter).equal(counterBefore + 1);
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            await CommonService.query(
              `UPDATE t_caver SET connection_counter = 0, date_last_connection = NULL WHERE id = $1`,
              [targetCaverId]
            );
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 10: Forgot-password silently suppresses reset for banned cavers
    // Validates: Requirements 6.1, 6.2, 6.3
    it('Property 10: Forgot-password silently suppresses reset for banned cavers — 204 regardless, email only if not banned', function prop10() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

            sinon.stub(sails.helpers, 'sendEmail').value({
              with: sinon.stub().returns({
                intercept: sinon.stub().resolves(),
              }),
            });

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/forgotPassword')
              .send({ email: targetEmail })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            should(res.status).equal(204);

            if (isBanned) {
              should(sails.helpers.sendEmail.with.called).be.false();
            } else {
              should(sails.helpers.sendEmail.with.called).be.true();
            }
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
            sinon.restore();
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 11: Banned caver password change via reset token is rejected
    // Validates: Requirements 7.1, 7.3
    it('Property 11: Banned caver password change via reset token is rejected — 403 with expired message, password unchanged', function prop11() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          let originalPasswordHash;
          try {
            // Fetch caver to get password hash and generate a valid reset token
            const userFound = await TCaver.findOne({ id: targetCaverId });
            originalPasswordHash = userFound.password;

            const resetToken = TokenService.issue(
              { userId: userFound.id },
              sails.config.custom.passwordResetTokenTTL,
              'Reset password',
              TokenService.getResetPasswordTokenSalt(userFound)
            );

            // Set banned flag
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

            // Call change-password endpoint with the reset token
            const res = await supertest(sails.hooks.http.app)
              .patch('/api/v1/account/password')
              .send({ password: 'newpassword123', token: resetToken })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            if (isBanned) {
              // Banned: should be rejected with 403 and expired-token message
              should(res.status).equal(403);
              should(res.body).have.property(
                'message',
                'The password reset token has expired.'
              );
              // Password hash must remain unchanged
              const caverAfter = await TCaver.findOne({ id: targetCaverId });
              should(caverAfter.password).equal(originalPasswordHash);
            } else {
              // Not banned: should succeed
              should(res.status).equal(204);
              // Password hash should have changed
              const caverAfter = await TCaver.findOne({ id: targetCaverId });
              should(caverAfter.password).not.equal(originalPasswordHash);
            }
          } finally {
            // Restore banned=false and original password hash
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
              password: originalPasswordHash,
            });
          }
        }),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 12: Sign-up conflict returns generic message
    // Validates: Requirements 8.1, 8.2
    it('Property 12: Sign-up conflict returns generic message — 409 with generic text, no specific value leaked', function prop12() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom('email', 'nickname'),
          fc.integer({ min: 1, max: 99999 }),
          async (conflictField, suffix) => {
            let email;
            let nickname;

            if (conflictField === 'email') {
              // Use an existing email, generate a unique nickname
              email = 'admin1@admin1.com';
              nickname = `UniqueNick${suffix}`;
            } else {
              // Use a unique email, use an existing nickname
              email = `unique${suffix}@test.com`;
              nickname = 'Admin1';
            }

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/signup')
              .send({ email, nickname, password: 'securepassword' })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            should(res.status).equal(409);
            should(res.body).have.property(
              'message',
              'Email or nickname is already used.'
            );

            // The response body must not contain the specific conflicting value
            const bodyStr = JSON.stringify(res.body);
            if (conflictField === 'email') {
              should(bodyStr).not.containEql('admin1@admin1.com');
            } else {
              should(bodyStr).not.containEql('Admin1');
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: admin-ban-caver, Property 13: Admin-only ban status exposure
    // Validates: Requirements 9.1, 9.2, 9.3
    it('Property 13: Admin-only ban status exposure — isBanned visible only to admins and matches banned column', function prop13() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

            // Admin caller — should see isBanned matching the banned column
            const adminRes = await supertest(sails.hooks.http.app)
              .get(`/api/v1/cavers/${targetCaverId}`)
              .set('Authorization', adminToken)
              .set('Accept', 'application/json');
            should(adminRes.status).equal(200);
            should(adminRes.body).have.property('isBanned', isBanned);

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
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
          }
        }),
        { numRuns: 100 }
      );
    });

    // Feature: admin-ban-caver, Property 14: Admin-only banned cavers listing returns only banned cavers
    // Validates: Requirements 10.1, 10.2, 10.3, 10.6
    it('Property 14: Admin-only banned cavers listing returns only banned cavers', function prop14() {
      this.timeout(120000);
      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isBanned) => {
          try {
            // Toggle the target caver's banned state
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: isBanned,
            });

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

            if (isBanned) {
              // Target caver should appear in the banned list
              should(targetEntry).be.ok();
              should(targetEntry).have.property('id', targetCaverId);
              should(targetEntry).have.property('nickname');
            } else {
              // Target caver should NOT appear in the banned list
              should(targetEntry).be.undefined();
            }

            // Non-admin caller — should get 403
            const userRes = await supertest(sails.hooks.http.app)
              .get('/api/v1/cavers/banned')
              .set('Authorization', userToken)
              .set('Accept', 'application/json');
            should(userRes.status).equal(403);
          } finally {
            await TCaver.updateOne({ id: targetCaverId }).set({
              banned: false,
            });
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
