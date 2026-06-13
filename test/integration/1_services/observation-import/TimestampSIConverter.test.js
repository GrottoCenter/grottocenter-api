/**
 * Unit tests for TimestampConverter and SIConverter services.
 *
 * Covers specific examples, edge cases, and error paths for both converters.
 */
const should = require('should');
const dayjs = require('../../../../api/utils/dayjs');
const TimestampConverter = require('../../../../api/services/observation-import/TimestampConverter');
const SIConverter = require('../../../../api/services/observation-import/SIConverter');

// ---------------------------------------------------------------------------
// TimestampConverter unit tests
// ---------------------------------------------------------------------------

describe('TimestampConverter', () => {
  // -------------------------------------------------------------------------
  // Valid datetime timestamp
  // -------------------------------------------------------------------------
  describe('valid datetime timestamp', () => {
    it('should parse a valid datetime string and return a UTC Date', () => {
      const profile = {
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      const rows = [['15/01/2024 10:00:00']];
      const columnIndices = [0];

      const result = TimestampConverter.convert(rows, profile, columnIndices);

      should(result).have.length(1);
      should(result[0]).be.instanceof(Date);

      // 15 Jan 2024 10:00:00 Paris (UTC+1 in January) = 09:00:00 UTC
      const expected = dayjs
        .tz('15/01/2024 10:00:00', 'DD/MM/YYYY HH:mm:ss', 'Europe/Paris')
        .toDate();
      should(result[0].getTime()).equal(expected.getTime());
    });

    it('should parse multiple rows and return a Date per row', () => {
      const profile = {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      const rows = [['2024-01-15 08:00:00'], ['2024-01-15 09:00:00']];
      const columnIndices = [0];

      const result = TimestampConverter.convert(rows, profile, columnIndices);

      should(result).have.length(2);
      should(result[0]).be.instanceof(Date);
      should(result[1]).be.instanceof(Date);
      should(result[1].getTime()).be.greaterThan(result[0].getTime());
    });
  });

  // -------------------------------------------------------------------------
  // Unparseable timestamp throws with row number and raw value
  // -------------------------------------------------------------------------
  describe('unparseable timestamp', () => {
    it('should throw an error identifying row 1 and the bad value', () => {
      const profile = {
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      const rows = [['not-a-date']];
      const columnIndices = [0];

      let caughtError;
      try {
        TimestampConverter.convert(rows, profile, columnIndices);
      } catch (err) {
        caughtError = err;
      }
      should(caughtError).be.instanceOf(Error);
      should(caughtError.message).match(/row 1/i);
      should(caughtError.message).containEql('not-a-date');
    });

    it('should stop at the first unparseable row (row 2)', () => {
      const profile = {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      const rows = [
        ['2024-01-15 08:00:00'], // valid
        ['BAD VALUE'], // invalid → stops here
        ['2024-01-15 10:00:00'], // never reached
      ];
      const columnIndices = [0];

      let caughtError;
      try {
        TimestampConverter.convert(rows, profile, columnIndices);
      } catch (err) {
        caughtError = err;
      }
      should(caughtError).be.instanceOf(Error);
      should(caughtError.message).match(/row 2/i);
      should(caughtError.message).containEql('BAD VALUE');
    });
  });

  // -------------------------------------------------------------------------
  // dateOnly without timeOnly → error
  // -------------------------------------------------------------------------
  describe('dateOnly without timeOnly column', () => {
    it('should throw a pairing error when dateOnly has no timeOnly counterpart', () => {
      const profile = {
        timezone: 'Europe/Paris',
        dateOnlyFormat: 'DD/MM/YYYY',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'dateOnly' },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const rows = [['15/01/2024', '21.5']];
      const columnIndices = [0, 1];

      should(() =>
        TimestampConverter.convert(rows, profile, columnIndices)
      ).throw(/dateOnly.*timeOnly|pairing/i);
    });
  });

  // -------------------------------------------------------------------------
  // timeOnly without dateOnly → error
  // -------------------------------------------------------------------------
  describe('timeOnly without dateOnly column', () => {
    it('should throw a pairing error when timeOnly has no dateOnly counterpart', () => {
      const profile = {
        timezone: 'Europe/Paris',
        timeOnlyFormat: 'HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'timeOnly' },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const rows = [['10:00:00', '21.5']];
      const columnIndices = [0, 1];

      should(() =>
        TimestampConverter.convert(rows, profile, columnIndices)
      ).throw(/timeOnly.*dateOnly|pairing/i);
    });
  });

  // -------------------------------------------------------------------------
  // Timezone conversion: Paris → UTC
  // -------------------------------------------------------------------------
  describe('timezone conversion', () => {
    it('should convert Europe/Paris (UTC+1 in January) to UTC correctly', () => {
      const profile = {
        timezone: 'Europe/Paris',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      // 2024-01-15 10:00:00 Paris (UTC+1) = 2024-01-15 09:00:00 UTC
      const rows = [['2024-01-15 10:00:00']];
      const columnIndices = [0];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCHours()).equal(9);
      should(utcDate.getUTCDate()).equal(15);
      should(utcDate.getUTCMonth()).equal(0); // January = 0
      should(utcDate.getUTCFullYear()).equal(2024);
    });

    it('should handle summer time: Europe/Paris (UTC+2 in July) to UTC', () => {
      const profile = {
        timezone: 'Europe/Paris',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        ],
      };
      // 2024-07-15 12:00:00 Paris (UTC+2 in summer) = 2024-07-15 10:00:00 UTC
      const rows = [['2024-07-15 12:00:00']];
      const columnIndices = [0];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCHours()).equal(10);
      should(utcDate.getUTCDate()).equal(15);
    });
  });

  // -------------------------------------------------------------------------
  // Split dateOnly + timeOnly columns
  // -------------------------------------------------------------------------
  describe('split dateOnly + timeOnly columns', () => {
    it('should combine date and time columns and parse correctly', () => {
      const profile = {
        timezone: 'UTC',
        dateOnlyFormat: 'DD/MM/YYYY',
        timeOnlyFormat: 'HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'dateOnly' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'timeOnly' },
        ],
      };
      const rows = [['15/01/2024', '08:30:00']];
      const columnIndices = [0, 1];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCMonth()).equal(0);
      should(utcDate.getUTCDate()).equal(15);
      should(utcDate.getUTCHours()).equal(8);
      should(utcDate.getUTCMinutes()).equal(30);
    });
  });

  // -------------------------------------------------------------------------
  // Column position mapping (excluded columns scenario)
  // -------------------------------------------------------------------------
  describe('column position mapping with excluded columns', () => {
    it('should correctly map columnIndex to row position after exclusions', () => {
      // Original columns: [0=timestamp, 1=excluded, 2=measurement]
      // After exclusion, rows contain [col0, col2] → columnIndices=[0,2]
      const profile = {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          { columnIndex: 2, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      // Each row has 2 values (col1 was excluded)
      const rows = [['2024-01-15 08:00:00', '21.5']];
      const columnIndices = [0, 2]; // col 0 is at pos 0, col 2 is at pos 1

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCHours()).equal(8);
    });
  });

  // -------------------------------------------------------------------------
  // Component-based timestamps (year/month/day/hour/minute/second)
  // -------------------------------------------------------------------------
  describe('component-based timestamps', () => {
    it('should assemble a timestamp from year, month, day, hour, minute, second columns', () => {
      const profile = {
        timezone: 'Europe/Paris',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
          { columnIndex: 3, role: 'timestamp', timestampType: 'hour' },
          { columnIndex: 4, role: 'timestamp', timestampType: 'minute' },
          { columnIndex: 5, role: 'timestamp', timestampType: 'second' },
        ],
      };
      // 2024-01-15 10:30:45 Paris (UTC+1) = 09:30:45 UTC
      const rows = [['2024', '1', '15', '10', '30', '45']];
      const columnIndices = [0, 1, 2, 3, 4, 5];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCMonth()).equal(0); // January
      should(utcDate.getUTCDate()).equal(15);
      should(utcDate.getUTCHours()).equal(9);
      should(utcDate.getUTCMinutes()).equal(30);
      should(utcDate.getUTCSeconds()).equal(45);
    });

    it('should default hour/minute/second to 0 when only year/month/day are provided', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
        ],
      };
      const rows = [['2024', '6', '20']];
      const columnIndices = [0, 1, 2];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCMonth()).equal(5); // June
      should(utcDate.getUTCDate()).equal(20);
      should(utcDate.getUTCHours()).equal(0);
      should(utcDate.getUTCMinutes()).equal(0);
      should(utcDate.getUTCSeconds()).equal(0);
    });

    it('should throw when a component value is not a valid integer', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
        ],
      };
      const rows = [['2024', 'abc', '15']];
      const columnIndices = [0, 1, 2];

      should(() =>
        TimestampConverter.convert(rows, profile, columnIndices)
      ).throw(/month.*row 1.*not a valid integer/i);
    });

    it('should throw when required components (year/month/day) are missing', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'hour' },
        ],
      };
      const rows = [['2024', '10']];
      const columnIndices = [0, 1];

      should(() =>
        TimestampConverter.convert(rows, profile, columnIndices)
      ).throw(/month.*day/i);
    });

    it('should parse multiple rows with component columns', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
          { columnIndex: 3, role: 'timestamp', timestampType: 'hour' },
          { columnIndex: 4, role: 'timestamp', timestampType: 'minute' },
          { columnIndex: 5, role: 'timestamp', timestampType: 'second' },
        ],
      };
      const rows = [
        ['2024', '1', '15', '8', '0', '0'],
        ['2024', '1', '15', '9', '0', '0'],
      ];
      const columnIndices = [0, 1, 2, 3, 4, 5];

      const result = TimestampConverter.convert(rows, profile, columnIndices);

      should(result).have.length(2);
      should(result[1].getTime()).be.greaterThan(result[0].getTime());
      should(result[0].getUTCHours()).equal(8);
      should(result[1].getUTCHours()).equal(9);
    });
  });

  // -------------------------------------------------------------------------
  // Component-based timestamps with elapsed_seconds offset
  // -------------------------------------------------------------------------
  describe('component-based timestamps with elapsed_seconds offset', () => {
    it('should add elapsed_seconds to the base component timestamp', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
          { columnIndex: 3, role: 'timestamp', timestampType: 'hour' },
          { columnIndex: 4, role: 'timestamp', timestampType: 'minute' },
          { columnIndex: 5, role: 'timestamp', timestampType: 'second' },
          {
            columnIndex: 6,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      // Base: 2024-01-15 10:00:00 UTC + 600s = 10:10:00 UTC
      const rows = [['2024', '1', '15', '10', '0', '0', '600']];
      const columnIndices = [0, 1, 2, 3, 4, 5, 6];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCHours()).equal(10);
      should(utcDate.getUTCMinutes()).equal(10);
      should(utcDate.getUTCSeconds()).equal(0);
    });

    it('should not alter timestamp when elapsed_seconds is 0', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
          { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
          {
            columnIndex: 3,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      const rows = [['2024', '3', '10', '0']];
      const columnIndices = [0, 1, 2, 3];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCMonth()).equal(2); // March
      should(utcDate.getUTCDate()).equal(10);
      should(utcDate.getUTCHours()).equal(0);
    });
  });

  // -------------------------------------------------------------------------
  // elapsed_seconds as offset with datetime mode
  // -------------------------------------------------------------------------
  describe('elapsed_seconds offset with datetime mode', () => {
    it('should add elapsed_seconds to a parsed datetime timestamp', () => {
      const profile = {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          {
            columnIndex: 1,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      // 2024-01-15 08:00:00 UTC + 3600s = 09:00:00 UTC
      const rows = [['2024-01-15 08:00:00', '3600']];
      const columnIndices = [0, 1];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCHours()).equal(9);
      should(utcDate.getUTCMinutes()).equal(0);
    });
  });

  // -------------------------------------------------------------------------
  // elapsed_seconds as offset with split (dateOnly + timeOnly) mode
  // -------------------------------------------------------------------------
  describe('elapsed_seconds offset with split mode', () => {
    it('should add elapsed_seconds to a combined dateOnly+timeOnly timestamp', () => {
      const profile = {
        timezone: 'UTC',
        dateOnlyFormat: 'YYYY-MM-DD',
        timeOnlyFormat: 'HH:mm:ss',
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'dateOnly' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'timeOnly' },
          {
            columnIndex: 2,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      // 2024-01-15 12:00:00 UTC + 1800s = 12:30:00 UTC
      const rows = [['2024-01-15', '12:00:00', '1800']];
      const columnIndices = [0, 1, 2];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCHours()).equal(12);
      should(utcDate.getUTCMinutes()).equal(30);
    });
  });

  // -------------------------------------------------------------------------
  // Standalone elapsed_seconds (epoch mode)
  // -------------------------------------------------------------------------
  describe('standalone elapsed_seconds (Unix epoch)', () => {
    it('should interpret elapsed_seconds as Unix epoch when no other timestamp columns exist', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      // Unix epoch 1705305600 = 2024-01-15 08:00:00 UTC
      const rows = [['1705305600']];
      const columnIndices = [0];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(2024);
      should(utcDate.getUTCMonth()).equal(0);
      should(utcDate.getUTCDate()).equal(15);
      should(utcDate.getUTCHours()).equal(8);
      should(utcDate.getUTCMinutes()).equal(0);
    });

    it('should handle epoch 0 (1970-01-01 00:00:00 UTC)', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      const rows = [['0']];
      const columnIndices = [0];

      const [utcDate] = TimestampConverter.convert(
        rows,
        profile,
        columnIndices
      );

      should(utcDate.getUTCFullYear()).equal(1970);
      should(utcDate.getUTCMonth()).equal(0);
      should(utcDate.getUTCDate()).equal(1);
      should(utcDate.getUTCHours()).equal(0);
    });

    it('should throw when epoch value is not a valid integer', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      const rows = [['not-a-number']];
      const columnIndices = [0];

      should(() =>
        TimestampConverter.convert(rows, profile, columnIndices)
      ).throw(/epoch.*row 1.*not a valid integer/i);
    });

    it('should parse multiple rows of epoch seconds', () => {
      const profile = {
        timezone: 'UTC',
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
          },
        ],
      };
      const rows = [['1705305600'], ['1705309200']]; // +3600s apart
      const columnIndices = [0];

      const result = TimestampConverter.convert(rows, profile, columnIndices);

      should(result).have.length(2);
      const diffMs = result[1].getTime() - result[0].getTime();
      should(diffMs).equal(3600 * 1000);
    });
  });
});

