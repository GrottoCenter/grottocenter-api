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
const passport = require('passport');
const rateLimit = require('express-rate-limit');

module.exports.http = {
  /****************************************************************************
   *                                                                           *
   * Express middleware to use for every Sails request. To add custom          *
   * middleware to the mix, add a function to the middleware config object and *
   * add its key to the "order" array. The $custom key is reserved for         *
   * backwards-compatibility with Sails v0.9.x apps that use the               *
   * `customMiddleware` config option.                                         *
   *                                                                           *
   ****************************************************************************/

  middleware: {
    passportInit: passport.initialize(),
    passportSession: passport.session(),

    // Requests limiter configuration
    rateLimit: rateLimit({
      windowMs: process.env.RATE_LIMIT_WINDOW
        ? process.env.RATE_LIMIT_WINDOWS
        : 1 * 30 * 1000, // 30 seconds
      max: process.env.RATE_LIMIT_PER_WINDOW
        ? process.env.RATE_LIMIT_PER_WINDOW
        : 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests with the same IP, try again later.',
      statusCode: 429,
      skip: (req, res) => {
        // Ignore OPTIONS request
        if (req.method.toUpperCase() === 'OPTIONS') {
          return true;
        }
        // If you are not authenticated, you are limited
        if (!req.token) {
          return false;
        }
        const hasNoRequestLimitPromise = sails.helpers.checkRight
          .with({
            groups: req.token.groups,
            rightEntity: RightService.RightEntities.APPLICATION,
            rightAction: RightService.RightActions.NO_REQUEST_LIMIT,
          })
          .intercept('rightNotFound', (err) => {
            return res.serverError(
              'A server error occured when checking your right to not having a request limit.',
            );
          });
        return hasNoRequestLimitPromise;
      },
    }),

    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ***************************************************************************/

    order: [
      'cookieParser',
      'session',
      'passportInit',
      'passportSession',
      'parseAuthToken',
      'rateLimit',
      'bodyParser',
      'compress',
      'poweredBy',
      'router',
      'www',
    ],

    /****************************************************************************
     *                                                                           *
     * Example custom middleware; logs each request to the console.              *
     *                                                                           *
     ****************************************************************************/

    // myRequestLogger: function (req, res, next) {
    //     console.log("Requested :: ", req.method, req.url);
    //     return next();
    // }

    poweredBy: function(req, res, next) {
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

    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests.       *
     *                                                                          *
     * https://sailsjs.com/config/http#?customizing-the-body-parser             *
     *                                                                          *
     ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),
  },

  /***************************************************************************
   *                                                                          *
   * The number of seconds to cache flat files on disk being served by        *
   * Express static middleware (by default, these files are in `.tmp/public`) *
   *                                                                          *
   * The HTTP static cache is only active in a 'production' environment,      *
   * since that's the only time Express will cache flat-files.                *
   *                                                                          *
   ***************************************************************************/

  // cache: 31557600000
};
