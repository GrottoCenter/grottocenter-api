/* eslint-disable global-require, import/no-extraneous-dependencies, no-await-in-loop */
const should = require('should');
const express = require('express');
const supertest = require('supertest');

// Use low limits in tests to avoid socket exhaustion from too many requests
const TEST_VISITOR_LIMIT = 10;
const TEST_USER_LIMIT = 20;
const TEST_MODERATOR_LIMIT = 40;
const TEST_DELETE_LIMIT = 5;
const TEST_USER_DELETE_LIMIT = 1;

const freshRateLimiter = () => {
  delete require.cache[
    require.resolve('../../../config/rateLimit/rateLimiter')
  ];
  return require('../../../config/rateLimit/rateLimiter');
};

describe('Rate Limiter', () => {
  let originalEnv;
  const envBackup = {};

  before(() => {
    originalEnv = process.env.NODE_ENV;
    [
      'VISITOR_RATE_LIMIT',
      'USER_RATE_LIMIT',
      'LEADER_RATE_LIMIT',
      'MODERATOR_RATE_LIMIT',
      'DELETE_RATE_LIMIT',
      'USER_DELETE_RATE_LIMIT',
    ].forEach((key) => {
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
      require.resolve('../../../config/rateLimit/rateLimiter')
    ];
  });

  describe('in test environment', () => {
    it('should skip rate limiting', async () => {
      process.env.NODE_ENV = 'test';
      const rateLimiter = freshRateLimiter();

      const app = express();
      app.use(rateLimiter.generalRateLimit);
      app.get('/test', (req, res) => res.status(200).send('ok'));

      const agent = supertest.agent(app);
      for (let i = 0; i < 5; i += 1) {
        await agent.get('/test').expect(200);
      }
    });
  });

  describe('in production environment', () => {
    let sailsBackup;

    before(() => {
      sailsBackup = global.sails;
    });

    after(() => {
      global.sails = sailsBackup;
    });

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.VISITOR_RATE_LIMIT = TEST_VISITOR_LIMIT;
      process.env.USER_RATE_LIMIT = TEST_USER_LIMIT;
      process.env.MODERATOR_RATE_LIMIT = TEST_MODERATOR_LIMIT;
      process.env.DELETE_RATE_LIMIT = TEST_DELETE_LIMIT;
      process.env.USER_DELETE_RATE_LIMIT = TEST_USER_DELETE_LIMIT;

      // Mock the sails global used by deleteRateLimit.skip for origin checks
      global.sails = {
        config: { custom: { baseUrl: 'http://localhost:1337' } },
        log: { error: () => {}, info: () => {} },
      };
    });

    describe('generalRateLimit', () => {
      it('should not rate limit visitors under the limit', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_VISITOR_LIMIT - 2; i += 1) {
          await agent.get('/test').expect(200);
        }
      });

      it('should rate limit visitors who exceed the limit', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        const responses = [];
        for (let i = 0; i < TEST_VISITOR_LIMIT + 5; i += 1) {
          const res = await agent.get('/test');
          responses.push(res.status);
        }

        should(responses.filter((s) => s === 429).length).be.above(0);
      });

      it('should not rate limit OPTIONS requests even above the limit', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.options('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_VISITOR_LIMIT + 5; i += 1) {
          await agent.options('/test').expect(200);
        }
      });

      it('should give authenticated users a higher limit than visitors', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = { groups: [], nickname: 'User', id: 10 };
          next();
        });
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        // Users get TEST_USER_LIMIT which is higher than TEST_VISITOR_LIMIT
        // Send more than visitor limit but under user limit — all should pass
        for (let i = 0; i < TEST_USER_LIMIT - 2; i += 1) {
          await agent.get('/test').expect(200);
        }
      });

      it('should rate limit authenticated users who exceed their limit', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = { groups: [], nickname: 'User', id: 10 };
          next();
        });
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        const responses = [];
        for (let i = 0; i < TEST_USER_LIMIT + 5; i += 1) {
          const res = await agent.get('/test');
          responses.push(res.status);
        }

        should(responses.filter((s) => s === 429).length).be.above(0);
      });

      it('should skip rate limiting for administrators', async () => {
        const RightService = require('../../../api/services/RightService');
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = {
            groups: [{ name: RightService.G.ADMINISTRATOR }],
            nickname: 'Admin',
            id: 1,
          };
          next();
        });
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        // Admins are skipped — send well above the moderator limit
        for (let i = 0; i < TEST_MODERATOR_LIMIT + 10; i += 1) {
          await agent.get('/test').expect(200);
        }
      });
    });

    describe('deleteRateLimit', () => {
      it('should skip non-DELETE requests', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.deleteRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < 15; i += 1) {
          await agent.get('/test').expect(200);
        }
      });

      it('should rate limit unauthenticated DELETE requests after 1', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.deleteRateLimit);
        app.delete('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        const responses = [];
        for (let i = 0; i < 5; i += 1) {
          const res = await agent.delete('/test');
          responses.push(res.status);
        }

        should(responses.filter((s) => s === 429).length).be.above(0);
      });

      it('should not rate limit moderators under the delete limit', async () => {
        const RightService = require('../../../api/services/RightService');
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = {
            groups: [{ name: RightService.G.MODERATOR }],
            nickname: 'Mod',
            id: 2,
          };
          next();
        });
        app.use(rateLimiter.deleteRateLimit);
        app.delete('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_DELETE_LIMIT - 1; i += 1) {
          await agent.delete('/test').expect(200);
        }
      });

      it('should rate limit moderators who exceed the delete limit', async () => {
        const RightService = require('../../../api/services/RightService');
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = {
            groups: [{ name: RightService.G.MODERATOR }],
            nickname: 'Mod',
            id: 2,
          };
          next();
        });
        app.use(rateLimiter.deleteRateLimit);
        app.delete('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        const responses = [];
        for (let i = 0; i < TEST_DELETE_LIMIT + 3; i += 1) {
          const res = await agent.delete('/test');
          responses.push(res.status);
        }

        should(responses.filter((s) => s === 429).length).be.above(0);
      });

      it('should skip rate limiting for administrators on DELETE', async () => {
        const RightService = require('../../../api/services/RightService');
        const rateLimiter = freshRateLimiter();
        const app = express();

        app.use((req, res, next) => {
          req.token = {
            groups: [{ name: RightService.G.ADMINISTRATOR }],
            nickname: 'Admin',
            id: 1,
          };
          next();
        });
        app.use(rateLimiter.deleteRateLimit);
        app.delete('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_DELETE_LIMIT + 10; i += 1) {
          await agent.delete('/test').expect(200);
        }
      });

      describe('relation DELETE exemptions', () => {
        const RELATION_PATHS = [
          '/api/v1/entrances/42/cavers/7',
          '/api/v1/caves/1/organizations/3',
          '/api/v1/cavers/5/organizations/2',
          '/api/v1/cavers/5/groups/1',
          '/api/v1/countries/10/organizations/4',
          '/api/v1/countries/10/regions/2/organizations/4',
          '/api/v1/massifs/8/organizations/3',
          '/api/v1/entrances/42/documents/99',
          '/api/v1/caves/1/documents/50',
          '/api/v1/massifs/8/documents/12',
        ];

        it('should skip rate limiting for all relation DELETE routes (unauthenticated)', async () => {
          const rateLimiter = freshRateLimiter();
          const app = express();
          app.use(rateLimiter.deleteRateLimit);
          RELATION_PATHS.forEach((p) => {
            app.delete(p, (req, res) => res.status(200).send('ok'));
          });

          const agent = supertest.agent(app);
          for (const p of RELATION_PATHS) {
            for (let i = 0; i < TEST_USER_DELETE_LIMIT + 3; i += 1) {
              await agent.delete(p).expect(200);
            }
          }
        });

        it('should skip rate limiting for relation DELETE routes (authenticated user)', async () => {
          const rateLimiter = freshRateLimiter();
          const app = express();
          app.use((req, res, next) => {
            req.token = { groups: [], nickname: 'User', id: 10 };
            next();
          });
          app.use(rateLimiter.deleteRateLimit);
          RELATION_PATHS.forEach((p) => {
            app.delete(p, (req, res) => res.status(200).send('ok'));
          });

          const agent = supertest.agent(app);
          for (const p of RELATION_PATHS) {
            for (let i = 0; i < TEST_USER_DELETE_LIMIT + 3; i += 1) {
              await agent.delete(p).expect(200);
            }
          }
        });

        it('should still rate limit paths that extend beyond a relation route', async () => {
          const rateLimiter = freshRateLimiter();
          const app = express();
          app.use(rateLimiter.deleteRateLimit);
          app.delete('/api/v1/entrances/42/cavers/7/extra', (req, res) =>
            res.status(200).send('ok')
          );

          const agent = supertest.agent(app);
          const responses = [];
          for (let i = 0; i < TEST_USER_DELETE_LIMIT + 5; i += 1) {
            const res = await agent.delete(
              '/api/v1/entrances/42/cavers/7/extra'
            );
            responses.push(res.status);
          }

          should(responses.filter((s) => s === 429).length).be.above(0);
        });
      });
    });
  });
});
