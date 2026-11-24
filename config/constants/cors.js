/**
 * CORS constants shared by the `corsHeaders` middleware (config/http.js) and
 * Sails' own CORS settings (config/security.js).
 *
 * Browser JavaScript on another origin can only read the response headers
 * listed in Access-Control-Expose-Headers (plus the CORS-safelisted ones).
 * X-Trace-Id lets a client quote the request to support (#2008). Retry-After
 * and the RateLimit-* headers, sent by express-rate-limit (`standardHeaders:
 * true`, Retry-After on a 429 only), let the front end wait for the real reset
 * time instead of a fixed pause (#2019).
 */

const EXPOSED_RESPONSE_HEADERS = Object.freeze([
  'X-Trace-Id',
  'Retry-After',
  'RateLimit-Policy',
  'RateLimit-Limit',
  'RateLimit-Remaining',
  'RateLimit-Reset',
]);

module.exports = {
  EXPOSED_RESPONSE_HEADERS,
  // Value of the Access-Control-Expose-Headers response header.
  EXPOSED_RESPONSE_HEADERS_VALUE: EXPOSED_RESPONSE_HEADERS.join(', '),
};
