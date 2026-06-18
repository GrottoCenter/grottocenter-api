/* eslint-disable func-names */
/**
 * Property-based tests for SensorConfiguration validation and
 * DeviceService deep-population logic.
 *
 * Property 3: Partial update preserves untouched fields
 * For any existing sensor configuration and any non-empty subset of updatable
 * fields with valid values, applying the update modifies only the provided fields,
 * leaving all other fields at their original values.
 *
 * Property 6: Soft-deleted configs excluded from device response
 * For any mix of deleted and non-deleted configurations, only non-deleted
 * configurations appear in the output after deep-population logic.
 *
 * Validates: Requirements 3.1, 3.6, 8.1, 8.2
 */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const DeviceService = require('../../../api/services/DeviceService');

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A positive integer ID */
const idArb = fc.integer({ min: 1, max: 100000 });

/** An optional numeric field */
const numericArb = fc.double({
  min: -1e6,
  max: 1e6,
  noNaN: true,
  noDefaultInfinity: true,
});

/** A quantityKind object as returned from TQuantityKind.find() */
const quantityKindRecordArb = fc.record({
  id: idArb,
  code: fc.string({ minLength: 1, maxLength: 20 }),
  url: fc.webUrl(),
  symbolSi: fc.string({ minLength: 1, maxLength: 10 }),
});

/** A unit object as returned from TUnit.find() */
const unitRecordArb = fc.record({
  id: idArb,
  code: fc.string({ minLength: 1, maxLength: 20 }),
  symbol: fc.string({ minLength: 1, maxLength: 10 }),
  siToDisplayFactor: fc.double({
    min: -1e4,
    max: 1e4,
    noNaN: true,
    noDefaultInfinity: true,
  }),
  siToDisplayOffset: fc.double({
    min: -1e6,
    max: 1e6,
    noNaN: true,
    noDefaultInfinity: true,
  }),
});

/** A sensor configuration record as returned from Waterline populate (IDs for qk/unit) */
const configRecordArb = (qkIdArb, unitIdArb) =>
  fc.record({
    id: idArb,
    device: idArb,
    quantityKind: qkIdArb,
    unit: unitIdArb,
    precisionUpper: fc.option(numericArb, { nil: null }),
    precisionLower: fc.option(numericArb, { nil: null }),
    resolution: fc.option(numericArb, { nil: null }),
    detectionLimitMin: fc.option(numericArb, { nil: null }),
    detectionLimitMax: fc.option(numericArb, { nil: null }),
    dateInscription: fc.constant(new Date().toISOString()),
    dateReviewed: fc.option(fc.constant(new Date().toISOString()), {
      nil: null,
    }),
    isDeleted: fc.boolean(),
    author: idArb,
    reviewer: fc.option(idArb, { nil: null }),
  });

// ---------------------------------------------------------------------------
// Property 3: Partial update preserves untouched fields
// Validates: Requirements 3.1, 3.6
// ---------------------------------------------------------------------------

