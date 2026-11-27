const rateLimit = require('express-rate-limit');
const RightService = require('../../api/services/RightService');
const { normalizeClientIp, rateLimitKey } = require('../../api/utils/clientIp');

/**
 * Keys every limiter on the client IP with its source port stripped.
 *
 * Behind Azure App Service (`trustProxy: 1`), `req.ip` carries the client's
 * ephemeral source port (e.g. "1.2.3.4:52241"). Keying on it verbatim gave
 * each TCP connection its own bucket, so a client opening a fresh connection
 * per request was never throttled (#1787). `rateLimitKey` strips the port
 * shape-aware and groups IPv6 by /56 via the library's ipKeyGenerator.
 *
 * This assumes requests reach App Service directly. api.grottocenter.org is a
 * DNS-only (not Cloudflare-proxied) CNAME; if a proxy or CDN is ever put in
 * front, `trustProxy` must account for the extra hop, or every client would
 * be keyed on the proxy's IP and share one bucket.
 *
 * `validate: { keyGeneratorIpFallback: false }` stays on each limiter: the
 * library flags any keyGenerator whose source mentions req.ip without the
 * literal text "ipKeyGenerator", even though rateLimitKey calls it.
 *
 * @see https://express-rate-limit.github.io/ERR_ERL_INVALID_IP_ADDRESS/
 * @see https://express-rate-limit.github.io/ERR_ERL_KEY_GEN_IPV6/
 */
const keyGenerator = (req) => rateLimitKey(req.ip);

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

// Trusted services (the OAI and Z39.50 servers) call the API from a fixed IP, so
// the public limits would be shared by all their clients. Those IPs get their
// own, higher cap on the general bucket; the servers limit their own clients
// (Z39.50: per-IP limits in z3950/lib/Z3950/Limits.pm) and the edge does the rest.
// TRUSTED_SERVICE_IPS is a comma-separated list; unset or empty trusts nobody.
// Addresses are compared in canonical form, so equivalent IPv6 spellings
// (`2001:db8::1`, `2001:0db8:0:0::1`) match. Trusted requests get their own
// bucket key, so IPv6 neighbours in the same /56 never share their counter.
const canonicalIp = (raw) => {
  const ip = normalizeClientIp(raw);
  if (!ip || !ip.includes(':')) return ip;
  try {
    return new URL(`http://[${ip}]`).hostname.slice(1, -1);
  } catch (e) {
    return ip;
  }
};
const TRUSTED_SERVICE_IPS = new Set(
  (process.env.TRUSTED_SERVICE_IPS || '')
    .split(',')
    .map(canonicalIp)
    .filter(Boolean)
);
const TRUSTED_SERVICE_MAX = parseLimit(
  process.env.TRUSTED_SERVICE_RATE_LIMIT,
  10000
);

// Dedicated limits for GET /api/v1/geoloc/* (map browsing), per 10-minute
// window, by role. These requests are counted here only, never in the general
// bucket, so a busy map cannot lock an IP out of login or any other endpoint.
const GEOLOC_VISITOR_MAX = parseLimit(
  process.env.GEOLOC_VISITOR_RATE_LIMIT,
  600
);
const GEOLOC_USER_MAX = parseLimit(process.env.GEOLOC_USER_RATE_LIMIT, 1200);
const GEOLOC_LEADER_MAX = parseLimit(
  process.env.GEOLOC_LEADER_RATE_LIMIT,
  2400
);
const GEOLOC_MODERATOR_MAX = parseLimit(
  process.env.GEOLOC_MODERATOR_RATE_LIMIT,
  10000
);

// DELETE request limits per 1-hour window, by role
const USER_DELETE_MAX = parseLimit(process.env.USER_DELETE_RATE_LIMIT, 1);
const DELETE_MAX = parseLimit(process.env.DELETE_RATE_LIMIT, 20);
// Administrators are not rate-limited on DELETEs either

const isTestOrDev = () =>
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

