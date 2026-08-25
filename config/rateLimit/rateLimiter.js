const rateLimit = require('express-rate-limit');
const RightService = require('../../api/services/RightService');

/**
 * Custom key generator that uses req.ip as-is, bypassing express-rate-limit's
 * built-in IP validation. Azure App Service may forward IPs with a port suffix
 * (e.g. "1.2.3.4:52241") which the library's default ipKeyGenerator rejects
 * with ERR_ERL_INVALID_IP_ADDRESS. Since the key only needs to be a consistent
 * string per client, req.ip works directly without normalization.
 *
 * We also set `validate: { keyGeneratorIpFallback: false }` on each limiter to
 * suppress the ERR_ERL_KEY_GEN_IPV6 warning. The library detects that we
 * reference req.ip without calling its ipKeyGenerator helper, but our use-case
 * is safe: we treat the IP as an opaque string key rather than parsing it.
 *
 * @see https://express-rate-limit.github.io/ERR_ERL_INVALID_IP_ADDRESS/
 * @see https://express-rate-limit.github.io/ERR_ERL_KEY_GEN_IPV6/
 */
const keyGenerator = (req) => req.ip || 'unknown';

// 10-minute window for general requests
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// 1-hour window for DELETE requests
const DELETE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
// 15-minute window for auth endpoints (login, signup, forgot-password, change-password)
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

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
 * Builds the `handler` that express-rate-limit invokes when a limit is exceeded.
 *
 * Without this, rejections are invisible in the logs. `generalRateLimit`,
 * `deleteRateLimit` and `authRateLimit` all run *before* `responseTimeLogger`
 * and `requestLogger` in the middleware order (see config/http.js), and the
 * library's default handler responds without calling `next()`. Neither the
 * `Req ::` nor the `Res ::` line is ever emitted, so a 429 leaves no trace
 * beyond Azure's own HTTP logs — which carry no trace ID to correlate with.
 *
 * Overriding `handler` replaces the default responder entirely, so this must
 * also send the response itself.
 *
 * `options.limit` is NOT the effective limit: it holds the `max` function
 * unresolved, because `options` is computed once when the limiter is created.
 * The resolved per-request numbers live on `req.rateLimit`.
 *
 * sails.log is patched by api/utils/logger.js to prefix the trace ID, and
 * `traceId` runs first in the middleware order, so these lines correlate with
 * the X-Trace-Id header the client received.
 */
const limitExceededHandler = (limiterName) => (req, res, next, options) => {
  // Guarded: a throw here would turn the 429 into a 500 and let the request
  // through unlabelled. Tests exercise these limiters on a bare express app
  // where the sails global may be absent.
  if (typeof sails !== 'undefined' && sails.log && sails.log.warn) {
    sails.log.warn(
      'Rate limit exceeded:',
      JSON.stringify({
        limiter: limiterName,
        ip: req.ip,
        method: req.method,
        path: req.path,
        userId: req.token ? req.token.id : undefined,
        nickname: req.token ? req.token.nickname : undefined,
        limit: req.rateLimit ? req.rateLimit.limit : undefined,
        used: req.rateLimit ? req.rateLimit.used : undefined,
        windowMs: options.windowMs,
      })
    );
  }

  // Mirrors the library's default handler.
  res.status(options.statusCode);
  if (!res.writableEnded) res.send(options.message);
};

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

