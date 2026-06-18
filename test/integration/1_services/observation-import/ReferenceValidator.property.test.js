/* eslint-disable func-names */
/**
 * Property-based tests for ReferenceValidator.
 *
 * Property 13: Reference validation completeness
 *
 * For any profile containing M entity references (caveId, licenseId, authorIds,
 * mediumId per column, sensorConfigurationId per column), if K of
 * those references point to nonexistent entities, the reference validator SHALL
 * report exactly K errors.
 *
 * Since ReferenceValidator makes DB calls, all model lookups are stubbed with
 * sinon. Stubs are restored after each run inside the property.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const ReferenceValidator = require('../../../../api/services/observation-import/ReferenceValidator');

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A positive integer suitable for IDs */
const idArb = fc.integer({ min: 1, max: 9999 });

/** Boolean arbitrary for "exists" flag */
const existsArb = fc.boolean();

/**
 * Generates a profile-with-existence-map in a way that avoids ID ambiguity:
 * each unique ID across all columns gets exactly ONE existence flag,
 * so stubs and expected-error counts are consistent.
 *
 * Strategy:
 * 1. Generate a pool of unique IDs (4 sensor config IDs, 4 medium IDs)
 * 2. For each ID in the pool, generate a boolean "exists" flag
 * 3. Build column mappings that reference IDs from these pools
 * 4. The stubs and expected counts both use the per-ID existence flag
 */
const profileWithExistenceArb = fc
  .record({
    // Top-level entity IDs and their existence flags
    caveId: fc.option(idArb, { nil: undefined }),
    caveExists: existsArb,

    licenseId: idArb,
    licenseExists: existsArb,

    // Pool of unique author IDs (1–3) for multi-author scenarios
    authorIds: fc.uniqueArray(idArb, { minLength: 1, maxLength: 3 }),

    // Pools of unique IDs for column-level references
    // Up to 4 unique sensor config IDs and 4 unique medium IDs
    sensorIds: fc.uniqueArray(idArb, { minLength: 1, maxLength: 4 }),
    mediumIds: fc.uniqueArray(idArb, { minLength: 1, maxLength: 4 }),
  })
  .chain((base) => {
    // Generate existence flags for each unique sensor, medium, and author ID
    const sensorExistsArbs = base.sensorIds.map(() => existsArb);
    const mediumExistsArbs = base.mediumIds.map(() => existsArb);
    const authorExistsArbs = base.authorIds.map(() => existsArb);

    return fc
      .tuple(
        fc.tuple(...sensorExistsArbs),
        fc.tuple(...mediumExistsArbs),
        fc.tuple(...authorExistsArbs),
        // Number of column mappings (1–4)
        fc.integer({ min: 1, max: 4 })
      )
      .chain(([sensorExistsArr, mediumExistsArr, authorExistsArr, numCols]) => {
        // Build existence maps (id → boolean)
        const sensorExistsMap = new Map(
          base.sensorIds.map((id, i) => [id, sensorExistsArr[i]])
        );
        const mediumExistsMap = new Map(
          base.mediumIds.map((id, i) => [id, mediumExistsArr[i]])
        );
        const authorExistsMap = new Map(
          base.authorIds.map((id, i) => [id, authorExistsArr[i]])
        );

        // Generate column mappings that reference IDs from the pools
        const colArbs = Array.from({ length: numCols }, (_, colIdx) =>
          fc.record({
            columnIndex: fc.constant(colIdx),
            role: fc.constantFrom('measurement', 'timestamp', 'excluded'),
            // Pick a sensor ID from the pool, or undefined
            sensorConfigurationId: fc.option(
              fc
                .integer({ min: 0, max: base.sensorIds.length - 1 })
                .map((i) => base.sensorIds[i]),
              { nil: undefined }
            ),
            // Pick a medium ID from the pool, or undefined
            mediumId: fc.option(
              fc
                .integer({ min: 0, max: base.mediumIds.length - 1 })
                .map((i) => base.mediumIds[i]),
              { nil: undefined }
            ),
          })
        );

        return fc.tuple(...colArbs).map((columnMappings) => ({
          profile: {
            caveId: base.caveId,
            licenseId: base.licenseId,
            authorIds: base.authorIds,
            columnMappings,
          },
          topLevel: {
            caveExists: base.caveExists,
            licenseExists: base.licenseExists,
          },
          authorExistsMap,
          sensorExistsMap,
          mediumExistsMap,
        }));
      });
  });

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