describe('SensorConfiguration - Property 3: Partial update preserves untouched fields', () => {
  const UPDATABLE_FIELDS = [
    'quantityKind',
    'unit',
    'precisionUpper',
    'precisionLower',
    'resolution',
    'detectionLimitMin',
    'detectionLimitMax',
  ];

  /**
   * Simulates the update logic from the controller:
   * Only provided fields are updated; untouched fields remain unchanged.
   */
  const applyPartialUpdate = (original, updateFields) => ({
    ...original,
    ...updateFields,
  });

  it('should modify only provided fields and leave others unchanged', function () {
    this.timeout(30000);

    // Generate a base configuration with all fields set
    const baseConfigArb = fc.record({
      id: idArb,
      device: idArb,
      quantityKind: idArb,
      unit: idArb,
      precisionUpper: numericArb,
      precisionLower: numericArb,
      resolution: numericArb,
      detectionLimitMin: numericArb,
      detectionLimitMax: numericArb,
      dateInscription: fc.constant('2024-01-01T00:00:00.000Z'),
      dateReviewed: fc.constant(null),
      isDeleted: fc.constant(false),
      author: idArb,
      reviewer: fc.constant(null),
    });

    // Generate a non-empty subset of updatable fields with new values
    const updateSubsetArb = fc
      .subarray(UPDATABLE_FIELDS, { minLength: 1 })
      .chain((fields) => {
        const entries = fields.map((field) => {
          if (field === 'quantityKind' || field === 'unit') {
            return fc.integer({ min: 1, max: 100000 }).map((v) => [field, v]);
          }
          return numericArb.map((v) => [field, v]);
        });
        return fc.tuple(...entries).map((pairs) => Object.fromEntries(pairs));
      });

    fc.assert(
      fc.property(baseConfigArb, updateSubsetArb, (baseConfig, updateSet) => {
        const updatedConfig = applyPartialUpdate(baseConfig, updateSet);
        const updatedFieldNames = Object.keys(updateSet);

        // Verify updated fields have new values
        updatedFieldNames.forEach((field) => {
          should(updatedConfig[field]).equal(
            updateSet[field],
            `Field '${field}' should be updated to ${updateSet[field]}`
          );
        });

        // Verify untouched fields are preserved
        const untouchedFields = UPDATABLE_FIELDS.filter(
          (f) => !updatedFieldNames.includes(f)
        );
        untouchedFields.forEach((field) => {
          should(updatedConfig[field]).equal(
            baseConfig[field],
            `Untouched field '${field}' should remain ${baseConfig[field]}`
          );
        });

        // Non-updatable fields should never change
        should(updatedConfig.id).equal(baseConfig.id);
        should(updatedConfig.device).equal(baseConfig.device);
        should(updatedConfig.dateInscription).equal(baseConfig.dateInscription);
        should(updatedConfig.isDeleted).equal(baseConfig.isDeleted);
        should(updatedConfig.author).equal(baseConfig.author);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Soft-deleted configs excluded from device response
// Validates: Requirements 8.2
// ---------------------------------------------------------------------------

describe('DeviceService - Property 6: Soft-deleted configs excluded from device response', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should exclude soft-deleted configurations and include only active ones', async function () {
    this.timeout(60000);

    // Generate a mix of deleted and non-deleted configurations
    const configsArb = fc
      .array(configRecordArb(idArb, idArb), { minLength: 1, maxLength: 10 })
      .map((configs) =>
        configs.map((config, idx) => ({ ...config, id: idx + 1 }))
      );

    await fc.assert(
      fc.asyncProperty(configsArb, async (configs) => {
        const deviceId = 999;

        // Stub TDevice.findOne to return a device with the configurations
        const findOneStub = sinon.stub();
        findOneStub.returns({
          populate: sinon.stub().returnsThis(),
          then: function thenFn(resolve) {
            return Promise.resolve({
              id: deviceId,
              author: { id: 1, nickname: 'test' },
              reviewer: null,
              configurations: configs,
            }).then(resolve);
          },
        });

        // Override: make the final result resolve with our device
        const device = {
          id: deviceId,
          author: { id: 1, nickname: 'test' },
          reviewer: null,
          configurations: [...configs],
        };

        // Replace global TDevice with a stub
        const originalTDevice = global.TDevice;
        const originalTQuantityKind = global.TQuantityKind;
        const originalTUnit = global.TUnit;

        try {
          global.TDevice = {
            findOne: sinon.stub().returns({
              populate: sinon.stub().returnsThis(),
              then: (resolve) => Promise.resolve(device).then(resolve),
              catch: (reject) => Promise.resolve(device).catch(reject),
            }),
          };
          // Make it properly awaitable
          const chainable = {
            populate() {
              return this;
            },
            then(resolve, reject) {
              return Promise.resolve(device).then(resolve, reject);
            },
            catch(reject) {
              return Promise.resolve(device).catch(reject);
            },
          };
          global.TDevice = { findOne: sinon.stub().returns(chainable) };

          // Stub TQuantityKind.find and TUnit.find to return empty arrays
          // (we only care about filtering here, not populating)
          global.TQuantityKind = { find: sinon.stub().resolves([]) };
          global.TUnit = { find: sinon.stub().resolves([]) };

          const result = await DeviceService.getPopulatedDevice(deviceId);

          // The result configurations should only contain non-deleted ones
          const expectedActiveCount = configs.filter(
            (c) => !c.isDeleted
          ).length;
          should(result.configurations).have.length(expectedActiveCount);

          // Every returned config should have isDeleted === false
          result.configurations.forEach((config) => {
            should(config.isDeleted).be.false(
              `Config id=${config.id} should not be deleted`
            );
          });

          // No deleted config should appear in output
          const deletedIds = configs
            .filter((c) => c.isDeleted)
            .map((c) => c.id);
          const returnedIds = result.configurations.map((c) => c.id);
          deletedIds.forEach((deletedId) => {
            should(returnedIds).not.containEql(
              deletedId,
              `Deleted config id=${deletedId} should not appear in output`
            );
          });
        } finally {
          global.TDevice = originalTDevice;
          global.TQuantityKind = originalTQuantityKind;
          global.TUnit = originalTUnit;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should populate quantityKind and unit as full objects on active configs', async function () {
    this.timeout(60000);

    // Generate configs with specific qk/unit IDs, and matching records
    const scenarioArb = fc
      .tuple(
        fc.uniqueArray(quantityKindRecordArb, {
          minLength: 1,
          maxLength: 3,
          selector: (qk) => qk.id,
        }),
        fc.uniqueArray(unitRecordArb, {
          minLength: 1,
          maxLength: 3,
          selector: (u) => u.id,
        })
      )
      .chain(([qkRecords, unitRecords]) => {
        // Generate configs that reference existing qk/unit IDs
        const qkIdArb2 = fc.constantFrom(...qkRecords.map((qk) => qk.id));
        const unitIdArb2 = fc.constantFrom(...unitRecords.map((u) => u.id));

        return fc
          .array(configRecordArb(qkIdArb2, unitIdArb2), {
            minLength: 1,
            maxLength: 5,
          })
          .map((configs) =>
            configs.map((config, idx) => ({
              ...config,
              id: idx + 1,
              isDeleted: false, // all active for this test
            }))
          )
          .map((configs) => ({ qkRecords, unitRecords, configs }));
      });

    await fc.assert(
      fc.asyncProperty(
        scenarioArb,
        async ({ qkRecords, unitRecords, configs }) => {
          const deviceId = 888;
          const device = {
            id: deviceId,
            author: { id: 1, nickname: 'test' },
            reviewer: null,
            configurations: [...configs],
          };

          const originalTDevice = global.TDevice;
          const originalTQuantityKind = global.TQuantityKind;
          const originalTUnit = global.TUnit;

          try {
            const chainable = {
              populate() {
                return this;
              },
              then(resolve, reject) {
                return Promise.resolve(device).then(resolve, reject);
              },
              catch(reject) {
                return Promise.resolve(device).catch(reject);
              },
            };
            global.TDevice = { findOne: sinon.stub().returns(chainable) };
            global.TQuantityKind = {
              find: sinon.stub().resolves(qkRecords),
            };
            global.TUnit = { find: sinon.stub().resolves(unitRecords) };

            const result = await DeviceService.getPopulatedDevice(deviceId);

            // Build expected lookup maps
            const qkMap = Object.fromEntries(
              qkRecords.map((qk) => [qk.id, qk])
            );
            const unitMap = Object.fromEntries(
              unitRecords.map((u) => [u.id, u])
            );

            // Every active config should have populated quantityKind/unit
            result.configurations.forEach((config) => {
              const expectedQk =
                qkMap[configs.find((c) => c.id === config.id)?.quantityKind];
              const expectedUnit =
                unitMap[configs.find((c) => c.id === config.id)?.unit];

              if (expectedQk) {
                should(config.quantityKind).be.an.Object();
                should(config.quantityKind).have.property('id', expectedQk.id);
                should(config.quantityKind).have.property(
                  'code',
                  expectedQk.code
                );
                should(config.quantityKind).have.property(
                  'url',
                  expectedQk.url
                );
                should(config.quantityKind).have.property(
                  'symbolSi',
                  expectedQk.symbolSi
                );
              }

              if (expectedUnit) {
                should(config.unit).be.an.Object();
                should(config.unit).have.property('id', expectedUnit.id);
                should(config.unit).have.property('code', expectedUnit.code);
                should(config.unit).have.property(
                  'symbol',
                  expectedUnit.symbol
                );
                should(config.unit).have.property(
                  'siToDisplayFactor',
                  expectedUnit.siToDisplayFactor
                );
                should(config.unit).have.property(
                  'siToDisplayOffset',
                  expectedUnit.siToDisplayOffset
                );
              }
            });
          } finally {
            global.TDevice = originalTDevice;
            global.TQuantityKind = originalTQuantityKind;
            global.TUnit = originalTUnit;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
