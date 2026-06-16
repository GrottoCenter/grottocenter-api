/* eslint-disable func-names */
/**
 * Property-based tests for EntityBuilder substance propagation.
 *
 * Properties covered:
 *  - Property 5: Denormalized substance propagation (via build stubs)
 *  - Property 7: Substance propagation to profile metadata
 */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const FileService = require('../../../../api/services/FileService');
const EntityBuilder = require('../../../../api/services/observation-import/EntityBuilder');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Installs all the stubs needed for EntityBuilder.build().
 * Returns a tracker object that records time series data.
 */
function installStubs({ timeSeriesBaseId }) {
  const tracker = {
    timeSeriesCreated: [],
  };

  let timeSeriesIdCounter = timeSeriesBaseId;

  sinon.stub(sails, 'getDatastore').returns({
    transaction: async (fn) => fn('mock-db-connection'),
  });

  sinon.stub(TPoint, 'findOne').callsFake(() => ({
    usingConnection: () => Promise.resolve(null),
  }));
  sinon.stub(TPoint, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () =>
        Promise.resolve({
          id: 50,
          label: 'Test Point',
          latitude: null,
          longitude: null,
        }),
    }),
  }));

  sinon.stub(TName, 'findOne').callsFake(() => ({
    usingConnection: () => Promise.resolve(null),
  }));
  sinon.stub(TName, 'create').callsFake(() => ({
    usingConnection: () => Promise.resolve({ id: 999 }),
  }));

  sinon.stub(TObservationType, 'findOne').callsFake(() => ({
    usingConnection: () =>
      Promise.resolve({ id: 5, code: 'physical_measurements' }),
  }));

  sinon.stub(TObservation, 'create').callsFake((data) => ({
    usingConnection: () => ({
      fetch: () =>
        Promise.resolve({
          id: 100,
          observationDate: data.observationDate,
          observationTypeCode: data.observationTypeCode,
        }),
    }),
  }));

  sinon.stub(TDocument, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () => Promise.resolve({ id: 200 }),
    }),
  }));

  sinon.stub(TDescription, 'create').callsFake(() => ({
    usingConnection: () => Promise.resolve({ id: 998 }),
  }));

  sinon.stub(JDocumentCaverAuthor, 'create').callsFake(() => ({
    usingConnection: () => Promise.resolve({}),
  }));

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

  sinon
    .stub(CommonService, 'query')
    .callsFake(() => Promise.resolve({ rows: [] }));

  sinon.stub(TTimeSeriesQualityLog, 'create').callsFake(() => ({
    usingConnection: () => Promise.resolve({ id: 997 }),
  }));

  sinon.stub(FileService.document, 'create').callsFake(() => Promise.resolve());

  return tracker;
}

// ---------------------------------------------------------------------------
// Property 7: Substance propagation to profile metadata
// Validates: Requirements 7.2, 7.3
//
// For any sensor configuration resolved during import, buildProfileWithMetadata
// SHALL include the sensor config's substance value (or null) in the column
// metadata object under the key "substance".
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 7: Substance propagation to profile metadata', () => {
  it('should include substance in column metadata when sensor config has non-null substance', function () {
    this.timeout(10000);
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => s.trim().length > 0),
        (substance) => {
          const sensorConfigId = 42;
          const profile = {
            columnMappings: [
              {
                role: 'measurement',
                sensorConfigurationId: sensorConfigId,
                columnIndex: 0,
              },
            ],
          };
          const resolvedEntities = {
            sensorConfigs: new Map([
              [
                sensorConfigId,
                {
                  id: sensorConfigId,
                  substance,
                  quantityKind: { id: 17, code: 'Concentration' },
                  unit: { id: 1, symbol: '°C' },
                },
              ],
            ]),
            media: new Map(),
          };
          const unitMap = new Map([[1, { id: 1, symbol: '°C' }]]);
          const importResult = { observationId: 1 };

          const result = EntityBuilder.buildProfileWithMetadata(
            profile,
            importResult,
            resolvedEntities,
            unitMap
          );
          const col = result.columnMappings[0];

          should(col).have.property('metadata');
          should(col.metadata).have.property('substance', substance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include substance as null in column metadata when sensor config has null substance', function () {
    this.timeout(10000);
    fc.assert(
      fc.property(fc.constant(null), () => {
        const sensorConfigId = 42;
        const profile = {
          columnMappings: [
            {
              role: 'measurement',
              sensorConfigurationId: sensorConfigId,
              columnIndex: 0,
            },
          ],
        };
        const resolvedEntities = {
          sensorConfigs: new Map([
            [
              sensorConfigId,
              {
                id: sensorConfigId,
                substance: null,
                quantityKind: { id: 1, code: 'Temperature' },
                unit: { id: 1, symbol: '°C' },
              },
            ],
          ]),
          media: new Map(),
        };
        const unitMap = new Map([[1, { id: 1, symbol: '°C' }]]);
        const importResult = { observationId: 1 };

        const result = EntityBuilder.buildProfileWithMetadata(
          profile,
          importResult,
          resolvedEntities,
          unitMap
        );
        const col = result.columnMappings[0];

        should(col).have.property('metadata');
        should(col.metadata).have.property('substance', null);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Denormalized substance propagation
// Validates: Requirements 6.1, 6.3
//
// For any sensor configuration with a substance value (including null),
// when a time series is created referencing that configuration, the substance
// column on the t_time_series record SHALL equal the sensor configuration's
// substance value.
// ---------------------------------------------------------------------------

describe('EntityBuilder - Property 5: Denormalized substance propagation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should set time series substance to the sensor config substance value', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          fc.constant(null)
        ),
        async (substance) => {
          const sensorConfigId = 101;
          const timestamps = [new Date(1000000), new Date(2000000)];

          const measurements = timestamps.map(() => [
            { columnIndex: 1, value: 1.5, valueSi: 3.0 },
          ]);
          const parsedData = { rows: [], timestamps, measurements };

          const profile = {
            timezone: 'UTC',
            caveId: 1,
            pointLabel: 'Test Point',
            authorId: 7,
            licenseId: 1,
            dataQuality: 'raw',
            columnMappings: [
              { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
              {
                columnIndex: 1,
                role: 'measurement',
                sensorConfigurationId: sensorConfigId,
                mediumId: 201,
              },
            ],
          };

          const sensorConfigs = new Map([
            [
              sensorConfigId,
              {
                id: sensorConfigId,
                substance,
                unit: { id: 11, symbol: '°C' },
                quantityKind: { id: 21, code: 'Temperature' },
              },
            ],
          ]);
          const media = new Map([[201, { id: 201, code: 'water' }]]);

          const resolvedEntities = {
            cave: { id: 1 },
            license: { id: 1 },
            author: { id: 7 },
            media,
            sensorConfigs,
          };

          const tracker = installStubs({ timeSeriesBaseId: 300 });

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

          should(tracker.timeSeriesCreated.length).equal(1);
          const ts = tracker.timeSeriesCreated[0];

          should(ts.substance).equal(
            substance,
            `Expected substance "${substance}", got "${ts.substance}"`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