/**
 * Installs findOne stubs for all Waterline models used by ReferenceValidator.
 *
 * Existence is determined per unique ID (not per column), so the stubs are
 * consistent with the expected error count.
 */
function installStubs(
  profile,
  topLevel,
  authorExistsMap,
  sensorExistsMap,
  mediumExistsMap
) {
  // Build lookup maps for each model
  const caveMap = new Map();
  const licenseMap = new Map();
  const caverMap = new Map();
  const mediumMap = new Map();
  const sensorConfigMap = new Map();

  // Top-level entities
  if (profile.caveId !== undefined && profile.caveId !== null) {
    if (topLevel.caveExists)
      caveMap.set(profile.caveId, { id: profile.caveId });
  }
  if (profile.licenseId !== undefined && profile.licenseId !== null) {
    if (topLevel.licenseExists)
      licenseMap.set(profile.licenseId, { id: profile.licenseId });
  }
  // Per-author existence
  if (profile.authorIds && profile.authorIds.length > 0) {
    profile.authorIds.forEach((id) => {
      if (authorExistsMap.get(id)) {
        caverMap.set(id, { id });
      }
    });
  }

  // Per-ID existence for medium and sensor config
  sensorExistsMap.forEach((exists, id) => {
    if (exists) {
      sensorConfigMap.set(id, {
        id,
        quantityKind: { id: 1, code: 'temperature' },
        unit: { id: 1, siToDisplayFactor: '1', siToDisplayOffset: '-273.15' },
      });
    }
  });
  mediumExistsMap.forEach((exists, id) => {
    if (exists) {
      mediumMap.set(id, { id });
    }
  });

  // Stub TCave.findOne
  sinon.stub(TCave, 'findOne').callsFake((criteria) => ({
    then: (resolve) => Promise.resolve(caveMap.get(criteria.id)).then(resolve),
  }));

  // Stub TLicense.findOne
  sinon.stub(TLicense, 'findOne').callsFake((criteria) => ({
    then: (resolve) =>
      Promise.resolve(licenseMap.get(criteria.id)).then(resolve),
  }));

  // Stub TCaver.findOne
  sinon.stub(TCaver, 'findOne').callsFake((criteria) => ({
    then: (resolve) => Promise.resolve(caverMap.get(criteria.id)).then(resolve),
  }));

  // Stub TMedium.findOne
  sinon.stub(TMedium, 'findOne').callsFake((criteria) => ({
    then: (resolve) =>
      Promise.resolve(mediumMap.get(criteria.id)).then(resolve),
  }));

  // Stub TSensorConfiguration.findOne — must support .populate('quantityKind').populate('unit')
  sinon.stub(TSensorConfiguration, 'findOne').callsFake((criteria) => {
    const record = sensorConfigMap.get(criteria.id);
    const populatable = {
      populate: () => populatable,
      then: (resolve) => Promise.resolve(record).then(resolve),
    };
    return populatable;
  });
}

/**
 * Counts how many distinct entity references in the profile are "missing"
 * (i.e., exists=false in the existence maps).
 *
 * Only IDs that are present (non-null, non-undefined) in the profile are
 * counted. Column-level IDs are deduplicated — each unique ID only contributes
 * 1 error regardless of how many columns reference it.
 */
