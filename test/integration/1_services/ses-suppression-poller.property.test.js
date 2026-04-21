/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const {
  getMsUntilNextExec,
} = require('../../../api/sesSuppressionPoller/sesSuppressionPoller');

/**
 * Feature: ses-suppression-polling
 * Property 5: getMsUntilNextExec targets next day at 3 AM UTC
 *
 * For any current timestamp, getMsUntilNextExec() returns a positive number
 * of milliseconds such that Date.now() + result falls on the next calendar
 * day at exactly 03:00:00.000 UTC.
 *
 * Validates: Requirements 4.2
 */
describe('sesSuppressionPoller - Property 5: getMsUntilNextExec targets next day at 3 AM UTC', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should always target next day at exactly 03:00:00.000 UTC', function () {
    this.timeout(30000);

    // Generate random timestamps across a wide range of times
    // Cover different hours, minutes, seconds within a realistic date range
    const timestampArb = fc
      .date({
        min: new Date('2020-01-01T00:00:00Z'),
        max: new Date('2030-12-31T23:59:59Z'),
      })
      .map((d) => d.getTime());

    fc.assert(
      fc.property(timestampArb, (now) => {
        const clock = sinon.useFakeTimers(now);
        try {
          const ms = getMsUntilNextExec();

          // Must be positive
          should(ms).be.greaterThan(0);

          // Compute the target date
          const target = new Date(now + ms);

          // Should be the next calendar day relative to 'now'
          const current = new Date(now);
          const expectedDay = new Date(now);
          expectedDay.setUTCDate(current.getUTCDate() + 1);

          should(target.getUTCFullYear()).equal(expectedDay.getUTCFullYear());
          should(target.getUTCMonth()).equal(expectedDay.getUTCMonth());
          should(target.getUTCDate()).equal(expectedDay.getUTCDate());

          // Should be exactly 3 AM UTC
          should(target.getUTCHours()).equal(3);
          should(target.getUTCMinutes()).equal(0);
          should(target.getUTCSeconds()).equal(0);
          should(target.getUTCMilliseconds()).equal(0);
        } finally {
          clock.restore();
        }
      }),
      { numRuns: 100 }
    );
  });
});