// ---------------------------------------------------------------------------
// SIConverter unit tests
// ---------------------------------------------------------------------------

describe('SIConverter', () => {
  // -------------------------------------------------------------------------
  // toSI: basic formula
  // -------------------------------------------------------------------------
  describe('toSI formula', () => {
    it('should convert Celsius to Kelvin: toSI(21.5, { factor:1, offset:-273.15 }) = 294.65', () => {
      const result = SIConverter.toSI(21.5, {
        siToDisplayFactor: 1,
        siToDisplayOffset: -273.15,
      });
      should(result).be.approximately(294.65, 1e-9);
    });

    it('should handle factor=2, offset=0: toSI(10) = 5', () => {
      const result = SIConverter.toSI(10, {
        siToDisplayFactor: 2,
        siToDisplayOffset: 0,
      });
      should(result).equal(5);
    });

    it('should handle negative offset: toSI(0, { factor:1, offset:5 }) = -5', () => {
      const result = SIConverter.toSI(0, {
        siToDisplayFactor: 1,
        siToDisplayOffset: 5,
      });
      should(result).equal(-5);
    });

    it('should handle fractional factor', () => {
      // toSI(100, { factor:0.01, offset:0 }) = 10000
      const result = SIConverter.toSI(100, {
        siToDisplayFactor: 0.01,
        siToDisplayOffset: 0,
      });
      should(result).be.approximately(10000, 1e-6);
    });
  });

  // -------------------------------------------------------------------------
  // toSI: zero factor throws
  // -------------------------------------------------------------------------
  describe('zero factor', () => {
    it('should throw when siToDisplayFactor is zero', () => {
      should(() =>
        SIConverter.toSI(21.5, { siToDisplayFactor: 0, siToDisplayOffset: 0 })
      ).throw(/zero|factor/i);
    });

    it('should throw for any value when factor is zero', () => {
      should(() =>
        SIConverter.toSI(0, { siToDisplayFactor: 0, siToDisplayOffset: 0 })
      ).throw();
    });
  });

  // -------------------------------------------------------------------------
  // Locale-aware number parsing
  // -------------------------------------------------------------------------
  describe('French locale number parsing', () => {
    it('should parse "21,5" as 21.5 in French locale and convert to SI', () => {
      const sensorConfigMap = new Map([
        [
          1,
          {
            quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: -273.15 },
          },
        ],
      ]);
      const rows = [['21,5']];
      const columnIndices = [1];
      const profile = { numberLocale: 'fr' };

      const { measurements: result } = SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile
      );

      should(result).have.length(1);
      should(result[0]).have.length(1);
      should(result[0][0].value).be.approximately(21.5, 1e-9);
      should(result[0][0].valueSi).be.approximately(294.65, 1e-9);
    });

    it('should parse "21,5" with parseLocaleNumber in fr locale', () => {
      const num = SIConverter.parseLocaleNumber('21,5', 'fr');
      should(num).equal(21.5);
    });
  });

  describe('English locale number parsing', () => {
    it('should parse "21.5" as 21.5 in English locale and convert to SI', () => {
      const sensorConfigMap = new Map([
        [
          1,
          {
            quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: -273.15 },
          },
        ],
      ]);
      const rows = [['21.5']];
      const columnIndices = [1];
      const profile = { numberLocale: 'en' };

      const { measurements: result } = SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile
      );

      should(result).have.length(1);
      should(result[0][0].value).be.approximately(21.5, 1e-9);
      should(result[0][0].valueSi).be.approximately(294.65, 1e-9);
    });

    it('should parse "21.5" with parseLocaleNumber in en locale', () => {
      const num = SIConverter.parseLocaleNumber('21.5', 'en');
      should(num).equal(21.5);
    });

    it('should parse "21.5" with parseLocaleNumber when locale is undefined', () => {
      const num = SIConverter.parseLocaleNumber('21.5', undefined);
      should(num).equal(21.5);
    });
  });

  // -------------------------------------------------------------------------
  // convertAll: multiple measurement columns
  // -------------------------------------------------------------------------
  describe('convertAll with multiple measurement columns', () => {
    it('should convert all measurement columns in each row', () => {
      // Two measurement columns at original indices 1 and 2
      // After exclusion, row has values [ts, m1, m2] at positions 0,1,2
      // columnIndices = [0, 1, 2]
      const sensorConfigMap = new Map([
        [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
        [2, { quantityKind: { siToDisplayFactor: 100, siToDisplayOffset: 0 } }],
      ]);
      const rows = [
        ['2024-01-15 08:00:00', '10.0', '50.0'],
        ['2024-01-15 09:00:00', '20.0', '75.0'],
      ];
      const columnIndices = [0, 1, 2];
      const profile = { numberLocale: 'en' };

      const { measurements: result } = SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile
      );

      should(result).have.length(2);

      // Row 0
      should(result[0]).have.length(2);
      const [col1Row0, col2Row0] = result[0];
      should(col1Row0.columnIndex).equal(1);
      should(col1Row0.value).equal(10.0);
      should(col1Row0.valueSi).equal(10.0); // (10 - 0) / 1 = 10

      should(col2Row0.columnIndex).equal(2);
      should(col2Row0.value).equal(50.0);
      should(col2Row0.valueSi).be.approximately(0.5, 1e-9); // (50 - 0) / 100 = 0.5

      // Row 1
      should(result[1]).have.length(2);
      const [col1Row1, col2Row1] = result[1];
      should(col1Row1.value).equal(20.0);
      should(col2Row1.value).equal(75.0);
      should(col2Row1.valueSi).be.approximately(0.75, 1e-9);
    });

    it('should throw when sensorConfigMap columns are not present in columnIndices', () => {
      // sensorConfigMap has col 5 but it's not in columnIndices (was excluded)
      const sensorConfigMap = new Map([
        [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
        [5, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
      ]);
      const rows = [['ts_value', '42.0']];
      const columnIndices = [0, 1]; // col 5 not present
      const profile = {};

      should(() =>
        SIConverter.convertAll(rows, sensorConfigMap, columnIndices, profile)
      ).throw(/Measurement column index 5 not found in parsed data/);
    });

    it('should throw if a quantity kind has zero factor', () => {
      const sensorConfigMap = new Map([
        [1, { quantityKind: { siToDisplayFactor: 0, siToDisplayOffset: 0 } }],
      ]);
      const rows = [['42.0']];
      const columnIndices = [1];
      const profile = {};

      should(() =>
        SIConverter.convertAll(rows, sensorConfigMap, columnIndices, profile)
      ).throw(/zero|factor/i);
    });
  });
});

