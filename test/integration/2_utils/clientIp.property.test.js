/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');

const {
  normalizeClientIp,
  rateLimitKey,
} = require('../../../api/utils/clientIp');

/**
 * Behind Azure App Service, req.ip carries the client's source port
 * ("1.2.3.4:52241"), which changes with every TCP connection. These
 * properties pin down that the rate-limit key identifies the client, not the
 * connection, without collapsing distinct clients together.
 */

const port = fc.integer({ min: 0, max: 65535 });

// Eight hextets rendered without zero-padding or `::` compression, so the
// /56 prefix is known exactly. fc.ipV6() covers the compressed forms.
const hextets = fc.array(fc.integer({ min: 0, max: 0xffff }), {
  minLength: 8,
  maxLength: 8,
});
const toV6 = (h) => h.map((x) => x.toString(16)).join(':');

// Same first 56 bits: hextets 0-2 and the high byte of hextet 3.
const sameSlash56 = (a, b) => [
  ...a.slice(0, 3),
  Math.floor(a[3] / 256) * 256 + (b[3] % 256),
  ...b.slice(4),
];

const prefix56 = (h) => [h[0], h[1], h[2], Math.floor(h[3] / 256)].join(',');

describe('clientIp - Property: rate-limit key identifies the client, not the connection', () => {
  describe('Port invariance', () => {
    it('should key IPv4:port the same as the bare IPv4 address', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.ipV4(), port, (ip, p) => {
          should(rateLimitKey(`${ip}:${p}`)).equal(ip);
          should(rateLimitKey(ip)).equal(ip);
          should(normalizeClientIp(`${ip}:${p}`)).equal(ip);
        }),
        { numRuns: 200 }
      );
    });

    it('should key [IPv6]:port the same as the bare IPv6 address', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.ipV6(), port, (ip, p) => {
          should(rateLimitKey(`[${ip}]:${p}`)).equal(rateLimitKey(ip));
          should(rateLimitKey(`[${ip}]`)).equal(rateLimitKey(ip));
        }),
        { numRuns: 200 }
      );
    });

    it('should key IPv4-mapped IPv6, with or without a port, as the IPv4 address', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.ipV4(), port, (ip, p) => {
          should(rateLimitKey(`::ffff:${ip}`)).equal(ip);
          should(rateLimitKey(`::FFFF:${ip}:${p}`)).equal(ip);
          should(normalizeClientIp(`::ffff:${ip}`)).equal(ip);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe('No collisions between distinct clients', () => {
    it('should give distinct IPv4 addresses distinct keys whatever their ports', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.ipV4(), fc.ipV4(), port, port, (a, b, pa, pb) => {
          fc.pre(a !== b);
          should(rateLimitKey(`${a}:${pa}`)).not.equal(
            rateLimitKey(`${b}:${pb}`)
          );
        }),
        { numRuns: 200 }
      );
    });

    // The naive replace(/:\d+$/, '') turned "2001:db8::1" into "2001:db8:",
    // truncating bare IPv6 and colliding unrelated addresses.
    it('should leave a bare IPv6 address intact', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(hextets, (h) => {
          const ip = toV6(h);
          should(normalizeClientIp(ip)).equal(ip);
          should(normalizeClientIp(ip.toUpperCase())).equal(ip);
        }),
        { numRuns: 200 }
      );
    });

    it('should give IPv6 addresses in different /56 subnets distinct keys', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(hextets, hextets, (a, b) => {
          fc.pre(prefix56(a) !== prefix56(b));
          should(rateLimitKey(toV6(a))).not.equal(rateLimitKey(toV6(b)));
        }),
        { numRuns: 200 }
      );
    });
  });

  describe('IPv6 subnet grouping', () => {
    // A subscriber is usually allocated a /64 or larger; per-/128 keys would
    // let one client rotate through unlimited buckets.
    it('should give every address in the same /56 the same key', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(hextets, hextets, port, (a, b, p) => {
          const sibling = sameSlash56(a, b);
          should(rateLimitKey(`[${toV6(sibling)}]:${p}`)).equal(
            rateLimitKey(toV6(a))
          );
        }),
        { numRuns: 200 }
      );
    });
  });

  describe('Missing and malformed input', () => {
    [null, undefined, '', '   '].forEach((raw) => {
      it(`should map ${JSON.stringify(raw)} to the 'unknown' bucket`, () => {
        should(normalizeClientIp(raw)).be.undefined();
        should(rateLimitKey(raw)).equal('unknown');
      });
    });

    it('should strip surrounding whitespace before parsing', () => {
      should(rateLimitKey(' 37.58.156.218:10308 ')).equal('37.58.156.218');
    });

    it('should pass a non-IP string through without throwing', () => {
      should(rateLimitKey('garbage')).equal('garbage');
    });

    it('should key the IPv6 loopback by its /56', () => {
      should(rateLimitKey('::1')).equal('::/56');
    });
  });
});
