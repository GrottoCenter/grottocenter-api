const should = require('should');
const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const SsoService = require('../../../api/services/SsoService');

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Arbitrary for caver-like objects
const caverArb = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.oneof(fc.string({ minLength: 0, maxLength: 50 }), fc.constant(null)),
  surname: fc.oneof(
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.constant(null)
  ),
});

// Arbitrary for invalid product values
const invalidProductArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant(''),
  fc.integer(),
  fc.boolean(),
  fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => !Object.keys(SsoService.PRODUCT_REGISTRY).includes(s))
);

describe('SsoService - Property-Based Tests', () => {
  afterEach(() => {
    delete process.env.SSO_SALT_SUPERSET;
  });

  describe('Property 1: Payload construction correctness', () => {
    it('should produce correct payload fields for any caver and valid product', function payloadCorrectness() {
      this.timeout(10000);
      fc.assert(
        fc.property(caverArb, (caver) => {
          const payload = SsoService.buildPayload(caver, 'superset');

          should(payload.sub).equal(caver.id);
          should(payload.aud).equal('superset');
          should(payload.email).equal(`${caver.id}@grottocenter.org`);
          should(payload.firstName).equal(caver.name || '');
          should(payload.lastName).equal(caver.surname || '');
          should(payload.jti).match(UUID_V4_REGEX);
          should(typeof payload.jti).equal('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Token signing round-trip', () => {
    it('should produce a verifiable token with exp - iat === 30', () => {
      const saltArb = fc
        .string({ minLength: 1, maxLength: 64 })
        .filter((s) => s.trim().length > 0);

      fc.assert(
        fc.property(caverArb, saltArb, (caver, salt) => {
          process.env.SSO_SALT_SUPERSET = salt;
          const result = SsoService.issueToken(caver, 'superset');

          should(result.token).be.a.String();

          const decoded = jwt.verify(result.token, salt);
          should(decoded.sub).equal(caver.id);
          should(decoded.aud).equal('superset');
          should(decoded.email).equal(`${caver.id}@grottocenter.org`);
          should(decoded.exp - decoded.iat).equal(30);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: JTI uniqueness', () => {
    it('should generate distinct jti values across multiple calls', () => {
      fc.assert(
        fc.property(
          caverArb,
          fc.integer({ min: 2, max: 20 }),
          (caver, count) => {
            const jtis = new Set();
            for (let i = 0; i < count; i += 1) {
              const payload = SsoService.buildPayload(caver, 'superset');
              should(payload.jti).match(UUID_V4_REGEX);
              jtis.add(payload.jti);
            }
            should(jtis.size).equal(count);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Invalid product rejection', () => {
    it('should return error with status 400 for any invalid product', () => {
      fc.assert(
        fc.property(invalidProductArb, (product) => {
          const result = SsoService.resolveSalt(product);
          should(result.error).be.a.String();
          should(result.status).equal(400);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Missing salt returns server error', () => {
    // NOTE: This test relies on NODE_ENV !== 'development' (test runner uses NODE_ENV=test).
    // In development mode, the DEV_FALLBACK_SALT would activate and mask the 500.
    it('should return error with status 500 for any whitespace-only or empty salt', () => {
      const whitespaceSaltArb = fc.oneof(
        fc.constant(''),
        fc.constant('   '),
        fc.constant('\t'),
        fc.constant('\n'),
        fc.constant('  \t  '),
        fc.constant('\n\t ')
      );

      fc.assert(
        fc.property(whitespaceSaltArb, (salt) => {
          process.env.SSO_SALT_SUPERSET = salt;
          const result = SsoService.resolveSalt('superset');
          should(result.error).be.a.String();
          should(result.status).equal(500);
        }),
        { numRuns: 100 }
      );
    });
  });
});