/**
 * Patterns matching relation/association DELETE endpoints.
 * These routes only remove a link between two entities — no data is destroyed.
 * They are exempt from the restrictive DELETE rate limit.
 *
 * MAINTENANCE: When adding a new relation DELETE route in config/routes.js,
 * add a corresponding pattern here so the new route is not subject to the
 * restrictive 1-per-hour DELETE rate limit.
 *
 * Covered routes:
 *   DELETE /api/v1/entrances/:entranceId/cavers/:caverId
 *   DELETE /api/v1/caves/:caveId/organizations/:organizationId
 *   DELETE /api/v1/cavers/:caverId/organizations/:organizationId
 *   DELETE /api/v1/cavers/:caverId/groups/:groupId
 *   DELETE /api/v1/countries/:id/organizations/:organizationId
 *   DELETE /api/v1/countries/:countryId/regions/:regionId/organizations/:organizationId
 *   DELETE /api/v1/massifs/:id/organizations/:organizationId
 *   DELETE /api/v1/entrances/:entranceId/documents/:documentId
 *   DELETE /api/v1/caves/:caveId/documents/:documentId
 *   DELETE /api/v1/massifs/:massifId/documents/:documentId
 */
const RELATION_DELETE_PATTERNS = [
  /^\/api\/v1\/entrances\/\d+\/cavers\/\d+$/,
  /^\/api\/v1\/caves\/\d+\/organizations\/\d+$/,
  /^\/api\/v1\/cavers\/\d+\/organizations\/\d+$/,
  /^\/api\/v1\/cavers\/\d+\/groups\/\d+$/,
  /^\/api\/v1\/countries\/\d+\/organizations\/\d+$/,
  /^\/api\/v1\/countries\/\d+\/regions\/\d+\/organizations\/\d+$/,
  /^\/api\/v1\/massifs\/\d+\/organizations\/\d+$/,
  /^\/api\/v1\/entrances\/\d+\/documents\/\d+$/,
  /^\/api\/v1\/caves\/\d+\/documents\/\d+$/,
  /^\/api\/v1\/massifs\/\d+\/documents\/\d+$/,
];

const isRelationDelete = (path) =>
  RELATION_DELETE_PATTERNS.some((pattern) => pattern.test(path));

module.exports = {
  generalRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: generalMax,
    keyGenerator,
    message: 'Too many requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('general'),
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
    keyGenerator,
    message: 'Too many DELETE requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('delete'),
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

      // Relation DELETE routes only remove an association row — no entity is
      // destroyed. tokenAuth ensures the caller is authenticated, and the
      // controller enforces ownership/authorization. Skip the restrictive
      // DELETE rate limit so users can freely manage associations.
      // The general rate limiter still applies to these routes.
      if (isRelationDelete(req.path)) {
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

  /**
   * Stricter rate limiter for authentication endpoints.
   * Limits unauthenticated callers to 10 attempts per 15-minute window per IP.
   * This protects against brute-force login, credential stuffing, and
   * password-reset abuse.
   *
   * Administrators are intentionally NOT exempted here — auth endpoints are the
   * primary brute-force target and must be rate-limited uniformly regardless of
   * role. An attacker does not yet have a valid token when hammering /login.
   */
  authRateLimit: rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: parseLimit(process.env.AUTH_RATE_LIMIT, 10),
    keyGenerator,
    message:
      'Too many authentication attempts from this IP, please try again later.',
    standardHeaders: true,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('auth'),
    skip: () => isTestOrDev(),
  }),

  /**
   * Admin-specific authentication rate limiter.
   * Limits login attempts targeting Administrator accounts to 5 per 15-minute
   * window per IP. Uses a separate `admin:` key prefix so that admin-targeted
   * and non-admin-targeted attempts are tracked under independent counters
   * (Requirement 6.6).
   *
   * This is applied conditionally by the adminAuthRateLimit middleware in
   * config/http.js, which looks up the email in the request body to determine
   * whether the target account belongs to the Administrator group.
   */
  adminAuthRateLimit: rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: parseLimit(process.env.ADMIN_AUTH_RATE_LIMIT, 5),
    message:
      'Too many authentication attempts from this IP, please try again later.',
    standardHeaders: true,
    statusCode: 429,
    keyGenerator: (req) => `admin:${req.ip || 'unknown'}`,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('adminAuth'),
    skip: () => isTestOrDev(),
  }),
};
