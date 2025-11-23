/* eslint-disable global-require, import/no-extraneous-dependencies, no-await-in-loop */
const should = require('should');
const express = require('express');
const supertest = require('supertest');

describe('Rate Limiter', () => {
  let originalEnv;

  before(() => {
    originalEnv = process.env.NODE_ENV;
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
    delete require.cache[
      require.resolve('../../../config/rateLimit/rateLimiter')
    ];
  });

  describe('in test environment', () => {
    it('should skip rate limiting', async () => {
      process.env.NODE_ENV = 'test';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');
      app.use(rateLimiter.generalRateLimit);
      app.get('/test', (req, res) => res.status(200).send('ok'));

      // Make 5 requests - should all succeed in test env
      for (let i = 0; i < 5; i += 1) {
        await supertest(app).get('/test').expect(200);
      }
    });
  });

  describe('in production environment', () => {
    it('should not rate limit unauthenticated requests if under the limit', async () => {
      process.env.NODE_ENV = 'production';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');
      app.use(rateLimiter.generalRateLimit);
      app.get('/test', (req, res) => res.status(200).send('ok'));

      // Make 50 requests (under limit of 100)
      for (let i = 0; i < 50; i += 1) {
        await supertest(app).get('/test').expect(200);
      }
    });

    it('should rate limit unauthenticated requests', async () => {
      process.env.NODE_ENV = 'production';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');
      app.use(rateLimiter.generalRateLimit);
      app.get('/test', (req, res) => res.status(200).send('ok'));

      // Make requests until rate limited (default is 100 per 30s)
      const responses = [];
      for (let i = 0; i < 105; i += 1) {
        const res = await supertest(app).get('/test');
        responses.push(res.status);
      }

      // Should have some 429 responses
      should(responses.filter((s) => s === 429).length).be.above(0);
    });

    it('should not rate limit unauthenticated requests with OPTIONS even when above the limit', async () => {
      process.env.NODE_ENV = 'production';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');
      app.use(rateLimiter.generalRateLimit);
      app.options('/test', (req, res) => res.status(200).send('ok'));

      // Make 105 OPTIONS requests (above limit of 100)
      for (let i = 0; i < 105; i += 1) {
        await supertest(app).options('/test').expect(200);
      }
    });

    it('should not rate limit moderators when under the moderatorDeleteRateLimit', async () => {
      process.env.NODE_ENV = 'production';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const RightService = require('../../../api/services/RightService');
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');

      app.use((req, res, next) => {
        req.token = {
          groups: [RightService.G.MODERATOR],
          nickname: 'Mod',
          id: 2,
        };
        next();
      });
      app.use(rateLimiter.moderatorDeleteRateLimit);
      app.delete('/test', (req, res) => res.status(200).send('ok'));

      // Make 10 DELETE requests (under limit of 20)
      for (let i = 0; i < 10; i += 1) {
        await supertest(app).delete('/test').expect(200);
      }
    });

    it('should rate limit moderators with moderatorDeleteRateLimit', async () => {
      process.env.NODE_ENV = 'production';
      delete require.cache[
        require.resolve('../../../config/rateLimit/rateLimiter')
      ];

      const app = express();
      const RightService = require('../../../api/services/RightService');
      const rateLimiter = require('../../../config/rateLimit/rateLimiter');

      app.use((req, res, next) => {
        req.token = {
          groups: [RightService.G.MODERATOR],
          nickname: 'Mod',
          id: 2,
        };
        next();
      });
      app.use(rateLimiter.moderatorDeleteRateLimit);
      app.delete('/test', (req, res) => res.status(200).send('ok'));

      // Make 25 DELETE requests (limit is 20)
      const responses = [];
      for (let i = 0; i < 25; i += 1) {
        const res = await supertest(app).delete('/test');
        responses.push(res.status);
      }

      // Should have some 429 responses
      should(responses.filter((s) => s === 429).length).be.above(0);
    });
  });
});
