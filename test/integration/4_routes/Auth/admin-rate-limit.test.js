/* eslint-disable global-require, no-await-in-loop */
const should = require('should');
const express = require('express');
const supertest = require('supertest');

/**
 * Admin rate limiting integration tests.
 *
 * These tests verify that admin-targeted login attempts are rate-limited at
 * 5 per 15-minute window, while non-admin attempts use the standard limit of
 * 10 per 15-minute window. They also verify that counters are independent.
 *
 * Because the rate limiter skips in test/dev environments (isTestOrDev()),
 * we set NODE_ENV=production and create standalone Express apps with the
 * rate limiter middleware applied directly.
 */

const ADMIN_LIMIT = 5;
const NON_ADMIN_LIMIT = 10;

// Simulated user database for the middleware lookup
const MOCK_USERS = {
  'admin1@admin1.com': {
    id: 1,
    mail: 'admin1@admin1.com',
    groups: [{ name: 'Administrator' }],
  },
  'user1@user1.com': {
    id: 2,
    mail: 'user1@user1.com',
    groups: [{ name: 'User' }],
  },
};

const freshRateLimiter = () => {
  delete require.cache[
    require.resolve('../../../../config/rateLimit/rateLimiter')
  ];
  return require('../../../../config/rateLimit/rateLimiter');
};

/**
 * Creates a test Express app that simulates the admin rate limiting middleware
 * from config/http.js. Uses a mock user lookup instead of the real database.
 */
const createTestApp = (rateLimiter) => {
  const RightService = require('../../../../api/services/RightService');
  const app = express();

  app.use(express.json());

  // Simulate the authRateLimit middleware (applies to all login attempts)
  app.use((req, res, next) => {
    if (req.method.toUpperCase() === 'POST' && req.path === '/api/v1/login') {
      return rateLimiter.authRateLimit(req, res, next);
    }
    return next();
  });

  // Simulate the adminAuthRateLimit middleware from config/http.js
  app.use((req, res, next) => {
    if (req.method.toUpperCase() !== 'POST' || req.path !== '/api/v1/login') {
      return next();
    }

    const { email } = req.body || {};
    if (!email) {
      return next();
    }

    const caver = MOCK_USERS[email];
    if (
      !caver ||
      !RightService.hasGroup(caver.groups, RightService.G.ADMINISTRATOR)
    ) {
      // Not an admin or account doesn't exist — skip admin rate limit
      return next();
    }

    // Admin account — apply stricter rate limit
    return rateLimiter.adminAuthRateLimit(req, res, next);
  });

  // Login endpoint handler (always returns 200 if not rate-limited)
  app.post('/api/v1/login', (req, res) =>
    res.status(200).json({ status: 'Success' })
  );

  return app;
};

