/* eslint-disable global-require */
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
const rateLimiter = require('./rateLimit/rateLimiter');
const { version: packageVersion } = require('../package.json');
const TokenService = require('../api/services/TokenService');

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
    userDeleteRateLimit: rateLimiter.userDeleteRateLimit,
    moderatorDeleteRateLimit: rateLimiter.moderatorDeleteRateLimit,

    /** *************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ************************************************************************** */

    order: [
      'parseAuthToken',
      'generalRateLimit',
      'userDeleteRateLimit',
      'moderatorDeleteRateLimit',
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
    parseAuthToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7, authHeader.length);

      if (token) {
        TokenService.verify(token, (err, responseToken) => {
          if (!err) {
            req.token = responseToken; // This is the decrypted token or the payload you provided
          }
        });
      }
      return next();
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
      const multer = require('multer');
      const inMemoryStorage = multer.memoryStorage();
      // File size is 100 Mo (Mb)
      const upload = multer({ storage: inMemoryStorage, fileSize: 100000000 });
      return upload.fields([{ name: 'files' }]);
    })(),
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
