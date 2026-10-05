const { ipKeyGenerator } = require('express-rate-limit');

const V4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/;
const BRACKETED_V6 = /^\[([^\]]+)\](?::\d+)?$/;

/**
 * Strip the source port from a client IP as it appears in `req.ip`.
 *
 * Behind Azure App Service with `trustProxy: 1`, `req.ip` is the last
 * X-Forwarded-For entry, which carries the client's ephemeral source port
 * (e.g. "37.58.156.218:10308"). The port changes with every TCP connection,
 * so it must be removed before the value is used to identify a client.
 *
 * Shape-aware, because a bare IPv6 address usually ends in a numeric group
 * and a naive `replace(/:\d+$/, '')` would corrupt it (and collide distinct
 * addresses, e.g. "2001:db8::1" and "2001:db8::2" both becoming "2001:db8:"):
 *   - "[v6]:port" / "[v6]"         -> "v6"
 *   - "::ffff:a.b.c.d[:port]"     -> "a.b.c.d" (IPv4-mapped IPv6)
 *   - exactly one ":" ("v4:port") -> "v4"; an IPv6 address always has two or more
 *   - anything else (bare IPv6)   -> unchanged
 *
 * The result is lower-cased and trimmed. Blank or missing input yields
 * undefined.
 *
 * @param {*} raw - typically `req.ip`
 * @returns {string|undefined}
 */
const normalizeClientIp = (raw) => {
  if (raw === null || raw === undefined) return undefined;
  const ip = String(raw).trim().toLowerCase();
  if (ip.length === 0) return undefined;

  const bracketed = ip.match(BRACKETED_V6);
  if (bracketed) return bracketed[1];

  const mapped = ip.match(V4_MAPPED);
  if (mapped) return mapped[1];

  if ((ip.match(/:/g) || []).length === 1) return ip.split(':')[0];

  return ip;
};

/**
 * Rate-limit bucket key for a client IP.
 *
 * After the port is stripped, express-rate-limit's `ipKeyGenerator` groups
 * IPv6 addresses by /56 subnet. A single IPv6 subscriber is usually allocated
 * a /64 or larger, so keying on the full /128 would let one client rotate
 * through unlimited buckets. IPv4 addresses are returned unchanged.
 *
 * @param {*} raw - typically `req.ip`
 * @returns {string}
 */
const rateLimitKey = (raw) => {
  const ip = normalizeClientIp(raw);
  return ip ? ipKeyGenerator(ip) : 'unknown';
};

module.exports = { normalizeClientIp, rateLimitKey };