describe('Auth features', () => {
  describe('Admin login rate limiting', () => {
    let originalEnv;
    const envBackup = {};

    before(() => {
      originalEnv = process.env.NODE_ENV;
      ['AUTH_RATE_LIMIT', 'ADMIN_AUTH_RATE_LIMIT'].forEach((key) => {
        envBackup[key] = process.env[key];
      });
    });

    after(() => {
      process.env.NODE_ENV = originalEnv;
      Object.entries(envBackup).forEach(([key, val]) => {
        if (val === undefined) delete process.env[key];
        else process.env[key] = val;
      });
      delete require.cache[
        require.resolve('../../../../config/rateLimit/rateLimiter')
      ];
    });

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH_RATE_LIMIT = NON_ADMIN_LIMIT;
      process.env.ADMIN_AUTH_RATE_LIMIT = ADMIN_LIMIT;
    });

    it('should return 429 on the 6th attempt against an admin email', async () => {
      const rateLimiter = freshRateLimiter();
      const app = createTestApp(rateLimiter);
      const agent = supertest.agent(app);

      // First 5 attempts should succeed
      for (let i = 0; i < ADMIN_LIMIT; i += 1) {
        await agent
          .post('/api/v1/login')
          .send({ email: 'admin1@admin1.com', password: 'wrong' })
          .set('Content-Type', 'application/json')
          .expect(200);
      }

      // 6th attempt should be rate-limited
      const res = await agent
        .post('/api/v1/login')
        .send({ email: 'admin1@admin1.com', password: 'wrong' })
        .set('Content-Type', 'application/json');

      should(res.status).equal(429);
    });

    it('should return 429 on the 11th attempt against a non-admin email', async () => {
      const rateLimiter = freshRateLimiter();
      const app = createTestApp(rateLimiter);
      const agent = supertest.agent(app);

      // First 10 attempts should succeed
      for (let i = 0; i < NON_ADMIN_LIMIT; i += 1) {
        await agent
          .post('/api/v1/login')
          .send({ email: 'user1@user1.com', password: 'wrong' })
          .set('Content-Type', 'application/json')
          .expect(200);
      }

      // 11th attempt should be rate-limited
      const res = await agent
        .post('/api/v1/login')
        .send({ email: 'user1@user1.com', password: 'wrong' })
        .set('Content-Type', 'application/json');

      should(res.status).equal(429);
    });

    it('should use non-admin limit for non-existent email addresses', async () => {
      const rateLimiter = freshRateLimiter();
      const app = createTestApp(rateLimiter);
      const agent = supertest.agent(app);

      // Non-existent email should use the non-admin limit (10 attempts)
      for (let i = 0; i < NON_ADMIN_LIMIT; i += 1) {
        await agent
          .post('/api/v1/login')
          .send({ email: 'nonexistent@example.com', password: 'wrong' })
          .set('Content-Type', 'application/json')
          .expect(200);
      }

      // 11th attempt should be rate-limited
      const res = await agent
        .post('/api/v1/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .set('Content-Type', 'application/json');

      should(res.status).equal(429);
    });

    it('should track admin and non-admin counters independently', async () => {
      const rateLimiter = freshRateLimiter();
      const RightService = require('../../../../api/services/RightService');

      // Create an app that ONLY applies the admin-specific rate limiter
      // (not the shared authRateLimit) to isolate the counter independence test.
      // This verifies Requirement 6.6: admin and non-admin counters are separate.
      const app = express();
      app.use(express.json());

      // Apply adminAuthRateLimit only for admin-targeted requests
      app.use((req, res, next) => {
        if (
          req.method.toUpperCase() !== 'POST' ||
          req.path !== '/api/v1/login'
        ) {
          return next();
        }

        const { email } = req.body || {};
        if (!email) return next();

        const caver = MOCK_USERS[email];
        if (
          !caver ||
          !RightService.hasGroup(caver.groups, RightService.G.ADMINISTRATOR)
        ) {
          return next();
        }

        return rateLimiter.adminAuthRateLimit(req, res, next);
      });

      app.post('/api/v1/login', (req, res) =>
        res.status(200).json({ status: 'Success' })
      );

      const agent = supertest.agent(app);

      // Make many non-admin attempts — these should NOT affect the admin counter
      for (let i = 0; i < ADMIN_LIMIT + 3; i += 1) {
        await agent
          .post('/api/v1/login')
          .send({ email: 'user1@user1.com', password: 'wrong' })
          .set('Content-Type', 'application/json')
          .expect(200);
      }

      // Admin should still have all 5 attempts available (counter is independent)
      for (let i = 0; i < ADMIN_LIMIT; i += 1) {
        await agent
          .post('/api/v1/login')
          .send({ email: 'admin1@admin1.com', password: 'wrong' })
          .set('Content-Type', 'application/json')
          .expect(200);
      }

      // 6th admin attempt should be rate-limited
      const adminRes = await agent
        .post('/api/v1/login')
        .send({ email: 'admin1@admin1.com', password: 'wrong' })
        .set('Content-Type', 'application/json');

      should(adminRes.status).equal(429);

      // Non-admin should still succeed (not affected by admin counter)
      const userRes = await agent
        .post('/api/v1/login')
        .send({ email: 'user1@user1.com', password: 'wrong' })
        .set('Content-Type', 'application/json');

      should(userRes.status).equal(200);
    });
  });
});
