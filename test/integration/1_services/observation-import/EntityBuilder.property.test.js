/* eslint-disable func-names */
/**
 * Property-based tests for EntityBuilder.
 *
 * All Waterline models and CommonService.query are stubbed — these tests
 * never touch a real database or Azure. Stubs are installed and restored
 * per-run inside each asyncProperty.
 *
 * Properties covered:
 *  - Property 7:  Point reuse semantics
 *  - Property 8:  Entity count invariants
 *  - Property 9:  Time series metadata matches measurement aggregates
 *  - Property 10: Denormalized time series fields match source entities
 *  - Property 11: Document title derivation
 *  - Property 12: Observation name creation
 *  - Property 14: observationDate = min(timestamps)
 */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const FileService = require('../../../../api/services/FileService');
const EntityBuilder = require('../../../../api/services/observation-import/EntityBuilder');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const idArb = fc.integer({ min: 1, max: 99999 });
const nonEmptyString = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);
const whitespaceOnlyString = fc.constantFrom('', '   ', '\t', '\n', '  \t  ');

/**
 * Builds a parsedData object for N columns and R rows of measurements.
 * Each row has exactly one measurement per measurement column.
 */
function buildParsedData(timestamps, columnIndices) {
  const measurements = timestamps.map((_, rowIdx) =>
    columnIndices.map((colIdx) => ({
      columnIndex: colIdx,
      value: rowIdx + colIdx * 0.1,
      valueSi: (rowIdx + colIdx * 0.1) * 2,
    }))
  );
  return { rows: [], timestamps, measurements };
}

/**
 * Builds a minimal valid profile for N measurement columns.
 */
function buildProfile(columnIndices, overrides = {}) {
  return {
    timezone: 'Europe/Paris',
    caveId: 1,
    pointLabel: 'Test Point',
    authorIds: [7],
    licenseId: 1,
    dataQuality: 'raw',
    columnMappings: [
      { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
      ...columnIndices.map((ci) => ({
        columnIndex: ci,
        role: 'measurement',
        sensorConfigurationId: 100 + ci,
        mediumId: 200 + ci,
      })),
    ],
    ...overrides,
  };
}

/**
 * Builds a minimal resolvedEntities object for N measurement columns.
 */
function buildResolvedEntities(columnIndices) {
  const sensorConfigs = new Map();
  const media = new Map();

  columnIndices.forEach((ci) => {
    sensorConfigs.set(100 + ci, {
      id: 100 + ci,
      unit: 10 + ci,
      quantityKind: {
        id: 20 + ci,
        code: `quantity_${ci}`,
      },
    });
    media.set(200 + ci, {
      id: 200 + ci,
      code: `medium_${ci}`,
    });
  });

  return {
    cave: { id: 1 },
    license: { id: 1 },
    authors: [{ id: 7 }],
    media,
    sensorConfigs,
  };
}

/**
 * Installs all the stubs needed for EntityBuilder.build().
 * Returns a tracker object that records which stubs were called and how.
 */
function installStubs({
  existingPoint,
  createdPointId,
  observationId,
  documentId,
  timeSeriesBaseId,
}) {
  const tracker = {
    pointFindOneCalled: false,
    pointCreateCalled: false,
    nameFindOneCalled: false,
    observationCreateCalled: false,
    documentCreateCalled: false,
    descriptionCreateCalled: false,
    junctionCreateCalled: false,
    timeSeriesCreated: [],
    measurementQueriesCount: 0,
    qualityLogCreated: [],
    nameCreateCalled: false,
    fileServiceCalled: false,
  };

  let timeSeriesIdCounter = timeSeriesBaseId;

  // --- sails.getDatastore().transaction ---
  sinon.stub(sails, 'getDatastore').returns({
    transaction: async (fn) => fn('mock-db-connection'),
  });

  // --- TPoint ---
  sinon.stub(TPoint, 'findOne').callsFake(() => ({
    usingConnection: () => {
      tracker.pointFindOneCalled = true;
      return Promise.resolve(existingPoint || null);
    },
  }));
  sinon.stub(TPoint, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.pointCreateCalled = true;
        return Promise.resolve({
          id: createdPointId,
          label: 'Test Point',
          latitude: null,
          longitude: null,
        });
      },
    }),
  }));

  // --- TName (findOne for cave name, create for observation name) ---
  sinon.stub(TName, 'findOne').callsFake(() => ({
    usingConnection: () => {
      tracker.nameFindOneCalled = true;
      return Promise.resolve(null);
    },
  }));
  sinon.stub(TName, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.nameCreateCalled = true;
      return Promise.resolve({ id: 999 });
    },
  }));

  // --- TObservationType ---
  sinon.stub(TObservationType, 'findOne').callsFake(() => ({
    usingConnection: () =>
      Promise.resolve({ id: 5, code: 'physical_measurements' }),
  }));

  // --- TObservation ---
  sinon.stub(TObservation, 'create').callsFake((data) => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.observationCreateCalled = true;
        return Promise.resolve({
          id: observationId,
          observationDate: data.observationDate,
          observationTypeCode: data.observationTypeCode,
        });
      },
    }),
  }));

  // --- TDocument ---
  sinon.stub(TDocument, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.documentCreateCalled = true;
        return Promise.resolve({ id: documentId });
      },
    }),
  }));

  // --- TDescription ---
  sinon.stub(TDescription, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.descriptionCreateCalled = true;
      return Promise.resolve({ id: 998 });
    },
  }));

  // --- JDocumentCaverAuthor ---
  sinon.stub(JDocumentCaverAuthor, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.junctionCreateCalled = true;
      return Promise.resolve({});
    },
  }));

  // --- TUnit ---
  sinon.stub(TUnit, 'find').callsFake((criteria) => ({
    usingConnection: () => {
      const ids = Array.isArray(criteria.id) ? criteria.id : [criteria.id];
      return Promise.resolve(ids.map((id) => ({ id, symbol: `sym_${id}` })));
    },
  }));

  // --- TTimeSeries ---
  sinon.stub(TTimeSeries, 'create').callsFake((data) => ({
    usingConnection: () => ({
      fetch: () => {
        const id = timeSeriesIdCounter;
        timeSeriesIdCounter += 1;
        tracker.timeSeriesCreated.push({ id, ...data });
        return Promise.resolve({ id, ...data });
      },
    }),
  }));

  // --- CommonService.query (bulk inserts + partition DDL) ---
  sinon.stub(CommonService, 'query').callsFake((sql) => {
    if (sql && sql.startsWith('INSERT INTO t_measurement')) {
      tracker.measurementQueriesCount += 1;
    }
    return Promise.resolve({ rows: [] });
  });

  // --- TTimeSeriesQualityLog ---
  sinon.stub(TTimeSeriesQualityLog, 'create').callsFake((data) => ({
    usingConnection: () => {
      tracker.qualityLogCreated.push(data);
      return Promise.resolve({ id: 997 });
    },
  }));

  // --- FileService ---
  sinon.stub(FileService.document, 'create').callsFake(() => {
    tracker.fileServiceCalled = true;
    return Promise.resolve();
  });

  return tracker;
}

