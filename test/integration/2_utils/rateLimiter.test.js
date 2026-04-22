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

      const agent = supertest.agent(app);
      for (let i = 0; i < 5; i += 1) {
        await agent.get('/test').expect(200);
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

      const agent = supertest.agent(app);
      for (let i = 0; i < 50; i += 1) {
        await agent.get('/test').expect(200);
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

      const agent = supertest.agent(app);
      const responses = [];
      for (let i = 0; i < 105; i += 1) {
        const res = await agent.get('/test');
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

      const agent = supertest.agent(app);
      for (let i = 0; i < 105; i += 1) {
        await agent.options('/test').expect(200);
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

      const agent = supertest.agent(app);
      for (let i = 0; i < 10; i += 1) {
        await agent.delete('/test').expect(200);
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

      const agent = supertest.agent(app);
      const responses = [];
      for (let i = 0; i < 25; i += 1) {
        const res = await agent.delete('/test');
        responses.push(res.status);
      }

      // Should have some 429 responses
      should(responses.filter((s) => s === 429).length).be.above(0);
    });
  });
});
