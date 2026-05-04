const rateLimit = require('express-rate-limit');
const RightService = require('../../api/services/RightService');

// 10-minute window for general requests
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// 1-hour window for DELETE requests
const DELETE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// General request limits per 10-minute window, by role.
// Each tier can be overridden via environment variables for tuning in production.
// We use ?? so that an explicit `0` is honoured (e.g. to fully block a tier).
const parseLimit = (envValue, fallback) => {
  if (envValue === undefined) return fallback;
  const n = Number(envValue);
  return Number.isNaN(n) ? fallback : n;
};

const VISITOR_MAX = parseLimit(process.env.VISITOR_RATE_LIMIT, 200);
const USER_MAX = parseLimit(process.env.USER_RATE_LIMIT, 400);
const LEADER_MAX = parseLimit(process.env.LEADER_RATE_LIMIT, 1000);
const MODERATOR_MAX = parseLimit(process.env.MODERATOR_RATE_LIMIT, 10000);
// Administrators are not rate-limited (skip returns true)

// DELETE request limits per 1-hour window, by role
const USER_DELETE_MAX = parseLimit(process.env.USER_DELETE_RATE_LIMIT, 1);
const DELETE_MAX = parseLimit(process.env.DELETE_RATE_LIMIT, 20);
// Administrators are not rate-limited on DELETEs either

const isTestOrDev = () =>
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

/**
 * Returns the general rate limit for a request based on the caller's role.
 * Unauthenticated visitors get the lowest cap; higher roles get progressively
 * more headroom. Administrators are skipped entirely (see `skip`).
 */
const generalMax = (req) => {
  if (!req.token) return VISITOR_MAX;

  const { groups } = req.token;
  if (RightService.hasGroup(groups, RightService.G.MODERATOR)) {
    return MODERATOR_MAX;
  }
  if (RightService.hasGroup(groups, RightService.G.LEADER)) {
    return LEADER_MAX;
  }
  return USER_MAX;
};

/**
 * Returns the DELETE rate limit for a request based on the caller's role.
 * Regular users get a very tight cap; leaders and moderators share a higher
 * one. Administrators are skipped entirely (see `skip`).
 *
 * Note: all DELETE routes require `tokenAuth` (see config/policies.js), so
 * unauthenticated requests are rejected before reaching the controller.
 * The !req.token branch below is defense-in-depth in case a DELETE route is
 * ever exposed without auth — it applies the most restrictive limit.
 */
const deleteMax = (req) => {
  if (!req.token) return USER_DELETE_MAX;

  const { groups } = req.token;
  if (
    RightService.hasGroup(groups, RightService.G.MODERATOR) ||
    RightService.hasGroup(groups, RightService.G.LEADER)
  ) {
    return DELETE_MAX;
  }
  return USER_DELETE_MAX;
};

module.exports = {
  generalRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: generalMax,
    message: 'Too many requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: (req) => {
      if (req.method.toUpperCase() === 'OPTIONS') return true;
      if (isTestOrDev()) return true;

      // Administrators bypass general rate limiting
      if (
        req.token &&
        RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR)
      ) {
        return true;
      }

      return false;
    },
  }),

  deleteRateLimit: rateLimit({
    windowMs: DELETE_RATE_LIMIT_WINDOW_MS,
    max: deleteMax,
    message: 'Too many DELETE requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    skip: (req) => {
      if (req.method.toUpperCase() !== 'DELETE') return true;
      if (isTestOrDev()) return true;

      // Administrators bypass DELETE rate limiting
      if (
        req.token &&
        RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR)
      ) {
        return true;
      }

      // Third-party origins are always limited (handled by generalRateLimit)
      if (req.token && req.headers.origin !== sails.config.custom.baseUrl) {
        sails.log.error(
          `User ${req.token.nickname} (id=${req.token.id}) is being limited on DELETE requests because the request doesn't come from our main client app.`
        );
        return false;
      }

      return false;
    },
  }),
};
