const should = require('should');
const dayjs = require('../../../api/utils/dayjs');
const {
  getDateCutoffs,
  getQualityData,
} = require('../../../api/utils/computeEntranceDataQuality');

// One category with only a date scores its date tier alone: 7, 5, 3 or 1 raw
// points out of 98, which round to these percentages.
const RECENT = 7;
const MODERATE = 5;
const OLD = 3;
const VERY_OLD = 1;

const scoreAt = (now, date) =>
  getQualityData(
    { general_latest_date_of_update: date },
    getDateCutoffs(dayjs(now))
  );

describe('computeEntranceDataQuality', () => {
  describe('getDateCutoffs()', () => {
    // Local times throughout: dayjs subtracts calendar years in local time, so
    // across a daylight saving change the cut-off is not a whole number of
    // UTC days away.
    it('should return the instants 2, 5 and 10 calendar years before now', () => {
      const now = dayjs('2026-10-09T10:00:00.000');

      should(getDateCutoffs(now)).eql({
        recent: new Date('2024-10-09T10:00:00.000').getTime(),
        moderate: new Date('2021-10-09T10:00:00.000').getTime(),
        old: new Date('2016-10-09T10:00:00.000').getTime(),
      });
    });
  });

  describe('date tiers', () => {
    const now = '2026-10-09T10:00:00.000';

    it('should place a date exactly on a cut-off in the older tier', () => {
      should(scoreAt(now, new Date('2024-10-09T10:00:00.000'))).equal(MODERATE);
      should(scoreAt(now, new Date('2021-10-09T10:00:00.000'))).equal(OLD);
      should(scoreAt(now, new Date('2016-10-09T10:00:00.000'))).equal(VERY_OLD);
    });

    it('should place a date one millisecond after a cut-off in the younger tier', () => {
      should(scoreAt(now, new Date('2024-10-09T10:00:00.001'))).equal(RECENT);
      should(scoreAt(now, new Date('2021-10-09T10:00:00.001'))).equal(MODERATE);
      should(scoreAt(now, new Date('2016-10-09T10:00:00.001'))).equal(OLD);
    });

    it('should rate a future date recent', () => {
      should(scoreAt(now, new Date('2030-01-01T00:00:00.000'))).equal(RECENT);
    });

    it('should score a date string as the Date it parses to', () => {
      should(scoreAt(now, '2023-01-01T00:00:00.000')).equal(
        scoreAt(now, new Date('2023-01-01T00:00:00.000'))
      );
    });

    it('should rate an unparseable date very old, as before', () => {
      should(scoreAt(now, 'not a date')).equal(VERY_OLD);
      should(scoreAt(now, new Date('invalid'))).equal(VERY_OLD);
    });

    it('should rate a 29 February under two years old the day before its second anniversary', () => {
      // dayjs's year diff rates it two years old here, though it rates the
      // 28th, a day earlier, younger; cut-offs keep the order of dates.
      const febNow = dayjs('2026-02-28T12:00:00');

      should(scoreAt(febNow, new Date('2024-02-28T13:00:00'))).equal(RECENT);
      should(scoreAt(febNow, new Date('2024-02-29T12:00:00'))).equal(RECENT);
      should(scoreAt(febNow, new Date('2024-02-28T11:00:00'))).equal(MODERATE);
    });
  });

  describe('getQualityData()', () => {
    it('should give the same score with shared cut-offs as with its own', () => {
      const row = {
        general_latest_date_of_update: new Date(Date.now() - 864e5),
        general_nb_contributions: 2,
        location_latest_date_of_update: new Date(
          Date.now() - 3 * 365.25 * 864e5
        ),
        location_nb_contributions: 1,
      };

      should(getQualityData(row, getDateCutoffs())).equal(getQualityData(row));
      // 7 + 7 + 5 + 3 raw points out of 98
      should(getQualityData(row)).equal(22);
    });
  });
});