function countExpectedErrors(
  profile,
  topLevel,
  authorExistsMap,
  sensorExistsMap,
  mediumExistsMap
) {
  let count = 0;

  // Top-level
  if (profile.caveId !== undefined && profile.caveId !== null) {
    if (!topLevel.caveExists) count += 1;
  }
  if (profile.licenseId !== undefined && profile.licenseId !== null) {
    if (!topLevel.licenseExists) count += 1;
  }
  // Author(s): count each unique author ID that doesn't exist
  const uniqueAuthorIds = [...new Set(profile.authorIds || [])];
  uniqueAuthorIds.forEach((id) => {
    if (!authorExistsMap.get(id)) count += 1;
  });

  // Per-column: collect the unique IDs actually referenced in measurement
  // columns, then check whether they exist. Non-measurement columns are
  // ignored by ReferenceValidator.
  const referencedMediumIds = new Set();
  const referencedSensorIds = new Set();

  (profile.columnMappings || []).forEach((col) => {
    if (col.role !== 'measurement') return;
    if (col.mediumId !== undefined && col.mediumId !== null) {
      referencedMediumIds.add(col.mediumId);
    }
    if (
      col.sensorConfigurationId !== undefined &&
      col.sensorConfigurationId !== null
    ) {
      referencedSensorIds.add(col.sensorConfigurationId);
    }
  });

  referencedMediumIds.forEach((id) => {
    // If the ID is in the map and doesn't exist, count an error.
    // If the ID is not in the map at all, it means it wasn't generated
    // (can happen if pool was empty after dedup) — treat as missing.
    const exists = mediumExistsMap.get(id);
    if (exists === false) count += 1;
  });

  referencedSensorIds.forEach((id) => {
    const exists = sensorExistsMap.get(id);
    if (exists === false) count += 1;
  });

  return count;
}

// ---------------------------------------------------------------------------
// Property 13: Reference validation completeness
// Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
// ---------------------------------------------------------------------------

