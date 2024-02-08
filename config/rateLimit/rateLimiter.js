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
    standardHeaders: true,
    statusCode: 429,
    skip: async (req) => {
      // Ignore OPTIONS request
      if (req.method.toUpperCase() === 'OPTIONS') {
        return true;
      }

      // Currently, ignore limiting when in test
      if (process.env.NODE_ENV === 'test') {
        return true;
      }

      // If you are not authenticated, you are limited
      if (!req.token) {
        return false;
      }
      const hasNoRequestLimit =
        RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR) ||
        RightService.hasGroup(req.token.groups, RightService.G.MODERATOR);

      return hasNoRequestLimit;
    },
  }),

  userDeleteRateLimit: rateLimit({
    windowMs: process.env.USER_DELETE_RATE_LIMIT_WINDOWS
      ? process.env.USER_DELETE_RATE_LIMIT_WINDOWS
      : 12 * 60 * 60 * 1000, // 12h
    max: process.env.USER_DELETE_RATE_LIMIT_PER_WINDOW
      ? process.env.USER_DELETE_RATE_LIMIT_PER_WINDOW
      : 1, // limit each IP to 1 request per windowMs
    message:
      'Too many DELETE requests with the same IP as an user, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: async (req) => {
      // Ignore request others than DELETE
      if (req.method.toUpperCase() !== 'DELETE') {
        return true;
      }
      // If you are not authenticated, you are limited
      if (!req.token) {
        return false;
      }
      // If the request doesn't come from our main client and the app is not in test phase,
      // you are limited
      if (
        req.headers.origin !== sails.config.custom.baseUrl &&
        process.env.NODE_ENV !== 'test'
      ) {
        sails.log.error(
          `User ${req.token.nickname} (id=${req.token.id}) is being limited because the request doesn't come from our main client app.`
        );
        return false;
      }

      const hasNoRequestLimit =
        RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR) ||
        RightService.hasGroup(req.token.groups, RightService.G.MODERATOR);
      if (!hasNoRequestLimit) {
        sails.log.error(
          `User ${req.token.nickname} (id=${req.token.id}) is being limited on DELETE requests as an user.`
        );
      }

      return hasNoRequestLimit;
    },
  }),

  moderatorDeleteRateLimit: rateLimit({
    windowMs: process.env.MODERATOR_DELETE_RATE_LIMIT_WINDOWS
      ? process.env.MODERATOR_DELETE_RATE_LIMIT_WINDOWS
      : 1 * 60 * 60 * 1000, // 1h
    max: process.env.MODERATOR_DELETE_RATE_LIMIT_PER_WINDOW
      ? process.env.MODERATOR_DELETE_RATE_LIMIT_PER_WINDOW
      : 20, // limit each IP to  request per windowMs
    message:
      'Too many DELETE requests with the same IP as a moderator, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: async (req) => {
      // Ignore request others than DELETE
      if (req.method.toUpperCase() !== 'DELETE') {
        return true;
      }
      if (!req.token) {
        return false;
      }

      const hasNoRequestLimit = RightService.hasGroup(
        req.token.groups,
        RightService.G.ADMINISTRATOR
      );

      if (!hasNoRequestLimit) {
        sails.log.error(
          `User ${req.token.nickname} (id=${req.token.id}) is being limited on DELETE requests as an user.`
        );
      }

      return hasNoRequestLimit;
    },
  }),
};
