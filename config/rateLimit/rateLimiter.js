const rateLimit = require('express-rate-limit');
const RightService = require('../../api/services/RightService');

module.exports = {
  generalRateLimit: rateLimit({
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
        .intercept('rightNotFound', () =>
          res.serverError(
            'A server error occured when checking your right to not having a request limit.'
          )
        );
      return hasNoRequestLimitPromise;
    },
  }),

  userDeleteRateLimit: rateLimit({
    windowMs: process.env.USER_DELETE_RATE_LIMIT_WINDOWS
      ? process.env.USER_DELETE_RATE_LIMIT_WINDOWS
      : 12 * 60 * 60 * 1000, // 12h
    max: process.env.USER_DELETE_RATE_LIMIT_PER_WINDOW
      ? process.env.USER_DELETE_RATE_LIMIT_PER_WINDOW
      : 1, // limit each IP to 1 request per windowMs
    message: 'Too many DELETE requests with the same IP, try again later.',
    statusCode: 429,
    skip: (req, res) => {
      // Ignore request others than DELETE
      if (req.method.toUpperCase() !== 'DELETE') {
        return true;
      }
      // If the request doesn't come from our main client and the app is not in test phase,
      // you are limited
      if (
        req.headers.origin !== sails.config.custom.baseUrl &&
        process.env.NODE_ENV !== 'test'
      ) {
        return false;
      }
      // If you are not authenticated, you are limited
      if (!req.token) {
        return false;
      }

      const hasNoRequestLimitPromise = sails.helpers.checkRight
        .with({
          groups: req.token.groups,
          rightEntity: RightService.RightEntities.APPLICATION,
          rightAction: RightService.RightActions.NO_USER_DELETE_REQUEST_LIMIT,
        })
        .intercept('rightNotFound', () =>
          res.serverError(
            'A server error occured when checking your right to not having a request limit on DELETE actions.'
          )
        );
      return hasNoRequestLimitPromise;
    },
  }),

  moderatorDeleteRateLimit: rateLimit({
    windowMs: process.env.MODERATOR_DELETE_RATE_LIMIT_WINDOWS
      ? process.env.MODERATOR_DELETE_RATE_LIMIT_WINDOWS
      : 1 * 60 * 60 * 1000, // 1h
    max: process.env.MODERATOR_DELETE_RATE_LIMIT_PER_WINDOW
      ? process.env.MODERATOR_DELETE_RATE_LIMIT_PER_WINDOW
      : 20, // limit each IP to 1 request per windowMs
    message: 'Too many DELETE requests with the same IP, try again later.',
    statusCode: 429,
    skip: (req, res) => {
      // Ignore request others than DELETE
      if (req.method.toUpperCase() !== 'DELETE') {
        return true;
      }
      if (!req.token) {
        return false;
      }

      const hasNoRequestLimitPromise = sails.helpers.checkRight
        .with({
          groups: req.token.groups,
          rightEntity: RightService.RightEntities.APPLICATION,
          rightAction:
            RightService.RightActions.NO_MODERATOR_DELETE_REQUEST_LIMIT,
        })
        .intercept('rightNotFound', () =>
          res.serverError(
            'A server error occured when checking your right to not having a request limit on DELETE actions.'
          )
        );
      return hasNoRequestLimitPromise;
    },
  }),
};