describe('ReferenceValidator - Property 13: Reference validation completeness', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should report exactly K errors when K out of M references are nonexistent', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        profileWithExistenceArb,
        async ({
          profile,
          topLevel,
          authorExistsMap,
          sensorExistsMap,
          mediumExistsMap,
        }) => {
          // Install stubs before calling validate
          installStubs(
            profile,
            topLevel,
            authorExistsMap,
            sensorExistsMap,
            mediumExistsMap
          );

          let result;
          try {
            result = await ReferenceValidator.validate(profile);
          } finally {
            sinon.restore();
          }

          const expectedErrorCount = countExpectedErrors(
            profile,
            topLevel,
            authorExistsMap,
            sensorExistsMap,
            mediumExistsMap
          );

          should(result.errors.length).equal(
            expectedErrorCount,
            `Expected ${expectedErrorCount} errors but got ${result.errors.length}.\n` +
              `Profile: ${JSON.stringify(profile, null, 2)}\n` +
              `Top-level existence: ${JSON.stringify(topLevel)}\n` +
              `Actual errors: ${JSON.stringify(result.errors)}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return resolved entities for all entities that exist', async function () {
    this.timeout(30000);

    // A profile where all referenced entities exist
    const allExistProfile = {
      caveId: 1,
      licenseId: 2,
      authorIds: [3],
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        {
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 10,
          mediumId: 5,
        },
      ],
    };

    const topLevel = {
      caveExists: true,
      licenseExists: true,
    };
    const authorExistsMap = new Map([[3, true]]);
    const sensorExistsMap = new Map([[10, true]]);
    const mediumExistsMap = new Map([[5, true]]);

    installStubs(
      allExistProfile,
      topLevel,
      authorExistsMap,
      sensorExistsMap,
      mediumExistsMap
    );

    let result;
    try {
      result = await ReferenceValidator.validate(allExistProfile);
    } finally {
      sinon.restore();
    }

    should(result.errors).have.length(0);
    should(result.resolved.cave).be.ok();
    should(result.resolved.license).be.ok();
    should(result.resolved.media.has(5)).be.true();
    should(result.resolved.sensorConfigs.has(10)).be.true();
  });

  it('should include field name and ID in each error message', async function () {
    this.timeout(10000);

    const profile = {
      caveId: 999,
      licenseId: 888,
      authorIds: [777],
      columnMappings: [
        {
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 555,
          mediumId: 444,
        },
      ],
    };

    const topLevel = {
      caveExists: false,
      licenseExists: false,
    };
    const authorExistsMap = new Map([[777, false]]);
    const sensorExistsMap = new Map([[555, false]]);
    const mediumExistsMap = new Map([[444, false]]);

    installStubs(
      profile,
      topLevel,
      authorExistsMap,
      sensorExistsMap,
      mediumExistsMap
    );

    let result;
    try {
      result = await ReferenceValidator.validate(profile);
    } finally {
      sinon.restore();
    }

    // 5 errors: caveId, licenseId, authorIds, sensorConfigurationId, mediumId
    should(result.errors.length).equal(5);

    const errorText = result.errors.join('\n');
    should(errorText).containEql('999'); // caveId
    should(errorText).containEql('888'); // licenseId
    should(errorText).containEql('777'); // authorIds
    should(errorText).containEql('555'); // sensorConfigurationId
    should(errorText).containEql('444'); // mediumId

    should(errorText).containEql('caveId');
    should(errorText).containEql('licenseId');
    should(errorText).containEql('authorIds');
    should(errorText).containEql('sensorConfigurationId');
    should(errorText).containEql('mediumId');
  });

  it('should report errors only for nonexistent authors when authorIds has mixed existence', async function () {
    this.timeout(10000);

    const profile = {
      caveId: 1,
      licenseId: 2,
      authorIds: [3, 777, 888],
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        {
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 10,
          mediumId: 5,
        },
      ],
    };

    // Stubs: cave, license, sensor, medium all exist; author 3 exists, 777 and 888 do not
    const caveMap = new Map([[1, { id: 1 }]]);
    const licenseMap = new Map([[2, { id: 2 }]]);
    const caverMap = new Map([[3, { id: 3 }]]);
    const mediumMap = new Map([[5, { id: 5 }]]);
    const sensorConfigMap = new Map([
      [
        10,
        {
          id: 10,
          quantityKind: { id: 1, code: 'temperature' },
          unit: { id: 1, siToDisplayFactor: '1', siToDisplayOffset: '-273.15' },
        },
      ],
    ]);

    sinon.stub(TCave, 'findOne').callsFake((criteria) => ({
      then: (resolve) =>
        Promise.resolve(caveMap.get(criteria.id)).then(resolve),
    }));
    sinon.stub(TLicense, 'findOne').callsFake((criteria) => ({
      then: (resolve) =>
        Promise.resolve(licenseMap.get(criteria.id)).then(resolve),
    }));
    sinon.stub(TCaver, 'findOne').callsFake((criteria) => ({
      then: (resolve) =>
        Promise.resolve(caverMap.get(criteria.id)).then(resolve),
    }));
    sinon.stub(TMedium, 'findOne').callsFake((criteria) => ({
      then: (resolve) =>
        Promise.resolve(mediumMap.get(criteria.id)).then(resolve),
    }));
    sinon.stub(TSensorConfiguration, 'findOne').callsFake((criteria) => {
      const record = sensorConfigMap.get(criteria.id);
      const populatable = {
        populate: () => populatable,
        then: (resolve) => Promise.resolve(record).then(resolve),
      };
      return populatable;
    });

    let result;
    try {
      result = await ReferenceValidator.validate(profile);
    } finally {
      sinon.restore();
    }

    // Only 2 errors: author 777 and 888 not found
    should(result.errors.length).equal(2);
    should(result.errors.join('\n')).containEql('777');
    should(result.errors.join('\n')).containEql('888');
  });
});
