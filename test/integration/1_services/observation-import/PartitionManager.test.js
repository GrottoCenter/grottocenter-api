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

// ---------------------------------------------------------------------------
// gc_ensure_measurement_partition — the privileged entry point's own validation
// ---------------------------------------------------------------------------
//
// PartitionManager cannot produce these arguments: it derives the name and the
// boundaries from one (year, quarter) pair, so they always agree. That is
// exactly the caller assumption a SECURITY DEFINER function granted to gc_app
// must not rely on, so the checks are exercised directly against the function.

describe('gc_ensure_measurement_partition (validation)', () => {
  const ensure = (name, start, end) =>
    CommonService.query('SELECT gc_ensure_measurement_partition($1, $2, $3)', [
      name,
      start,
      end,
    ]);

  // sendNativeQuery wraps the driver error: the SQLSTATE sits under
  // raw.error.code, while the RAISE text ends up in the outer message.
  const sqlState = (error) => error.raw.error.code;

  const relationExists = async (name) => {
    const result = await CommonService.query(
      "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = $1",
      [name]
    );
    return result.rows.length > 0;
  };

  afterEach(async () => {
    await CommonService.query('DROP TABLE IF EXISTS t_measurement_2030_q1');
    await CommonService.query('DROP TABLE IF EXISTS t_measurement_1971_q1');
  });

  it('should reject a name that does not describe the given range', async () => {
    let error;
    try {
      // Would otherwise attach the 2031 range under a 2030 name, sending later
      // 2030 rows to t_measurement_default and blocking the real 2031 partition.
      await ensure('t_measurement_2030_q1', '2031-01-01', '2031-04-01');
    } catch (e) {
      error = e;
    }

    should.exist(error);
    should(sqlState(error)).equal('22023');
    should(error.message).match(/is the range of t_measurement_2031_q1/);
    should(await relationExists('t_measurement_2030_q1')).equal(false);
  });

  it('should reject a range that is not a whole quarter', async () => {
    let error;
    try {
      await ensure('t_measurement_2030_q1', '2030-01-01', '2030-03-01');
    } catch (e) {
      error = e;
    }

    should.exist(error);
    should(sqlState(error)).equal('22023');
    should(await relationExists('t_measurement_2030_q1')).equal(false);
  });

  it('should reject a name already held by something other than that partition', async () => {
    // A plain table, not a partition of t_measurement. The old existence check
    // matched on name alone and reported this as success.
    await CommonService.query(
      'CREATE TABLE t_measurement_1971_q1 (unrelated int)'
    );

    let error;
    try {
      await ensure('t_measurement_1971_q1', '1971-01-01', '1971-04-01');
    } catch (e) {
      error = e;
    }

    should.exist(error);
    should(sqlState(error)).equal('42P17');
    should(error.message).match(/already exists and is not that partition/);
  });

  it('should return without error when the exact partition already exists', async () => {
    await ensure('t_measurement_2030_q1', '2030-01-01', '2030-04-01');
    await ensure('t_measurement_2030_q1', '2030-01-01', '2030-04-01');

    should(await relationExists('t_measurement_2030_q1')).equal(true);
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
