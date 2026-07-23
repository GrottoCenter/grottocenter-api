/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const HoneypotGuard = require('../../../api/services/HoneypotGuard');

// --- Shared arbitraries ---

// Non-empty-after-trim strings (for Property 3)
const nonEmptyAfterTrim = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

// Whitespace-only strings (for Property 4)
const whitespaceOnly = fc
  .array(
    fc.constantFrom(' ', '\t', '\n', '\r', '\v', '\f', '\u00A0', '\u2003'),
    { minLength: 0, maxLength: 50 }
  )
  .map((chars) => chars.join(''));

/**
 * Property 3: Non-empty-after-trim website field triggers honeypot
 *
 * For any string that contains at least one non-whitespace character,
 * HoneypotGuard.check() returns { trapped: true } with the original value.
 *
 * Validates: Requirements 2.1
 */
describe('Feature: signup-anti-bot-protection, Property 3: Non-empty-after-trim website field triggers honeypot', () => {
  it('should return trapped: true with the original value for any non-empty-after-trim website field', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(nonEmptyAfterTrim, (website) => {
        const result = HoneypotGuard.check({ website });
        should(result.trapped).be.true();
        should(result.value).equal(website);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Empty or whitespace-only website field passes honeypot
 *
 * For any string composed entirely of whitespace characters (or undefined/null/absent),
 * HoneypotGuard.check() returns { trapped: false }.
 *
 * Validates: Requirements 2.3
 */
describe('Feature: signup-anti-bot-protection, Property 4: Empty or whitespace-only website field passes honeypot', () => {
  it('should return trapped: false for whitespace-only website field', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(whitespaceOnly, (website) => {
        const result = HoneypotGuard.check({ website });
        should(result.trapped).be.false();
      }),
      { numRuns: 100 }
    );
  });
});
