const { normalizeClientIp } = require('./clientIp');

/**
 * The fields of the `Access ::` line, one per request (#1788).
 *
 * Everything an analytics query needs sits on that one line, so consumers no
 * longer join `Req ::` and `Client data:` by trace ID.
 *
 * - `origin` and `referer` are kept apart. `Origin` is set by browsers and is
 *   scheme+host+port only; `Referer` is a full URL, often stripped, and
 *   client-controlled. Folding one into the other hid which signal a value was.
 * - A missing header is `null`, never a sentinel string. Native apps and HTTP
 *   libraries legitimately send no `Origin`, and `'unknown'` could not be told
 *   apart from a client sending that very value.
 * - `authenticated` and `userId` come from `req.token`, which parseAuthToken has
 *   already set. Nothing else from the token, and no other header, is copied.
 * - `path` has no query string: it groups cleanly and keeps parameter values off
 *   the line. The full URL is still on the `Res ::` line.
 *
 * Pure and free of any reference to the `sails` global.
 *
 * @param {object} req - Express request
 * @param {object} outcome
 * @param {number} outcome.status - HTTP status, 499 for a client abort
 * @param {number} outcome.durationMs
 * @returns {object}
 */
const accessLogEntry = (req, { status, durationMs }) => {
  const headers = req.headers || {};
  return {
    method: req.method,
    path: req.path ?? (req.url || '').split('?')[0],
    status,
    durationMs,
    ip: normalizeClientIp(req.ip) ?? null,
    userAgent: headers['user-agent'] ?? null,
    origin: headers.origin ?? null,
    referer: headers.referer ?? null,
    authenticated: !!req.token,
    userId: req.token?.id ?? null,
  };
};

module.exports = accessLogEntry;