// ---------------------------------------------------------------------------
// rowOffset parameter tests
// ---------------------------------------------------------------------------

describe('TimestampConverter - rowOffset parameter', () => {
  it('should report the correct file-line number when rowOffset is non-zero', () => {
    const profile = {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
      ],
    };
    // Simulate: headerRow=1, skipFirstRows=1 → rowOffset=2
    // Bad row at data index 0 → file line = 0 + 1 + 2 = row 3
    const rows = [['INVALID']];
    const columnIndices = [0];
    const rowOffset = 2;

    let caughtError;
    try {
      TimestampConverter.convert(rows, profile, columnIndices, rowOffset);
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 3/i);
  });

  it('should report the correct file-line for a later row with rowOffset', () => {
    const profile = {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
      ],
    };
    // rowOffset=3, bad row at data index 2 → file line = 2 + 1 + 3 = row 6
    const rows = [
      ['2024-01-15 08:00:00'],
      ['2024-01-15 09:00:00'],
      ['BAD VALUE'],
    ];
    const columnIndices = [0];
    const rowOffset = 3;

    let caughtError;
    try {
      TimestampConverter.convert(rows, profile, columnIndices, rowOffset);
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 6/i);
  });

  it('should report row 1 when rowOffset is 0 and bad row is at index 0', () => {
    const profile = {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
      ],
    };
    const rows = [['BAD']];
    const columnIndices = [0];
    const rowOffset = 0;

    let caughtError;
    try {
      TimestampConverter.convert(rows, profile, columnIndices, rowOffset);
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 1/i);
  });
});

