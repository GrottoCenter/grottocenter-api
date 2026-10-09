/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const dayjs = require('../../../api/utils/dayjs');
const {
  QUALITY_CATEGORIES,
  MAX_RAW_TOTAL,
  getDateCutoffs,
  getQualityData,
  getQualityBreakdown,
} = require('../../../api/utils/computeEntranceDataQuality');
const {
  toQualityDataEntrance,
} = require('../../../api/services/mapping/converters');

// Valid dates, years 1000 to 3000. For an invalid date, or one near the edge
// of the Date range (year -271821), dayjs's year diff returns 0, so Property
// 3's diff oracle would rate it recent; getDateCutoffs() rates it very old.
// PostgreSQL timestamps produce neither.
const dateArb = fc.date({
  min: new Date('1000-01-01'),
  max: new Date('3000-01-01'),
  noInvalidDate: true,
});

/**
 * Arbitrary: generates a random materialized view row
 * with optional dates and contribution counts for each category,
 * plus a required date_of_update.
 */
const qualityRowArb = fc.record({
  ...QUALITY_CATEGORIES.reduce((acc, cat) => {
    acc[`${cat}_latest_date_of_update`] = fc.option(dateArb);
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
            // getDateCutoffs() departs from this diff on leap days only, see
            // Property 5
            if (entityDate) {
              const ageInYears = dayjs().diff(dayjs(entityDate), 'year', true);
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

  /**
   * Property 5: Cut-off scoring matches the fractional year diff
   *
   * For any `now` and any entity date, scoring against getDateCutoffs(now)
   * gives the tier `now.diff(date, 'year', true)` gives, except for a date on
   * 29 February, where dayjs's diff is not monotonic. Dates are drawn both
   * anywhere in the last 16 years and within a day of a tier boundary, where
   * an off-by-one comparison (>= for >) would show.
   *
   * Encodes the switch from a diff per date to cut-offs computed once per
   * batch, which a coordinates snapshot load relies on.
   */
  describe('Property 5: Cut-off scoring matches the fractional year diff', () => {
    const DAY = 864e5;
    const tierOf = (ageInYears) => {
      if (ageInYears < 2) return 7;
      if (ageInYears < 5) return 5;
      if (ageInYears < 10) return 3;
      return 1;
    };
    const scoreOfTier = (tier) => Math.round((tier / MAX_RAW_TOTAL) * 100);

    const nowArb = fc
      .date({
        min: new Date('2000-01-01'),
        max: new Date('2100-01-01'),
        noInvalidDate: true,
      })
      .map((d) => dayjs(d));
    const anyAgeArb = (now) =>
      fc
        .double({ min: -1, max: 16, noNaN: true })
        .map((years) => new Date(now.valueOf() - years * 365.25 * DAY));
    const nearBoundaryArb = (now) =>
      fc
        .tuple(
          fc.constantFrom(2, 5, 10),
          fc.oneof(
            fc.constantFrom(-1, 0, 1),
            fc.integer({ min: -DAY, max: DAY })
          )
        )
        .map(
          ([years, offset]) =>
            new Date(now.subtract(years, 'year').valueOf() + offset)
        );

    it('should give the diff tier for every date but 29 February', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          nowArb.chain((now) =>
            fc.tuple(
              fc.constant(now),
              fc.oneof(anyAgeArb(now), nearBoundaryArb(now))
            )
          ),
          ([now, date]) => {
            fc.pre(!(date.getMonth() === 1 && date.getDate() === 29));
            const expected = scoreOfTier(
              tierOf(now.diff(dayjs(date), 'year', true))
            );
            should(
              getQualityData(
                { general_latest_date_of_update: date },
                getDateCutoffs(now)
              )
            ).equal(expected);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
