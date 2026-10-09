const should = require('should');
const {
  QUALITY_CATEGORIES,
} = require('../../../api/utils/computeEntranceDataQuality');
const {
  SIZE,
  getCaveSize,
  roundAestheticism,
  getEntranceDataQuality,
} = require('../../../api/utils/entranceMapCriteria');

describe('entranceMapCriteria - Unit Tests', () => {
  describe('SIZE', () => {
    it('should encode small, medium and large as 1, 2 and 3', () => {
      should(SIZE).deepEqual({ SMALL: 1, MEDIUM: 2, LARGE: 3 });
    });
  });

  describe('getCaveSize', () => {
    it('should be small just below both medium thresholds', () => {
      should(getCaveSize(29, 199)).equal(SIZE.SMALL);
    });

    it('should be medium at a depth of 30', () => {
      should(getCaveSize(30, 0)).equal(SIZE.MEDIUM);
    });

    it('should be medium at a length of 200', () => {
      should(getCaveSize(0, 200)).equal(SIZE.MEDIUM);
    });

    it('should be medium just below both large thresholds', () => {
      should(getCaveSize(99, 999)).equal(SIZE.MEDIUM);
    });

    it('should be large at a depth of 100', () => {
      should(getCaveSize(100, 0)).equal(SIZE.LARGE);
    });

    it('should be large at a length of 1000', () => {
      should(getCaveSize(0, 1000)).equal(SIZE.LARGE);
    });

    it('should be large when only one dimension reaches the threshold', () => {
      should(getCaveSize(5, 4000)).equal(SIZE.LARGE);
      should(getCaveSize(250, 10)).equal(SIZE.LARGE);
    });

    it('should count a null depth as zero', () => {
      should(getCaveSize(null, 250)).equal(SIZE.MEDIUM);
    });

    it('should count a null length as zero', () => {
      should(getCaveSize(120, null)).equal(SIZE.LARGE);
    });

    it('should be small when both dimensions are null', () => {
      should(getCaveSize(null, null)).equal(SIZE.SMALL);
    });

    it('should be small when both dimensions are undefined, as for an entrance without a cave', () => {
      should(getCaveSize(undefined, undefined)).equal(SIZE.SMALL);
    });
  });

  describe('roundAestheticism', () => {
    it('should return null for a null average', () => {
      should(roundAestheticism(null)).be.null();
    });

    it('should return null for an undefined average', () => {
      should(roundAestheticism(undefined)).be.null();
    });

    it('should keep an integer average unchanged', () => {
      should(roundAestheticism(8)).equal(8);
    });

    it('should round 7.65 to 7.7', () => {
      should(roundAestheticism(7.65)).equal(7.7);
    });

    it('should round 7.75 to 7.8', () => {
      should(roundAestheticism(7.75)).equal(7.8);
    });

    it('should round a numeric string to a number', () => {
      should(roundAestheticism('7.25')).equal(7.3);
    });

    it('should round a 7.333 average to one decimal', () => {
      should(roundAestheticism(22 / 3)).equal(7.3);
    });
  });

  describe('getEntranceDataQuality', () => {
    it('should return 0 when the entrance has no quality row', () => {
      should(getEntranceDataQuality({})).equal(0);
    });

    it('should return 0 when the general update date is null, even with other fields set', () => {
      const row = {
        general_latest_date_of_update: null,
        general_nb_contributions: 3,
        location_latest_date_of_update: new Date(),
        location_nb_contributions: 2,
      };
      should(getEntranceDataQuality(row)).equal(0);
    });

    it('should score a fresh row with two contributors per category as 100', () => {
      const now = new Date();
      const row = {};
      QUALITY_CATEGORIES.forEach((category) => {
        row[`${category}_latest_date_of_update`] = now;
        row[`${category}_nb_contributions`] = 2;
      });
      should(getEntranceDataQuality(row)).equal(100);
    });

    it('should score a fresh general category with one contributor as 10', () => {
      const row = {
        general_latest_date_of_update: new Date(),
        general_nb_contributions: 1,
      };
      should(getEntranceDataQuality(row)).equal(10);
    });
  });
});
