/**
 * Unit tests for the CSV Parser service.
 *
 * Covers specific edge cases: empty files, encoding errors, quoted fields,
 * delimiter detection, headerRow handling, skipLastRows, and locale-aware
 * delimiter forcing.
 */
const should = require('should');
const Parser = require('../../../../api/services/observation-import/Parser');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a plain string to a Buffer (UTF-8 by default). */
const toBuffer = (str, encoding = 'utf8') => Buffer.from(str, encoding);

/** Minimal valid profile with no excluded columns and no header. */
const baseProfile = () => ({
  columnMappings: [
    { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
    { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
  ],
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('Parser', () => {
  describe('empty / whitespace-only file', () => {
    it('should throw when the file contains only whitespace/newlines', () => {
      const buf = toBuffer('   \n  \n\t\n');
      should(() => Parser.parse(buf, baseProfile())).throw(
        /no parseable data/i
      );
    });

    it('should throw for a completely empty buffer', () => {
      const buf = toBuffer('');
      should(() => Parser.parse(buf, baseProfile())).throw(
        /no parseable data/i
      );
    });
  });

  describe('header-only file (no data rows)', () => {
    it('should throw when the file has only a header row and no data rows', () => {
      const buf = toBuffer('timestamp,value\n');
      const profile = { ...baseProfile(), headerRow: 1 };
      should(() => Parser.parse(buf, profile)).throw(/no parseable data/i);
    });

    it('should throw when skipLastRows removes all data rows', () => {
      const buf = toBuffer('ts,val\n2024-01-01,21.5\n');
      const profile = { ...baseProfile(), headerRow: 1, skipLastRows: 1 };
      should(() => Parser.parse(buf, profile)).throw(/no parseable data/i);
    });
  });

  describe('encoding errors', () => {
    it('should throw for an unsupported encoding string like utf-99', () => {
      const buf = toBuffer('a,b\n1,2\n');
      const profile = { ...baseProfile(), encoding: 'utf-99' };
      should(() => Parser.parse(buf, profile)).throw(/unsupported encoding/i);
    });

    it('should throw for an unsupported encoding string like utf16', () => {
      const buf = toBuffer('a,b\n1,2\n');
      const profile = { ...baseProfile(), encoding: 'utf16' };
      should(() => Parser.parse(buf, profile)).throw(/unsupported encoding/i);
    });
  });

  describe('headerRow out of range', () => {
    it('should throw when headerRow exceeds the total number of lines', () => {
      const buf = toBuffer('ts,val\n2024-01-01,21.5\n');
      const profile = { ...baseProfile(), headerRow: 10 };
      should(() => Parser.parse(buf, profile)).throw(/headerRow.*exceeds/i);
    });

    it('should throw when headerRow equals the total lines but leaves no data rows', () => {
      // headerRow = 2, file has exactly 2 lines → data rows = 0
      const buf = toBuffer('row1\nrow2\n');
      const profile = { ...baseProfile(), headerRow: 2 };
      // 2 lines, headerRow=2 is valid range but leaves no data → no parseable data
      should(() => Parser.parse(buf, profile)).throw(/no parseable data/i);
    });
  });

  // -------------------------------------------------------------------------
  // Correct parsing
  // -------------------------------------------------------------------------

  describe('quoted fields', () => {
    it('should handle a quoted field containing the delimiter (comma)', () => {
      const buf = toBuffer('"hello, world",42\n');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows).have.length(1);
      should(rows[0][0]).equal('hello, world');
      should(rows[0][1]).equal('42');
    });

    it('should handle a quoted field containing the delimiter (tab)', () => {
      const buf = toBuffer('"hello\tworld"\t42\n');
      const profile = { ...baseProfile() };
      const { rows } = Parser.parse(buf, profile);
      should(rows).have.length(1);
      should(rows[0][0]).equal('hello\tworld');
      should(rows[0][1]).equal('42');
    });

    it('should handle escaped quotes inside quoted fields: say ""hello""', () => {
      const buf = toBuffer('"say ""hello""",42\n');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows).have.length(1);
      should(rows[0][0]).equal('say "hello"');
    });

    it('should handle a field that is just an escaped quote ""', () => {
      const buf = toBuffer('"",42\n');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows[0][0]).equal('');
    });
  });

  describe('French locale: semicolon delimiter detected', () => {
    it('should detect semicolons as delimiter for French locale data', () => {
      const buf = toBuffer(
        '2024-01-01 00:00:00;21,5\n2024-01-01 00:15:00;21,7\n'
      );
      const profile = { ...baseProfile(), numberLocale: 'fr' };
      const { rows } = Parser.parse(buf, profile);
      should(rows).have.length(2);
      should(rows[0][0]).equal('2024-01-01 00:00:00');
      should(rows[0][1]).equal('21,5'); // raw string, not parsed as number
      should(rows[1][1]).equal('21,7');
    });
  });

  describe('English locale: comma delimiter detected', () => {
    it('should detect commas as delimiter for en locale', () => {
      const buf = toBuffer('2024-01-01,21.5\n2024-01-01,21.7\n');
      const profile = { ...baseProfile(), numberLocale: 'en' };
      const { rows } = Parser.parse(buf, profile);
      should(rows).have.length(2);
      should(rows[0][0]).equal('2024-01-01');
      should(rows[0][1]).equal('21.5');
    });
  });

  describe('tab delimiter auto-detection', () => {
    it('should detect tabs as delimiter when tabs dominate', () => {
      const buf = toBuffer('2024-01-01\t21.5\n2024-01-02\t22.0\n');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows).have.length(2);
      should(rows[0][0]).equal('2024-01-01');
      should(rows[0][1]).equal('21.5');
    });
  });

  describe('headerRow handling', () => {
    it('should extract header labels and return only data rows after headerRow', () => {
      const csv = 'ts,val\n2024-01-01,21.5\n2024-01-02,22.0\n';
      const buf = toBuffer(csv);
      const profile = { ...baseProfile(), headerRow: 1 };
      const { rows, headerLabels } = Parser.parse(buf, profile);
      should(headerLabels).deepEqual(['ts', 'val']);
      should(rows).have.length(2);
      should(rows[0][0]).equal('2024-01-01');
    });

    it('should skip rows before headerRow', () => {
      const csv = 'metadata line\nts,val\n2024-01-01,21.5\n';
      const buf = toBuffer(csv);
      const profile = { ...baseProfile(), headerRow: 2 };
      const { rows, headerLabels } = Parser.parse(buf, profile);
      should(headerLabels).deepEqual(['ts', 'val']);
      should(rows).have.length(1);
      should(rows[0][0]).equal('2024-01-01');
    });

    it('should return null headerLabels when headerRow is not specified', () => {
      const buf = toBuffer('2024-01-01,21.5\n');
      const { headerLabels } = Parser.parse(buf, baseProfile());
      should(headerLabels).be.null();
    });
  });

  describe('skipLastRows', () => {
    it('should remove the last N rows from data rows', () => {
      const csv = '2024-01-01,21.5\n2024-01-02,22.0\n2024-01-03,23.0\n';
      const buf = toBuffer(csv);
      const profile = { ...baseProfile(), skipLastRows: 1 };
      const { rows } = Parser.parse(buf, profile);
      should(rows).have.length(2);
      should(rows[0][0]).equal('2024-01-01');
      should(rows[1][0]).equal('2024-01-02');
    });

    it('should remove the last 2 rows', () => {
      const csv = 'a,1\nb,2\nc,3\nd,4\n';
      const buf = toBuffer(csv);
      const profile = { ...baseProfile(), skipLastRows: 2 };
      const { rows } = Parser.parse(buf, profile);
      should(rows).have.length(2);
      should(rows[0][0]).equal('a');
      should(rows[1][0]).equal('b');
    });
  });

  describe('excluded columns', () => {
    it('should filter out columns with role excluded', () => {
      const csv = '2024-01-01,ignored,21.5\n';
      const buf = toBuffer(csv);
      const profile = {
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const { rows, columnIndices } = Parser.parse(buf, profile);
      should(rows[0]).have.length(2);
      should(rows[0][0]).equal('2024-01-01');
      should(rows[0][1]).equal('21.5');
      should(columnIndices).deepEqual([0, 2]);
    });

    it('should return all columns when no column is excluded', () => {
      const csv = 'a,b,c\n';
      const buf = toBuffer(csv);
      const profile = {
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
          { columnIndex: 2, role: 'measurement', sensorConfigurationId: 6 },
        ],
      };
      const { rows, columnIndices } = Parser.parse(buf, profile);
      should(rows[0]).have.length(3);
      should(columnIndices).deepEqual([0, 1, 2]);
    });
  });

  describe('line ending variants', () => {
    it('should handle Windows line endings \\r\\n', () => {
      const buf = toBuffer('a,1\r\nb,2\r\n');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows).have.length(2);
    });

    it('should handle old Mac line endings \\r', () => {
      const buf = toBuffer('a,1\rb,2\r');
      const { rows } = Parser.parse(buf, baseProfile());
      should(rows).have.length(2);
    });
  });

  describe('return value structure', () => {
    it('should always return rows, headerLabels, and columnIndices', () => {
      const buf = toBuffer('2024-01-01,21.5\n');
      const result = Parser.parse(buf, baseProfile());
      should(result).have.property('rows');
      should(result).have.property('headerLabels');
      should(result).have.property('columnIndices');
    });
  });
});
