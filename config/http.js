/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.http.html
 */
const { v7: uuidv7 } = require('uuid');
const multer = require('multer');
const responseTime = require('response-time');
const path = require('path');
const fs = require('fs');
const rateLimiter = require('./rateLimit/rateLimiter');
const { version: packageVersion } = require('../package.json');
const TokenService = require('../api/services/TokenService');
const RightService = require('../api/services/RightService');
const logger = require('../api/utils/logger');
const sanitize = require('../api/utils/sanitize');

// Auth endpoints that receive credentials and need stricter limits.
// Note: PATCH /api/v1/account is intentionally excluded — while it can accept
// a password field, it is primarily a general profile-update endpoint (nickname,
// email, language, etc.) that requires an existing valid token. The dedicated
// password-change route (/api/v1/account/password) is the one exposed to
// unauthenticated reset flows and is covered here.
const AUTH_PATHS = [
  '/api/v1/login',
  '/api/v1/signup',
  '/api/v1/forgotPassword',
  '/api/v1/account/password',
  '/api/v1/mfa/enroll',
  '/api/v1/mfa/verify',
];

// Maximum body size for auth endpoints (1 KB).
// Checked against the actual parsed body after the body parser runs,
// so it cannot be bypassed via chunked transfer encoding or a spoofed
// Content-Length header.
const AUTH_BODY_LIMIT = 1024;

