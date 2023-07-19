const rateLimit = require('express-rate-limit');

const RATE_LIMIT_WINDOW = 600000; // 10 minutes
const DELETE_RATE_LIMIT_WINDOW = 3600000; // 1 hour

const VISITOR_RATE_LIMIT_PER_WINDOW = 200;
const USER_RATE_LIMIT_PER_WINDOW = 400;
const USER_DELETE_RATE_LIMIT_PER_WINDOW = 1;
const DELETE_RATE_LIMIT_PER_WINDOW = 20;
const LEADER_RATE_LIMIT_PER_WINDOW = 1000;
const MODERATOR_RATE_LIMIT_PER_WINDOW = 10000;

const ADMIN_GROUP_NAME = 'Administrator';
const LEADER_GROUP_NAME = 'Leader';
const MODERATOR_GROUP_NAME = 'Moderator';

const isAdmin = (token) =>
  token?.groups.some((g) => g.name === ADMIN_GROUP_NAME);
const isLeader = (token) =>
  token?.groups.some((g) => g.name === LEADER_GROUP_NAME);
const isModerator = (token) =>
  token?.groups.some((g) => g.name === MODERATOR_GROUP_NAME);

// If an user is from group X, it is also from other "less important" groups.
// Admin > Moderator > Leader > User
// So, to check only with isUser() is not enough to know the "real" group of an user
const isMoreThanUser = (token) =>
  isLeader(token) || isModerator(token) || isAdmin(token);
const isMoreThanLeader = (token) => isModerator(token) || isAdmin(token);
const isMoreThanModerator = (token) => isAdmin(token);

const isFromAnotherAppAndNotInTest = (req) =>
  req.headers.origin !== sails.config.custom.baseUrl &&
  process.env.NODE_ENV !== 'test';

module.exports = {
  visitorRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: VISITOR_RATE_LIMIT_PER_WINDOW,
    message:
      'Too many requests with the same IP as a visitor, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: async (req /* , res */) => {
      /* Ignore:
        - OPTIONS requests
        - login route
        - api in test env
       */
      if (
        req.method.toUpperCase() === 'OPTIONS' ||
        req.originalUrl.includes('login') ||
        process.env.NODE_ENV === 'test'
      ) {
        return true;
      }

      // If you are not authenticated, you are limited
      return !!req.token;
    },
  }),

  authenticatedRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: (req) => {
      if (!isMoreThanUser(req.token)) {
        return USER_RATE_LIMIT_PER_WINDOW;
      }
      if (!isMoreThanLeader(req.token)) {
        return LEADER_RATE_LIMIT_PER_WINDOW;
      }
      if (!isMoreThanModerator(req.token)) {
        return MODERATOR_RATE_LIMIT_PER_WINDOW;
      }
      return 0;
    },
    message:
      'Too many requests with the same IP as an authenticated user, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: async (req /* , res */) => {
      // Ignore DELETE requests (see userDeleteRateLimit below)
      if (req.method.toUpperCase() === 'DELETE') {
        return true;
      }

      // If you are not authenticated, you are limited
      if (!req.token) {
        return false;
      }

      if (isFromAnotherAppAndNotInTest(req)) {
        sails.log.error(
          `${req.token.nickname} (id=${req.token.id}) is being limited because the request doesn't come from our main client app.`
        );
        return false;
      }

      return false;
    },
  }),

  deleteRateLimit: rateLimit({
    windowMs: DELETE_RATE_LIMIT_WINDOW,
    max: (req) => {
      if (!isMoreThanUser(req.token)) {
        return USER_DELETE_RATE_LIMIT_PER_WINDOW;
      }
      if (isAdmin(req.token)) {
        return 0; // no limiting for admins
      }
      return DELETE_RATE_LIMIT_PER_WINDOW;
    },
    message: 'Too many DELETE requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: async (req /* , res */) => {
      // Ignore request others than DELETE
      if (req.method.toUpperCase() !== 'DELETE') {
        return true;
      }
      // If you are not authenticated, you are limited
      if (!req.token) {
        return false;
      }

      if (isFromAnotherAppAndNotInTest(req)) {
        sails.log.error(
          `${req.token.nickname} (id=${req.token.id}) is being limited because the request doesn't come from our main client app.`
        );
        return false;
      }

      return true;
    },
  }),
};