/**
 * Builds the `handler` that express-rate-limit invokes when a limit is exceeded.
 *
 * `generalRateLimit`, `geolocRateLimit`, `deleteRateLimit` and `authRateLimit`
 * all run *before* `requestLogger` in the middleware order (see config/http.js), and the
 * library's default handler responds without calling `next()`, so a 429 has no
 * `Req ::` line. `responseTimeLogger` runs earlier and still writes its
 * `Res ::` and `Access ::` lines (#1788), but only this one says which limiter
 * fired and at what limit.
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
        ip: normalizeClientIp(req.ip),
        rawIp: req.ip,
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
 * Builds a `max` function that picks a limit from the caller's role.
 * Unauthenticated visitors get the lowest cap; higher roles get progressively
 * more headroom. Administrators are skipped entirely by each limiter's `skip`.
 */
const tierMax =
  ({ visitor, user, leader, moderator }) =>
  (req) => {
    if (!req.token) return visitor;

    const { groups } = req.token;
    if (RightService.hasGroup(groups, RightService.G.MODERATOR)) {
      return moderator;
    }
    if (RightService.hasGroup(groups, RightService.G.LEADER)) {
      return leader;
    }
    return user;
  };

const roleGeneralMax = tierMax({
  visitor: VISITOR_MAX,
  user: USER_MAX,
  leader: LEADER_MAX,
  moderator: MODERATOR_MAX,
});

/**
 * Whether the request comes from one of the TRUSTED_SERVICE_IPS. Only the
 * client IP is checked, never a header the caller controls: `req.ip` is the
 * address Azure App Service appended (`trustProxy: 1`).
 */
const isTrustedService = (req) =>
  TRUSTED_SERVICE_IPS.size > 0 && TRUSTED_SERVICE_IPS.has(canonicalIp(req.ip));

const generalKey = (req) =>
  isTrustedService(req) ? `trusted:${canonicalIp(req.ip)}` : keyGenerator(req);

const generalMax = (req) =>
  isTrustedService(req) ? TRUSTED_SERVICE_MAX : roleGeneralMax(req);

const geolocMax = tierMax({
  visitor: GEOLOC_VISITOR_MAX,
  user: GEOLOC_USER_MAX,
  leader: GEOLOC_LEADER_MAX,
  moderator: GEOLOC_MODERATOR_MAX,
});

/**
 * Whether a request belongs to the dedicated geoloc bucket: any GET (or HEAD)
 * under /api/v1/geoloc/, which covers every declared geoloc route and its
 * historical aliases (caves, grottos, countEntries, cavesCoordinates).
 *
 * The prefix match is deliberate: a geoloc route added later is covered
 * without touching this file. The trade-off is that an undeclared path such as
 * `GET /api/v1/geoloc/foo` is counted in the geoloc bucket too; it only
 * returns a cheap 404, so that is harmless.
 *
 * MAINTENANCE: a test checks that every `GET /api/v1/geoloc/*` entry of
 * config/routes.js matches this function.
 */
const GEOLOC_PATH = /^\/api\/v1\/geoloc\//i;
const isGeolocRead = (req) =>
  ['GET', 'HEAD'].includes(req.method.toUpperCase()) &&
  GEOLOC_PATH.test(req.path);

const isAdministrator = (req) =>
  Boolean(
    req.token &&
    RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR)
  );

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
  isGeolocRead,
  isTrustedService,

  generalRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: generalMax,
    keyGenerator: generalKey,
    message: 'Too many requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('general'),
    skip: (req) => {
      if (req.method.toUpperCase() === 'OPTIONS') return true;
      if (isTestOrDev()) return true;

      // Geoloc reads are governed by geolocRateLimit only
      if (isGeolocRead(req)) return true;

      // Administrators bypass general rate limiting
      return isAdministrator(req);
    },
  }),

  /**
   * Dedicated limiter for GET /api/v1/geoloc/*, shared across every geoloc
   * route by client IP. Requests it governs are skipped by `generalRateLimit`
   * (and the reverse), so exhausting one budget never blocks the other.
   */
  geolocRateLimit: rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: geolocMax,
    keyGenerator,
    message: 'Too many map requests with the same IP, try again later.',
    standardHeaders: true,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('geoloc'),
    skip: (req) => {
      if (!isGeolocRead(req)) return true;
      if (isTestOrDev()) return true;

      // Administrators bypass geoloc rate limiting
      return isAdministrator(req);
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
    keyGenerator: (req) => `admin:${keyGenerator(req)}`,
    validate: { keyGeneratorIpFallback: false },
    handler: limitExceededHandler('adminAuth'),
    skip: () => isTestOrDev(),
  }),
};