module.exports.http = {
  /** **************************************************************************
   *                                                                           *
   * Express middleware to use for every Sails request. To add custom          *
   * middleware to the mix, add a function to the middleware config object and *
   * add its key to the "order" array. The $custom key is reserved for         *
   * backwards-compatibility with Sails v0.9.x apps that use the               *
   * `customMiddleware` config option.                                         *
   *                                                                           *
   *************************************************************************** */

  middleware: {
    // Requests limiter configuration
    generalRateLimit: rateLimiter.generalRateLimit,
    deleteRateLimit: rateLimiter.deleteRateLimit,

    // Stricter rate limiter for auth endpoints only.
    // Wraps the express-rate-limit instance so it only fires on auth paths.
    authRateLimit(req, res, next) {
      if (AUTH_PATHS.includes(req.path)) {
        return rateLimiter.authRateLimit(req, res, next);
      }
      return next();
    },

    /** *************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ************************************************************************** */

    order: [
      'traceId',
      'corsHeaders',
      'securityHeaders',
      'parseAuthToken',
      'generalRateLimit',
      'deleteRateLimit',
      'authRateLimit',
      'responseTimeLogger',
      'requestLogger',
      'fileMiddleware',
      'bodyParser',
      'authBodyLimit',
      'adminAuthRateLimit',
      'compress',
      'poweredBy',
      'addPackageVersionHeader',
      'localUploads',
      'router',
      'www',
    ],

    /** **************************************************************************
     *                                                                           *
     * Example custom middleware; logs each request to the console.              *
     *                                                                           *
     *************************************************************************** */

    traceId(req, res, next) {
      const traceId = req.get('X-Trace-Id') || uuidv7();
      req.traceId = traceId;
      res.set('X-Trace-Id', traceId);
      logger.run(traceId, next);
    },

    // Ensure CORS headers are present on every response, including
    // preflight OPTIONS requests that Sails' built-in CORS may not cover.
    corsHeaders(req, res, next) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Headers', 'content-type, authorization');
      res.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      return next();
    },

    // TODO: when various API versions are used (v1, v2 etc.), this needs to be changed.
    addPackageVersionHeader(req, res, next) {
      res.set('X-Api-Version', packageVersion);
      return next();
    },

    poweredBy(req, res, next) {
      res.removeHeader('x-powered-by');
      return next();
    },

    // Security headers: HSTS, X-Content-Type-Options, X-Frame-Options
    securityHeaders(req, res, next) {
      // HSTS: instruct browsers to always use HTTPS (1 year, include subdomains)
      res.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
      // Prevent MIME-type sniffing
      res.set('X-Content-Type-Options', 'nosniff');
      // Prevent clickjacking — API responses should never be framed
      res.set('X-Frame-Options', 'DENY');
      return next();
    },

    // Stricter body size limit for auth endpoints (1 KB max).
    // Runs after the body parser so it checks the actual parsed payload size,
    // not the client-supplied Content-Length header (immune to chunked bypass).
    authBodyLimit(req, res, next) {
      if (!AUTH_PATHS.includes(req.path)) {
        return next();
      }
      const bodySize = Buffer.byteLength(
        JSON.stringify(req.body) || '',
        'utf8'
      );
      if (bodySize > AUTH_BODY_LIMIT) {
        return res.status(413).json({
          message: 'Request body too large for this endpoint.',
        });
      }
      return next();
    },

    // Stricter rate limiter for admin-targeted login attempts.
    // Runs after bodyParser (needs req.body.email) and before router.
    // Only applies to POST /api/v1/login. Looks up the email in the database
    // to determine if the target account belongs to the Administrator group.
    // If admin, applies the stricter adminAuthRateLimit (5 req / 15 min / IP).
    // If not admin or email doesn't exist, skips (lets authRateLimit handle it).
    //
    // Note: the general authRateLimit (10 req / 15 min) runs earlier in the
    // middleware chain, so a flood of requests is already bounded before this
    // DB lookup executes. The DB query here is therefore limited to at most
    // 10 requests per 15 minutes per IP in production.
    //
    // Known trade-off: when the 5-request admin limit is exhausted, the 429
    // response is returned before the login controller's constantDelay()
    // executes, making rate-limited responses measurably faster. This creates
    // a minor timing oracle that could allow an attacker to distinguish admin
    // emails after 5 probes per IP window. This is accepted because:
    // (a) the attacker must already exhaust the auth rate limit to observe it,
    // (b) the information leaked is limited to "this email belongs to an admin",
    // (c) adding an artificial delay here would complicate middleware flow for
    //     marginal security gain given the existing rate-limit protection.
    adminAuthRateLimit(req, res, next) {
      // Only apply to POST /api/v1/login
      if (req.method.toUpperCase() !== 'POST' || req.path !== '/api/v1/login') {
        return next();
      }

      const { email } = req.body || {};
      if (!email) {
        return next();
      }

      // Look up the account to determine if it's an admin.
      // The result is stashed in req.adminCaver so the login controller
      // can reuse it for failure tracking without a redundant DB query.
      return TCaver.findOne({ mail: email.toLowerCase() })
        .populate('groups')
        .then((caver) => {
          if (
            !caver ||
            !RightService.hasGroup(caver.groups, RightService.G.ADMINISTRATOR)
          ) {
            // Not an admin or account doesn't exist — skip admin rate limit
            return next();
          }

          // Stash for downstream use in the login controller
          req.adminCaver = caver;

          // Admin account — apply stricter rate limit
          return rateLimiter.adminAuthRateLimit(req, res, next);
        })
        .catch((err) => {
          // DB lookup failed — skip admin rate limit gracefully
          sails.log.error(
            'adminAuthRateLimit: DB lookup failed, skipping:',
            err.message
          );
          return next();
        });
    },

    // If a bearer token is present & valid, put it in req.token.
    // If a token is present but revoked or missing iat, actively reject with 401.
    parseAuthToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7, authHeader.length);

      if (!token) {
        return next();
      }

      return TokenService.verify(token, (err, responseToken) => {
        if (err) {
          sails.log.warn('Token verification failed:', err.message);
          return next();
        }

        if (!responseToken.iat) {
          sails.log.warn('Token missing iat claim, rejecting');
          res.status(401);
          return res.json({ message: 'Token missing iat claim.' });
        }

        if (
          sails.services.blacklistservice.isRevoked(
            responseToken.id,
            responseToken.iat
          )
        ) {
          sails.log.info('Token revoked for user', responseToken.id);
          res.status(401);
          return res.json({ message: 'Token has been revoked.' });
        }

        const groupNames = (responseToken.groups || []).map((g) => g.name);
        sails.log.info(
          'Authenticated user:',
          JSON.stringify({
            id: responseToken.id,
            nickname: responseToken.nickname,
            groups: groupNames,
          })
        );
        req.token = responseToken;
        return next();
      });
    },

    /** *************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests.       *
     *                                                                          *
     * https://sailsjs.com/config/http#?customizing-the-body-parser             *
     *                                                                          *
     ************************************************************************** */

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

    // eslint-disable-next-line func-names
    fileMiddleware: (function () {
      const inMemoryStorage = multer.memoryStorage();
      // File size is 100 Mo (Mb)
      //
      // defParamCharset: 'utf8' fixes mojibake for non-ASCII filenames.
      // It only affects the legacy `filename=` parameter in Content-Disposition
      // headers (RFC 2047). Modern browsers using RFC 5987 `filename*=UTF-8''…`
      // are already decoded correctly by busboy regardless of this setting.
      const upload = multer({
        storage: inMemoryStorage,
        limits: { fileSize: 100 * 1024 * 1024 },
        defParamCharset: 'utf8',
      });
      return upload.fields([{ name: 'files' }, { name: 'file', maxCount: 1 }]);
    })(),

    // Logs each request to the console
    requestLogger(req, res, next) {
      sails.log.info('Req ::', req.method, req.url);
      sails.log.info(
        'Client data:',
        JSON.stringify({
          ip: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          origin: req.headers.origin || req.headers.referer || 'unknown',
        })
      );
      return next();
    },

    // Logs each request response to the console (with status and time)
    responseTimeLogger(req, res, next) {
      const { traceId } = req;
      res.on('finish', () => {
        logger.run(traceId, () => {
          const logLevel = res.statusCode >= 500 ? 'error' : 'info';
          sails.log[logLevel](
            'Res ::',
            req.method,
            req.url,
            res.statusCode,
            res.get('X-Response-Time')
          );

          if (res.statusCode >= 500) {
            sails.log.error(
              'Request data:',
              JSON.stringify({
                body: sanitize(req.body),
                params: req.params,
                query: sanitize(req.query),
              })
            );
          }
        });
      });
      responseTime()(req, res, next);
    },

    // Serve locally stored uploads in dev mode (when AZURE_KEY is not set).
    // Maps /local-uploads/* to the .local-uploads/ directory at the project root.
    // In production this middleware is a no-op since files are served from Azure.
    localUploads: process.env.AZURE_KEY
      ? (req, res, next) => next()
      : (req, res, next) => {
          const LOCAL_PREFIX = '/local-uploads/';
          if (!req.url.startsWith(LOCAL_PREFIX)) {
            return next();
          }
          const relativePath = req.url.slice(LOCAL_PREFIX.length);
          const filePath = path.resolve(
            __dirname,
            '../.local-uploads',
            relativePath
          );
          // Prevent path traversal (trailing separator avoids matching siblings
          // like '.local-uploads-x')
          const uploadsRoot =
            path.resolve(__dirname, '../.local-uploads') + path.sep;
          if (!filePath.startsWith(uploadsRoot)) {
            return res.sendStatus(403);
          }
          if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            return res.sendStatus(404);
          }
          res.set('X-Local-Storage', 'true');
          return res.sendFile(filePath);
        },
  },

  /** *************************************************************************
   *                                                                          *
   * The number of seconds to cache flat files on disk being served by        *
   * Express static middleware (by default, these files are in `.tmp/public`) *
   *                                                                          *
   * The HTTP static cache is only active in a 'production' environment,      *
   * since that's the only time Express will cache flat-files.                *
   *                                                                          *
   ************************************************************************** */

  // cache: 31557600000
};