describe('SIConverter - rowOffset parameter', () => {
  it('should report the correct file-line number when rowOffset is non-zero', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    // rowOffset=2, bad row at data index 0 → file line = 0 + 1 + 2 = row 3
    const rows = [['not-a-number']];
    const columnIndices = [1];
    const profile = { numberLocale: 'en' };
    const rowOffset = 2;

    let caughtError;
    try {
      SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile,
        rowOffset
      );
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 3/i);
    should(caughtError.message).match(/column index 1/i);
  });

  it('should report the correct file-line for a later row with rowOffset', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    // rowOffset=3, bad row at data index 1 → file line = 1 + 1 + 3 = row 5
    const rows = [['10.0'], ['xyz']];
    const columnIndices = [1];
    const profile = { numberLocale: 'en' };
    const rowOffset = 3;

    let caughtError;
    try {
      SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile,
        rowOffset
      );
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 5/i);
  });

  it('should report row 1 when rowOffset is 0 and bad row is at index 0', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    const rows = [['abc']];
    const columnIndices = [1];
    const profile = {};
    const rowOffset = 0;

    let caughtError;
    try {
      SIConverter.convertAll(
        rows,
        sensorConfigMap,
        columnIndices,
        profile,
        rowOffset
      );
    } catch (err) {
      caughtError = err;
    }
    should(caughtError).be.instanceOf(Error);
    should(caughtError.message).match(/row 1/i);
  });
});

