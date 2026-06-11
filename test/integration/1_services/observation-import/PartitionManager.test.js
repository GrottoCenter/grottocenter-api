/**
 * Unit tests for PartitionManager — pure derivation functions.
 *
 * Tests extractQuarters and computeBoundaries independently of any DB.
 */
const should = require('should');
const PartitionManager = require('../../../../api/services/observation-import/PartitionManager');

// ---------------------------------------------------------------------------
// extractQuarters
// ---------------------------------------------------------------------------

describe('PartitionManager.extractQuarters', () => {
  it('should return an empty array for an empty input', () => {
    const result = PartitionManager.extractQuarters([]);
    should(result).be.an.Array().with.length(0);
  });

  it('should return a single quarter for a single timestamp', () => {
    const timestamps = [new Date('2024-03-15T10:00:00Z')];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([{ year: 2024, quarter: 1 }]);
  });

  it('should deduplicate timestamps in the same quarter', () => {
    const timestamps = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-02-15T12:00:00Z'),
      new Date('2024-03-31T23:59:59Z'),
    ];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([{ year: 2024, quarter: 1 }]);
  });

  it('should handle multiple quarters across multiple years', () => {
    const timestamps = [
      new Date('2023-11-01T00:00:00Z'), // Q4 2023
      new Date('2024-01-15T00:00:00Z'), // Q1 2024
      new Date('2024-07-20T00:00:00Z'), // Q3 2024
      new Date('2023-11-30T00:00:00Z'), // Q4 2023 (duplicate)
    ];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([
      { year: 2023, quarter: 4 },
      { year: 2024, quarter: 1 },
      { year: 2024, quarter: 3 },
    ]);
  });

  it('should sort results ascending by year then quarter', () => {
    // Feed timestamps in reverse order
    const timestamps = [
      new Date('2025-10-01T00:00:00Z'), // Q4 2025
      new Date('2024-04-01T00:00:00Z'), // Q2 2024
      new Date('2020-07-15T00:00:00Z'), // Q3 2020
    ];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([
      { year: 2020, quarter: 3 },
      { year: 2024, quarter: 2 },
      { year: 2025, quarter: 4 },
    ]);
  });

  it('should correctly classify boundary timestamps (first moment of quarter)', () => {
    // Jan 1 = Q1, Apr 1 = Q2, Jul 1 = Q3, Oct 1 = Q4
    const timestamps = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-04-01T00:00:00Z'),
      new Date('2024-07-01T00:00:00Z'),
      new Date('2024-10-01T00:00:00Z'),
    ];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([
      { year: 2024, quarter: 1 },
      { year: 2024, quarter: 2 },
      { year: 2024, quarter: 3 },
      { year: 2024, quarter: 4 },
    ]);
  });

  it('should correctly classify end-of-month boundary timestamps', () => {
    // March 31 = Q1, June 30 = Q2, Sep 30 = Q3, Dec 31 = Q4
    const timestamps = [
      new Date('2024-03-31T23:59:59Z'),
      new Date('2024-06-30T23:59:59Z'),
      new Date('2024-09-30T23:59:59Z'),
      new Date('2024-12-31T23:59:59Z'),
    ];
    const result = PartitionManager.extractQuarters(timestamps);
    should(result).deepEqual([
      { year: 2024, quarter: 1 },
      { year: 2024, quarter: 2 },
      { year: 2024, quarter: 3 },
      { year: 2024, quarter: 4 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// ensurePartitions (integration — verifies DDL against real PostgreSQL)
// ---------------------------------------------------------------------------

describe('PartitionManager.ensurePartitions (integration)', () => {
  const TEST_PARTITION = 't_measurement_1970_q1';

  afterEach(async () => {
    // Clean up: drop the test partition if it was created
    await CommonService.query(`DROP TABLE IF EXISTS ${TEST_PARTITION}`);
  });

  it('should create a valid partition in PostgreSQL', async () => {
    const timestamps = [new Date('1970-01-15T00:00:00Z')];

    const result = await PartitionManager.ensurePartitions(timestamps);

    should(result).deepEqual([TEST_PARTITION]);

    // Verify partition exists in pg_tables
    const pgResult = await CommonService.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = $1",
      [TEST_PARTITION]
    );
    should(pgResult.rows).have.length(1);
    should(pgResult.rows[0].tablename).equal(TEST_PARTITION);
  });

  it('should be idempotent — no error on second call', async () => {
    const timestamps = [new Date('1970-02-01T00:00:00Z')];

    await PartitionManager.ensurePartitions(timestamps);
    const result = await PartitionManager.ensurePartitions(timestamps);

    should(result).deepEqual([TEST_PARTITION]);
  });
});

describe('PartitionManager.computeBoundaries', () => {
  it('should compute Q1 boundaries', () => {
    const { start, end } = PartitionManager.computeBoundaries(2024, 1);
    should(start).equal('2024-01-01');
    should(end).equal('2024-04-01');
  });

  it('should compute Q2 boundaries', () => {
    const { start, end } = PartitionManager.computeBoundaries(2024, 2);
    should(start).equal('2024-04-01');
    should(end).equal('2024-07-01');
  });

  it('should compute Q3 boundaries', () => {
    const { start, end } = PartitionManager.computeBoundaries(2024, 3);
    should(start).equal('2024-07-01');
    should(end).equal('2024-10-01');
  });

  it('should compute Q4 boundaries', () => {
    const { start, end } = PartitionManager.computeBoundaries(2024, 4);
    should(start).equal('2024-10-01');
    should(end).equal('2025-01-01');
  });

  it('should handle year rollover for Q4', () => {
    const { start, end } = PartitionManager.computeBoundaries(2029, 4);
    should(start).equal('2029-10-01');
    should(end).equal('2030-01-01');
  });

  it('should handle far-future years', () => {
    const { start, end } = PartitionManager.computeBoundaries(2050, 2);
    should(start).equal('2050-04-01');
    should(end).equal('2050-07-01');
  });

  it('should handle historical years', () => {
    const { start, end } = PartitionManager.computeBoundaries(1995, 1);
    should(start).equal('1995-01-01');
    should(end).equal('1995-04-01');
  });
});
