/* eslint-disable global-require, import/no-extraneous-dependencies, no-await-in-loop */
const should = require('should');
const express = require('express');
const supertest = require('supertest');
const sinon = require('sinon');

// Use low limits in tests to avoid socket exhaustion from too many requests
const TEST_VISITOR_LIMIT = 10;
const TEST_USER_LIMIT = 20;
const TEST_MODERATOR_LIMIT = 40;
const TEST_GEOLOC_VISITOR_LIMIT = 6;
const TEST_GEOLOC_USER_LIMIT = 12;
const TEST_GEOLOC_LEADER_LIMIT = 18;
const TEST_GEOLOC_MODERATOR_LIMIT = 24;
const TEST_DELETE_LIMIT = 5;
const TEST_USER_DELETE_LIMIT = 1;
const TEST_AUTH_LIMIT = 3;
const TEST_ADMIN_AUTH_LIMIT = 2;

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
      'GEOLOC_VISITOR_RATE_LIMIT',
      'GEOLOC_USER_RATE_LIMIT',
      'GEOLOC_LEADER_RATE_LIMIT',
      'GEOLOC_MODERATOR_RATE_LIMIT',
      'DELETE_RATE_LIMIT',
      'USER_DELETE_RATE_LIMIT',
      'AUTH_RATE_LIMIT',
      'ADMIN_AUTH_RATE_LIMIT',
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
    let warnLogs = [];

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
      process.env.GEOLOC_VISITOR_RATE_LIMIT = TEST_GEOLOC_VISITOR_LIMIT;
      process.env.GEOLOC_USER_RATE_LIMIT = TEST_GEOLOC_USER_LIMIT;
      process.env.GEOLOC_LEADER_RATE_LIMIT = TEST_GEOLOC_LEADER_LIMIT;
      process.env.GEOLOC_MODERATOR_RATE_LIMIT = TEST_GEOLOC_MODERATOR_LIMIT;
      process.env.DELETE_RATE_LIMIT = TEST_DELETE_LIMIT;
      process.env.USER_DELETE_RATE_LIMIT = TEST_USER_DELETE_LIMIT;
      process.env.AUTH_RATE_LIMIT = TEST_AUTH_LIMIT;
      process.env.ADMIN_AUTH_RATE_LIMIT = TEST_ADMIN_AUTH_LIMIT;

      // Mock the sails global used by deleteRateLimit.skip for origin checks
      // and by the limit-exceeded handler for logging.
      warnLogs = [];
      global.sails = {
        config: { custom: { baseUrl: 'http://localhost:1337' } },
        log: {
          error: () => {},
          info: () => {},
          warn: (...args) => warnLogs.push(args.join(' ')),
        },
      };
    });

    // Parses the JSON payload out of the 'Rate limit exceeded:' log lines.
    const exceededLogs = () =>
      warnLogs
        .filter((l) => l.startsWith('Rate limit exceeded:'))
        .map((l) => JSON.parse(l.slice(l.indexOf('{'))));

    describe('rate limit rejection logging', () => {
      it('should log a warning naming the limiter, IP, method and path', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/api/v1/caves/1', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_VISITOR_LIMIT + 2; i += 1) {
          await agent.get('/api/v1/caves/1');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        should(logs[0].limiter).be.exactly('general');
        should(logs[0].method).be.exactly('GET');
        should(logs[0].path).be.exactly('/api/v1/caves/1');
        should(logs[0].ip).be.a.String();
        should(logs[0].windowMs).be.a.Number();
      });

      it('should log the resolved numeric limit, not the max function', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_VISITOR_LIMIT + 2; i += 1) {
          await agent.get('/test');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        // options.limit holds the unresolved `max` function; the effective
        // limit must be read from req.rateLimit instead.
        should(logs[0].limit).be.exactly(TEST_VISITOR_LIMIT);
        should(logs[0].used).be.above(TEST_VISITOR_LIMIT);
      });

      it('should include the authenticated user in the log', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use((req, res, next) => {
          req.token = { groups: [], nickname: 'User', id: 10 };
          next();
        });
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_USER_LIMIT + 2; i += 1) {
          await agent.get('/test');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        should(logs[0].userId).be.exactly(10);
        should(logs[0].nickname).be.exactly('User');
      });

      it('should name the delete limiter on DELETE rejections', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.deleteRateLimit);
        app.delete('/api/v1/entrances/42', (req, res) =>
          res.status(200).send('ok')
        );

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_USER_DELETE_LIMIT + 3; i += 1) {
          await agent.delete('/api/v1/entrances/42');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        should(logs[0].limiter).be.exactly('delete');
        should(logs[0].method).be.exactly('DELETE');
      });

      it('should still return 429 with the configured message body', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        let limited;
        for (let i = 0; i < TEST_VISITOR_LIMIT + 2; i += 1) {
          const res = await agent.get('/test');
          if (res.status === 429) limited = res;
        }

        // Overriding `handler` replaces the library's default responder, so the
        // status, message body and RateLimit headers must survive.
        should(limited).be.ok();
        should(limited.text).be.exactly(
          'Too many requests with the same IP, try again later.'
        );
        should(limited.headers).have.property('retry-after');
      });

      it('should not log anything while under the limit', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_VISITOR_LIMIT - 2; i += 1) {
          await agent.get('/test').expect(200);
        }

        should(exceededLogs()).be.empty();
      });

      it('should reject with 429 even when the sails global is absent', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.generalRateLimit);
        app.get('/test', (req, res) => res.status(200).send('ok'));

        // A throw inside the handler would surface as a 500 and lose the 429.
        delete global.sails;
        const agent = supertest.agent(app);
        const responses = [];
        for (let i = 0; i < TEST_VISITOR_LIMIT + 2; i += 1) {
          const res = await agent.get('/test');
          responses.push(res.status);
        }

        should(responses.filter((s) => s === 429).length).be.above(0);
        should(responses.filter((s) => s === 500)).be.empty();
      });

      it('should name the auth limiter on authRateLimit rejections', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.authRateLimit);
        app.post('/api/v1/login', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_AUTH_LIMIT + 2; i += 1) {
          await agent.post('/api/v1/login');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        should(logs[0].limiter).be.exactly('auth');
      });

      it('should name the adminAuth limiter on adminAuthRateLimit rejections', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use(rateLimiter.adminAuthRateLimit);
        app.post('/api/v1/login', (req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_ADMIN_AUTH_LIMIT + 2; i += 1) {
          await agent.post('/api/v1/login');
        }

        const logs = exceededLogs();
        should(logs.length).be.above(0);
        should(logs[0].limiter).be.exactly('adminAuth');
      });
    });

    // Mirrors production: behind App Service with `trustProxy: 1`, req.ip is
    // the last X-Forwarded-For entry and carries the client's source port,
    // which changes with every TCP connection.
    describe('client IP keying behind a proxy', () => {
      const proxiedApp = (limiter, method, path) => {
        const app = express();
        app.set('trust proxy', 1);
        app.use(limiter);
        app[method](path, (req, res) => res.status(200).send('ok'));
        return app;
      };

      // A fresh supertest request (no agent) per call, each with a different
      // forwarded source port, as a client opening one connection per request.
      const statusesFrom = async (app, method, path, forwardedFors) => {
        const statuses = [];
        for (const xff of forwardedFors) {
          const res = await supertest(app)
            [method](path)
            .set('X-Forwarded-For', xff);
          statuses.push(res.status);
        }
        return statuses;
      };

      const withPorts = (ip, count, firstPort = 50000) =>
        Array.from({ length: count }, (_, i) => `${ip}:${firstPort + i}`);

      it('should count requests from one IP on different ports in one auth bucket', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(rateLimiter.authRateLimit, 'post', '/login');

        const statuses = await statusesFrom(
          app,
          'post',
          '/login',
          withPorts('203.0.113.7', TEST_AUTH_LIMIT + 1)
        );

        should(statuses.slice(0, TEST_AUTH_LIMIT)).matchEach(200);
        should(statuses[TEST_AUTH_LIMIT]).be.exactly(429);
      });

      it('should count requests from one IP on different ports in one admin auth bucket', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(
          rateLimiter.adminAuthRateLimit,
          'post',
          '/login'
        );

        const statuses = await statusesFrom(
          app,
          'post',
          '/login',
          withPorts('203.0.113.7', TEST_ADMIN_AUTH_LIMIT + 1)
        );

        should(statuses.slice(0, TEST_ADMIN_AUTH_LIMIT)).matchEach(200);
        should(statuses[TEST_ADMIN_AUTH_LIMIT]).be.exactly(429);
      });

      it('should count requests from one IP on different ports in one general bucket', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(rateLimiter.generalRateLimit, 'get', '/test');

        const statuses = await statusesFrom(
          app,
          'get',
          '/test',
          withPorts('203.0.113.7', TEST_VISITOR_LIMIT + 1)
        );

        should(statuses.slice(0, TEST_VISITOR_LIMIT)).matchEach(200);
        should(statuses[TEST_VISITOR_LIMIT]).be.exactly(429);
      });

      it('should still give a different IP its own bucket', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(rateLimiter.authRateLimit, 'post', '/login');

        await statusesFrom(
          app,
          'post',
          '/login',
          withPorts('203.0.113.7', TEST_AUTH_LIMIT + 1)
        );
        const other = await statusesFrom(app, 'post', '/login', [
          '203.0.113.8:50000',
        ]);

        should(other).eql([200]);
      });

      it('should share one bucket across addresses in the same IPv6 /56', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(rateLimiter.authRateLimit, 'post', '/login');

        const statuses = await statusesFrom(
          app,
          'post',
          '/login',
          Array.from(
            { length: TEST_AUTH_LIMIT + 1 },
            (_, i) => `[2001:db8:0:${i}::1]:${50000 + i}`
          )
        );

        should(statuses.slice(0, TEST_AUTH_LIMIT)).matchEach(200);
        should(statuses[TEST_AUTH_LIMIT]).be.exactly(429);
      });

      it('should log the port-free IP alongside the raw req.ip', async () => {
        const rateLimiter = freshRateLimiter();
        const app = proxiedApp(rateLimiter.authRateLimit, 'post', '/login');

        await statusesFrom(
          app,
          'post',
          '/login',
          withPorts('203.0.113.7', TEST_AUTH_LIMIT + 1)
        );

        const logs = exceededLogs();
        should(logs.length).be.exactly(1);
        should(logs[0].ip).be.exactly('203.0.113.7');
        should(logs[0].rawIp).be.exactly(
          `203.0.113.7:${50000 + TEST_AUTH_LIMIT}`
        );
      });
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

    describe('geolocRateLimit', () => {
      const GEOLOC = '/api/v1/geoloc/entrances';

      // Mounts both limiters in the order of config/http.js.
      const buildApp = (token) => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.use((req, res, next) => {
          if (token) req.token = token;
          next();
        });
        app.use(rateLimiter.generalRateLimit);
        app.use(rateLimiter.geolocRateLimit);
        app.use((req, res) => res.status(200).send('ok'));
        return { app, rateLimiter };
      };

      // Returns the status codes of `count` GET requests to `path`.
      const hit = async (agent, path, count) => {
        const statuses = [];
        for (let i = 0; i < count; i += 1) {
          statuses.push((await agent.get(path)).status);
        }
        return statuses;
      };

      it('should allow exactly the visitor geoloc limit, then reject', async () => {
        const { app } = buildApp();
        const statuses = await hit(
          supertest.agent(app),
          GEOLOC,
          TEST_GEOLOC_VISITOR_LIMIT + 2
        );

        should(statuses.slice(0, TEST_GEOLOC_VISITOR_LIMIT)).eql(
          Array(TEST_GEOLOC_VISITOR_LIMIT).fill(200)
        );
        should(statuses.slice(TEST_GEOLOC_VISITOR_LIMIT)).eql([429, 429]);
      });

      it('should give users a higher geoloc limit than visitors', async () => {
        const { app } = buildApp({ groups: [], nickname: 'User', id: 10 });
        const statuses = await hit(
          supertest.agent(app),
          GEOLOC,
          TEST_GEOLOC_USER_LIMIT + 1
        );

        should(statuses.filter((s) => s === 200).length).equal(
          TEST_GEOLOC_USER_LIMIT
        );
        should(statuses[TEST_GEOLOC_USER_LIMIT]).equal(429);
      });

      it('should give leaders the leader geoloc limit', async () => {
        const RightService = require('../../../api/services/RightService');
        const { app } = buildApp({
          groups: [{ name: RightService.G.LEADER }],
          nickname: 'Leader',
          id: 3,
        });
        const statuses = await hit(
          supertest.agent(app),
          GEOLOC,
          TEST_GEOLOC_LEADER_LIMIT + 1
        );

        should(statuses.filter((s) => s === 200).length).equal(
          TEST_GEOLOC_LEADER_LIMIT
        );
        should(statuses[TEST_GEOLOC_LEADER_LIMIT]).equal(429);
      });

      it('should give moderators the moderator geoloc limit', async () => {
        const RightService = require('../../../api/services/RightService');
        const { app } = buildApp({
          groups: [{ name: RightService.G.MODERATOR }],
          nickname: 'Mod',
          id: 2,
        });
        const statuses = await hit(
          supertest.agent(app),
          GEOLOC,
          TEST_GEOLOC_MODERATOR_LIMIT + 1
        );

        should(statuses.filter((s) => s === 200).length).equal(
          TEST_GEOLOC_MODERATOR_LIMIT
        );
        should(statuses[TEST_GEOLOC_MODERATOR_LIMIT]).equal(429);
      });

      it('should skip rate limiting for administrators', async () => {
        const RightService = require('../../../api/services/RightService');
        const { app } = buildApp({
          groups: [{ name: RightService.G.ADMINISTRATOR }],
          nickname: 'Admin',
          id: 1,
        });
        const statuses = await hit(
          supertest.agent(app),
          GEOLOC,
          TEST_GEOLOC_MODERATOR_LIMIT + 5
        );

        should(statuses.every((s) => s === 200)).be.true();
      });

      it('should not let exhausted geoloc budget block general routes', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        await hit(agent, GEOLOC, TEST_GEOLOC_VISITOR_LIMIT + 1);

        // Same IP: login-like and other routes are untouched
        await agent.post('/api/v1/login').expect(200);
        await agent.get('/api/v1/entrances/1').expect(200);
      });

      it('should not let exhausted general budget block geoloc routes', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        await hit(agent, '/api/v1/entrances/1', TEST_VISITOR_LIMIT + 1);
        await agent.get('/api/v1/entrances/1').expect(429);

        await agent.get(GEOLOC).expect(200);
      });

      it('should not consume the general budget', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        await hit(agent, GEOLOC, TEST_GEOLOC_VISITOR_LIMIT);

        const res = await agent.get('/api/v1/entrances/1').expect(200);
        should(res.headers['ratelimit-policy']).equal(
          `${TEST_VISITOR_LIMIT};w=600`
        );
        should(res.headers['ratelimit-remaining']).equal(
          String(TEST_VISITOR_LIMIT - 1)
        );
      });

      it('should expose the geoloc quota in the standard headers', async () => {
        const { app } = buildApp();
        const res = await supertest.agent(app).get(GEOLOC).expect(200);

        should(res.headers['ratelimit-policy']).equal(
          `${TEST_GEOLOC_VISITOR_LIMIT};w=600`
        );
        should(res.headers['ratelimit-remaining']).equal(
          String(TEST_GEOLOC_VISITOR_LIMIT - 1)
        );
      });

      it('should share one counter across geoloc routes and aliases', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        const paths = [
          '/api/v1/geoloc/entrances',
          '/api/v1/geoloc/entrancesCoordinates',
          '/api/v1/geoloc/caves',
          '/api/v1/geoloc/cavesCoordinates',
          '/api/v1/geoloc/grottos',
          '/api/v1/geoloc/countEntries',
        ];
        for (let i = 0; i < TEST_GEOLOC_VISITOR_LIMIT; i += 1) {
          await agent.get(paths[i % paths.length]).expect(200);
        }

        await agent.get('/api/v1/geoloc/massifs').expect(429);
      });

      it('should keep non-GET geoloc requests in the general budget', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        await hit(agent, GEOLOC, TEST_GEOLOC_VISITOR_LIMIT);

        const res = await agent.post(GEOLOC).expect(200);
        should(res.headers['ratelimit-policy']).equal(
          `${TEST_VISITOR_LIMIT};w=600`
        );
      });

      it('should not rate limit OPTIONS requests', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_GEOLOC_VISITOR_LIMIT + 5; i += 1) {
          await agent.options(GEOLOC).expect(200);
        }
      });

      it('should give each IP its own geoloc counter', async () => {
        const rateLimiter = freshRateLimiter();
        const app = express();
        app.set('trust proxy', 1);
        app.use(rateLimiter.geolocRateLimit);
        app.use((req, res) => res.status(200).send('ok'));

        const agent = supertest.agent(app);
        for (let i = 0; i < TEST_GEOLOC_VISITOR_LIMIT; i += 1) {
          await agent.get(GEOLOC).set('X-Forwarded-For', '1.1.1.1').expect(200);
        }
        await agent.get(GEOLOC).set('X-Forwarded-For', '1.1.1.1').expect(429);
        await agent.get(GEOLOC).set('X-Forwarded-For', '2.2.2.2').expect(200);
      });

      it('should accept requests again once the window has elapsed', async () => {
        const { app } = buildApp();
        const agent = supertest.agent(app);
        await hit(agent, GEOLOC, TEST_GEOLOC_VISITOR_LIMIT);
        await agent.get(GEOLOC).expect(429);

        // Only Date is faked: sockets and the store's own timers stay real.
        const clock = sinon.useFakeTimers({
          now: Date.now(),
          toFake: ['Date'],
        });
        try {
          clock.tick(10 * 60 * 1000 + 1000);
          await agent.get(GEOLOC).expect(200);
        } finally {
          clock.restore();
        }
      });

      it('should log rejections under the geoloc limiter name', async () => {
        const { app } = buildApp();
        await hit(supertest.agent(app), GEOLOC, TEST_GEOLOC_VISITOR_LIMIT + 1);

        const [entry] = exceededLogs();
        should(entry.limiter).equal('geoloc');
        should(entry.limit).equal(TEST_GEOLOC_VISITOR_LIMIT);
        should(entry.path).equal(GEOLOC);
      });

      it('should match every GET geoloc route declared in config/routes.js', () => {
        const { routes } = require('../../../config/routes');
        const { isGeolocRead } = freshRateLimiter();

        const declared = Object.keys(routes)
          .filter((key) => key.startsWith('GET /api/v1/geoloc/'))
          .map((key) => key.slice('GET '.length));

        should(declared.length).be.above(10);
        declared.forEach((path) => {
          should(isGeolocRead({ method: 'GET', path })).be.true(path);
        });
      });

      it('should not match routes outside /api/v1/geoloc/', () => {
        const { isGeolocRead } = freshRateLimiter();

        [
          '/api/v1/entrances/1',
          '/api/v1/geolocation',
          '/api/v1/login',
          '/geoloc/entrances',
        ].forEach((path) => {
          should(isGeolocRead({ method: 'GET', path })).be.false(path);
        });
        should(
          isGeolocRead({ method: 'POST', path: '/api/v1/geoloc/entrances' })
        ).be.false();
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

        it('should still rate limit destructive DELETE routes (entity deletion)', async () => {
          const rateLimiter = freshRateLimiter();
          const app = express();
          app.use(rateLimiter.deleteRateLimit);
          app.delete('/api/v1/entrances/42', (req, res) =>
            res.status(200).send('ok')
          );

          const agent = supertest.agent(app);
          const responses = [];
          for (let i = 0; i < TEST_USER_DELETE_LIMIT + 5; i += 1) {
            const res = await agent.delete('/api/v1/entrances/42');
            responses.push(res.status);
          }

          should(responses.filter((s) => s === 429).length).be.above(0);
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