// ---------------------------------------------------------------------------
// Empty and whitespace cell handling tests
// ---------------------------------------------------------------------------

describe('SIConverter - empty and whitespace cell handling', () => {
  it('should skip empty cells and return skippedMeasurements count', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    // 3 rows: first has value, second is empty, third has value
    const rows = [['10.0'], [''], ['20.0']];
    const columnIndices = [1];
    const profile = { numberLocale: 'en' };

    const { measurements, skippedMeasurements } = SIConverter.convertAll(
      rows,
      sensorConfigMap,
      columnIndices,
      profile
    );

    should(measurements).have.length(3);
    should(measurements[0]).have.length(1);
    should(measurements[0][0].value).equal(10.0);
    should(measurements[1]).have.length(0); // skipped
    should(measurements[2]).have.length(1);
    should(measurements[2][0].value).equal(20.0);
    should(skippedMeasurements).equal(1);
  });

  it('should treat whitespace-only cells as empty (sensor gap)', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    const rows = [['  '], ['\t'], [' \t ']];
    const columnIndices = [1];
    const profile = { numberLocale: 'en' };

    const { measurements, skippedMeasurements } = SIConverter.convertAll(
      rows,
      sensorConfigMap,
      columnIndices,
      profile
    );

    should(measurements[0]).have.length(0);
    should(measurements[1]).have.length(0);
    should(measurements[2]).have.length(0);
    should(skippedMeasurements).equal(3);
  });

  it('should count skips across multiple measurement columns', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
      [2, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    // Row with col1 present but col2 empty
    const rows = [
      ['10.0', ''],
      ['', '20.0'],
    ];
    const columnIndices = [1, 2];
    const profile = { numberLocale: 'en' };

    const { measurements, skippedMeasurements } = SIConverter.convertAll(
      rows,
      sensorConfigMap,
      columnIndices,
      profile
    );

    should(measurements[0]).have.length(1);
    should(measurements[0][0].columnIndex).equal(1);
    should(measurements[1]).have.length(1);
    should(measurements[1][0].columnIndex).equal(2);
    should(skippedMeasurements).equal(2);
  });

  it('should return skippedMeasurements=0 when no cells are empty', () => {
    const sensorConfigMap = new Map([
      [1, { quantityKind: { siToDisplayFactor: 1, siToDisplayOffset: 0 } }],
    ]);
    const rows = [['10.0'], ['20.0']];
    const columnIndices = [1];
    const profile = { numberLocale: 'en' };

    const { measurements, skippedMeasurements } = SIConverter.convertAll(
      rows,
      sensorConfigMap,
      columnIndices,
      profile
    );

    should(measurements[0]).have.length(1);
    should(measurements[1]).have.length(1);
    should(skippedMeasurements).equal(0);
  });
});
