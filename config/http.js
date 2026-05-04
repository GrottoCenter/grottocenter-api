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
const rateLimiter = require('./rateLimit/rateLimiter');
const { version: packageVersion } = require('../package.json');
const TokenService = require('../api/services/TokenService');
const logger = require('../api/utils/logger');
const sanitize = require('../api/utils/sanitize');

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

    /** *************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ************************************************************************** */

    order: [
      'traceId',
      'corsHeaders',
      'parseAuthToken',
      'generalRateLimit',
      'deleteRateLimit',
      'responseTimeLogger',
      'requestLogger',
      'fileMiddleware',
      'bodyParser',
      'compress',
      'poweredBy',
      'addPackageVersionHeader',
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

        sails.log.info('Authenticated user', responseToken);
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
        fileSize: 100000000,
        defParamCharset: 'utf8',
      });
      return upload.fields([{ name: 'files' }]);
    })(),

    // Logs each request to the console
    requestLogger(req, res, next) {
      sails.log.info('Req ::', req.method, req.url);
      sails.log.info('Client data:', {
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin || req.headers.referer || 'unknown',
      });
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
              JSON.stringify(
                {
                  body: sanitize(req.body),
                  params: req.params,
                  query: sanitize(req.query),
                },
                null,
                2
              )
            );
          }
        });
      });
      responseTime()(req, res, next);
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
