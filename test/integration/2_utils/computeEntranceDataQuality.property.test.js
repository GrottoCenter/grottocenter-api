const should = require('should');
const fc = require('fast-check');
const moment = require('moment');
const {
  QUALITY_CATEGORIES,
  MAX_RAW_TOTAL,
  getQualityData,
  getQualityBreakdown,
} = require('../../../api/utils/computeEntranceDataQuality');
const {
  toQualityDataEntrance,
} = require('../../../api/services/mapping/converters');

/**
 * Arbitrary: generates a random materialized view row
 * with optional dates and contribution counts for each category,
 * plus a required date_of_update.
 */
const qualityRowArb = fc.record({
  ...QUALITY_CATEGORIES.reduce((acc, cat) => {
    acc[`${cat}_latest_date_of_update`] = fc.option(fc.date());
    acc[`${cat}_nb_contributions`] = fc.option(fc.nat());
    return acc;
  }, {}),
  date_of_update: fc.date(),
});

describe('computeEntranceDataQuality - Property Tests', () => {
  /**
   * Property 1: Utility output completeness
   *
   * For any materialized view row, getQualityData returns a number and
   * getQualityBreakdown returns an object with exactly the seven category keys,
   * each being a number.
   *
   * Validates: Requirements 1.1, 1.2, 2.3
   */
  describe('Property 1: Utility output completeness', () => {
    it('should produce a numeric total and 7 numeric category scores', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(qualityRowArb, (row) => {
          const total = getQualityData(row);
          should(total).be.a.Number();

          const breakdown = getQualityBreakdown(row);
          should(Object.keys(breakdown)).have.length(QUALITY_CATEGORIES.length);
          for (const cat of QUALITY_CATEGORIES) {
            should(breakdown).have.property(cat);
            should(breakdown[cat]).be.a.Number();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Score bounds
   *
   * For any materialized view row, getQualityData returns a value in [0, 100]
   * and each value in getQualityBreakdown is in [0, 100].
   *
   * Validates: Requirements 2.1, 2.2
   */
  describe('Property 2: Score bounds', () => {
    it('should produce total in [0, 100] and each category in [0, 100]', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(qualityRowArb, (row) => {
          const total = getQualityData(row);
          should(total).be.greaterThanOrEqual(0);
          should(total).be.lessThanOrEqual(100);

          const breakdown = getQualityBreakdown(row);
          for (const cat of QUALITY_CATEGORIES) {
            should(breakdown[cat]).be.greaterThanOrEqual(0);
            should(breakdown[cat]).be.lessThanOrEqual(100);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Total is consistent with normalized category scores
   *
   * For any materialized view row, getQualityData(row) equals
   * Math.round(rawSum / MAX_RAW_TOTAL * 100) where rawSum is the sum
   * of all 7 raw category scores recomputed independently.
   *
   * Validates: Requirements 2.4
   */
  describe('Property 3: Total is consistent with normalized category scores', () => {
    it('should equal Math.round(rawSum / MAX_RAW_TOTAL * 100)', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(qualityRowArb, (row) => {
          // Recompute raw sum independently using the same scoring logic
          let rawSum = 0;
          for (const cat of QUALITY_CATEGORIES) {
            const entityDate = row[`${cat}_latest_date_of_update`];
            let dateScore = 0;
            if (entityDate) {
              const ageInYears = moment().diff(
                moment(entityDate),
                'years',
                true
              );
              if (ageInYears < 2) dateScore = 7;
              else if (ageInYears < 5) dateScore = 5;
              else if (ageInYears < 10) dateScore = 3;
              else dateScore = 1;
            }

            const nbContrib = row[`${cat}_nb_contributions`];
            let contribScore = 0;
            if (nbContrib) {
              const n = Number.parseInt(nbContrib, 10);
              if (n <= 0) contribScore = 0;
              else if (n === 1) contribScore = 3;
              else contribScore = 7;
            }

            rawSum += dateScore + contribScore;
          }

          const expected = Math.round((rawSum / MAX_RAW_TOTAL) * 100);
          should(getQualityData(row)).equal(expected);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Consistency with list endpoint scoring
   *
   * For any materialized view row, getQualityData(row) equals
   * toQualityDataEntrance(row).data_quality, ensuring the detail
   * endpoint and list endpoints produce the same score.
   *
   * Validates: Requirements 2.5
   */
  describe('Property 4: Consistency with list endpoint scoring', () => {
    it('should equal toQualityDataEntrance(row).data_quality', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(qualityRowArb, (row) => {
          const detailScore = getQualityData(row);
          const listScore = toQualityDataEntrance(row).data_quality;
          should(detailScore).equal(listScore);
        }),
        { numRuns: 100 }
      );
    });
  });
});