// ---------------------------------------------------------------------------
// Property 7: Point reuse semantics
// Validates: Requirements 6.3, 6.4
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 7: Point reuse semantics', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should return existing point ID when point exists, or create new one when not', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // pointExists
        idArb, // existingPointId
        idArb, // newPointId
        async (pointExists, existingPointId, newPointId) => {
          const existingPoint = pointExists
            ? {
                id: existingPointId,
                label: 'Test Point',
                latitude: null,
                longitude: null,
              }
            : null;

          const tracker = installStubs({
            existingPoint,
            createdPointId: newPointId,
            observationId: 1,
            documentId: 2,
            timeSeriesBaseId: 10,
          });

          const columnIndices = [1]; // 1 measurement column
          const timestamps = [new Date(1000000), new Date(2000000)];
          const parsedData = buildParsedData(timestamps, columnIndices);
          const profile = buildProfile(columnIndices);
          const resolvedEntities = buildResolvedEntities(columnIndices);

          let result;
          try {
            result = await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'data.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          // Point lookup always happens
          should(tracker.pointFindOneCalled).be.true();

          if (pointExists) {
            // Existing point: create should NOT be called
            should(tracker.pointCreateCalled).be.false(
              'TPoint.create should not be called when point exists'
            );
            should(result.pointId).equal(
              existingPointId,
              `Expected pointId ${existingPointId}, got ${result.pointId}`
            );
          } else {
            // New point: create should be called
            should(tracker.pointCreateCalled).be.true(
              'TPoint.create should be called when point does not exist'
            );
            should(result.pointId).equal(
              newPointId,
              `Expected new pointId ${newPointId}, got ${result.pointId}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Entity count invariants
// Validates: Requirements 6.5, 6.7, 6.8, 6.9
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 8: Entity count invariants', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should create exactly 1 observation, 1 document, N time series, and N quality logs for N columns', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }), // N measurement columns
        fc.integer({ min: 1, max: 10 }), // R rows
        async (numCols, numRows) => {
          const columnIndices = Array.from(
            { length: numCols },
            (_, i) => i + 1
          );
          const timestamps = Array.from(
            { length: numRows },
            (_, i) => new Date(i * 1000000 + 1000)
          );
          const parsedData = buildParsedData(timestamps, columnIndices);
          const profile = buildProfile(columnIndices);
          const resolvedEntities = buildResolvedEntities(columnIndices);

          const tracker = installStubs({
            existingPoint: null,
            createdPointId: 50,
            observationId: 100,
            documentId: 200,
            timeSeriesBaseId: 300,
          });

          try {
            await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'test.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          // Exactly 1 observation
          should(tracker.observationCreateCalled).be.true(
            'observation should be created'
          );

          // Exactly 1 document
          should(tracker.documentCreateCalled).be.true(
            'document should be created'
          );

          // Exactly N time series
          should(tracker.timeSeriesCreated.length).equal(
            numCols,
            `Expected ${numCols} time series but got ${tracker.timeSeriesCreated.length}`
          );

          // Exactly N quality log entries
          should(tracker.qualityLogCreated.length).equal(
            numCols,
            `Expected ${numCols} quality log entries but got ${tracker.qualityLogCreated.length}`
          );

          // N*R total measurements: each time series gets R measurements,
          // inserted in ceil(R / 1000) batches per time series.
          const expectedBatches = numCols * Math.ceil(numRows / 1000);
          should(tracker.measurementQueriesCount).equal(
            expectedBatches,
            `Expected ${expectedBatches} bulk INSERT queries but got ${tracker.measurementQueriesCount}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Time series metadata matches measurement aggregates
// Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 9: Time series metadata matches measurement aggregates', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should set startDate=min, endDate=max, measurementCount=R, minValue, maxValue correctly', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }).chain((n) =>
          fc.uniqueArray(
            fc
              .integer({ min: 0, max: 1_000_000 })
              .map((s) => new Date(s * 1000)),
            { minLength: n, maxLength: n, selector: (d) => d.getTime() }
          )
        ),
        async (timestamps) => {
          const columnIndices = [1]; // single measurement column for simplicity
          const numRows = timestamps.length;

          // Assign predictable values so we can verify min/max
          const measurements = timestamps.map((_, rowIdx) => [
            { columnIndex: 1, value: rowIdx + 1, valueSi: (rowIdx + 1) * 2 },
          ]);
          const parsedData = { rows: [], timestamps, measurements };
          const profile = buildProfile(columnIndices);
          const resolvedEntities = buildResolvedEntities(columnIndices);

          const tracker = installStubs({
            existingPoint: null,
            createdPointId: 50,
            observationId: 100,
            documentId: 200,
            timeSeriesBaseId: 300,
          });

          try {
            await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'test.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          should(tracker.timeSeriesCreated.length).equal(1);
          const ts = tracker.timeSeriesCreated[0];

          const minTime = Math.min(...timestamps.map((t) => t.getTime()));
          const maxTime = Math.max(...timestamps.map((t) => t.getTime()));
          const expectedMin = 1; // values are 1..numRows
          const expectedMax = numRows;

          should(ts.startDate.getTime()).equal(
            minTime,
            `startDate mismatch: expected ${new Date(minTime)}, got ${ts.startDate}`
          );
          should(ts.endDate.getTime()).equal(
            maxTime,
            `endDate mismatch: expected ${new Date(maxTime)}, got ${ts.endDate}`
          );
          should(ts.measurementCount).equal(
            numRows,
            `measurementCount mismatch: expected ${numRows}, got ${ts.measurementCount}`
          );
          should(ts.minValue).equal(
            expectedMin,
            `minValue mismatch: expected ${expectedMin}, got ${ts.minValue}`
          );
          should(ts.maxValue).equal(
            expectedMax,
            `maxValue mismatch: expected ${expectedMax}, got ${ts.maxValue}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Denormalized time series fields match source entities
// Validates: Requirements 7.9, 7.10
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 10: Denormalized time series fields match source entities', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should populate quantityKindCode, mediumCode, and timezoneOffset from resolved entities', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 30 })
          .filter((s) => /^[a-z_]+$/.test(s)), // quantityKindCode
        fc
          .string({ minLength: 1, maxLength: 30 })
          .filter((s) => /^[a-z_]+$/.test(s)), // mediumCode
        fc.constantFrom(
          'Europe/Paris',
          'America/New_York',
          'UTC',
          'Asia/Tokyo'
        ), // timezone
        async (quantityKindCode, mediumCode, timezone) => {
          const columnIndices = [1];
          const timestamps = [new Date(1000000), new Date(2000000)];
          const parsedData = buildParsedData(timestamps, columnIndices);

          const profile = buildProfile(columnIndices, { timezone });

          const sensorConfigs = new Map([
            [
              101,
              {
                id: 101,
                unit: 11,
                quantityKind: { id: 21, code: quantityKindCode },
              },
            ],
          ]);
          const media = new Map([[201, { id: 201, code: mediumCode }]]);

          const resolvedEntities = {
            cave: { id: 1 },
            license: { id: 1 },
            authors: [{ id: 7 }],
            media,
            sensorConfigs,
          };

          const tracker = installStubs({
            existingPoint: null,
            createdPointId: 50,
            observationId: 100,
            documentId: 200,
            timeSeriesBaseId: 300,
          });

          try {
            await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'test.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          should(tracker.timeSeriesCreated.length).equal(1);
          const ts = tracker.timeSeriesCreated[0];

          should(ts.quantityKindCode).equal(
            quantityKindCode,
            `quantityKindCode mismatch: expected ${quantityKindCode}, got ${ts.quantityKindCode}`
          );
          should(ts.mediumCode).equal(
            mediumCode,
            `mediumCode mismatch: expected ${mediumCode}, got ${ts.mediumCode}`
          );
          should(ts.timezoneOffset).equal(
            timezone,
            `timezoneOffset mismatch: expected ${timezone}, got ${ts.timezoneOffset}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Document title derivation
// Validates: Requirements 8.6, 8.7
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 11: Document title derivation', () => {
  it('should use documentTitle when non-whitespace, else filename without extension', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          nonEmptyString.map((s) => ({ type: 'nonEmpty', value: s })),
          whitespaceOnlyString.map((s) => ({ type: 'whitespace', value: s })),
          fc.constant({ type: 'undefined', value: undefined })
        ),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)), // base filename
        fc.constantFrom('csv', 'txt', 'tsv'), // extension
        ({ type, value: documentTitle }, baseName, ext) => {
          const filename = `${baseName}.${ext}`;
          const result = EntityBuilder.deriveDocumentTitle(
            documentTitle,
            filename
          );

          if (type === 'nonEmpty') {
            should(result).equal(
              documentTitle.trim(),
              `Expected trimmed documentTitle "${documentTitle.trim()}", got "${result}"`
            );
          } else {
            // whitespace-only or undefined → use filename without extension
            should(result).equal(
              baseName,
              `Expected filename base "${baseName}", got "${result}"`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Observation name creation
// Validates: Requirements 11.1, 11.2
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 12: Observation name creation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should create TName iff observationName contains non-whitespace', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          nonEmptyString.map((s) => ({ type: 'nonEmpty', value: s })),
          whitespaceOnlyString.map((s) => ({ type: 'whitespace', value: s })),
          fc.constant({ type: 'null', value: null }),
          fc.constant({ type: 'undefined', value: undefined })
        ),
        async ({ type, value: observationName }) => {
          const columnIndices = [1];
          const timestamps = [new Date(1000000)];
          const parsedData = buildParsedData(timestamps, columnIndices);
          const profile = buildProfile(columnIndices, { observationName });
          const resolvedEntities = buildResolvedEntities(columnIndices);

          const tracker = installStubs({
            existingPoint: null,
            createdPointId: 50,
            observationId: 100,
            documentId: 200,
            timeSeriesBaseId: 300,
          });

          try {
            await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'data.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          if (type === 'nonEmpty') {
            should(tracker.nameCreateCalled).be.true(
              `TName.create should be called when observationName="${observationName}"`
            );
          } else {
            should(tracker.nameCreateCalled).be.false(
              `TName.create should NOT be called when observationName="${observationName}"`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: observationDate equals earliest timestamp
// Validates: Requirements 6.6
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 14: observationDate equals earliest timestamp', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should set observationDate to min(timestamps)', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }).chain((n) =>
          fc.uniqueArray(
            fc
              .integer({ min: 0, max: 1_000_000 })
              .map((s) => new Date(s * 1000 + 1)),
            { minLength: n, maxLength: n, selector: (d) => d.getTime() }
          )
        ),
        async (timestamps) => {
          const columnIndices = [1];
          const parsedData = buildParsedData(timestamps, columnIndices);
          const profile = buildProfile(columnIndices);
          const resolvedEntities = buildResolvedEntities(columnIndices);

          installStubs({
            existingPoint: null,
            createdPointId: 50,
            observationId: 100,
            documentId: 200,
            timeSeriesBaseId: 300,
          });

          let result;
          try {
            result = await EntityBuilder.build({
              parsedData,
              profile,
              resolvedEntities,
              file: {
                buffer: Buffer.from(''),
                originalname: 'data.csv',
                size: 0,
              },
              requestAuthorId: 7,
            });
          } finally {
            sinon.restore();
          }

          const minTimestamp = new Date(
            Math.min(...timestamps.map((t) => t.getTime()))
          );

          should(result.observationDate.getTime()).equal(
            minTimestamp.getTime(),
            `observationDate ${result.observationDate} should equal min timestamp ${minTimestamp}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
