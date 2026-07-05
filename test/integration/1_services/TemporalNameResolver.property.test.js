/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const TemporalNameResolver = require('../../../api/services/TemporalNameResolver');

// --- Shared arbitraries ---

// ISO date string arbitrary: generate a timestamp in ms then convert to ISO string
const isoDateArb = fc
  .integer({
    min: new Date('2000-01-01T00:00:00.000Z').getTime(),
    max: new Date('2030-12-31T23:59:59.999Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Name string arbitrary (non-empty alphanumeric)
const nameArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

// Positive integer for IDs
const positiveIntArb = fc.integer({ min: 1, max: 100000 });

// h_name record arbitrary
const hNameRecordArb = fc.record({
  name: nameArb,
  dateReviewed: isoDateArb,
  dateInscription: isoDateArb,
  author: fc.record({ id: positiveIntArb, name: nameArb }),
  reviewer: fc.record({ id: positiveIntArb, name: nameArb }),
});

/**
 * Property 1: Temporal entrance name resolution
 *
 * For any snapshot date S and any array of h_name records with various
 * dateReviewed values, and a current name C:
 * - If records exist with dateReviewed > S, the resolved name equals
 *   the name of the record with the smallest such dateReviewed
 * - If no records have dateReviewed > S, the resolved name equals C
 * - If C is also null/empty, the resolved name is ''
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
describe('TemporalNameResolver - Property 1: Temporal entrance name resolution', () => {
  it('should resolve the correct name based on snapshot date, falling back to currentName then empty string', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        isoDateArb,
        fc.array(hNameRecordArb, { minLength: 0, maxLength: 20 }),
        fc.option(nameArb, { nil: null }),
        (snapshotDate, hNameRecords, currentName) => {
          const result = TemporalNameResolver.resolveNameAtDate(
            snapshotDate,
            hNameRecords,
            currentName
          );

          const snapshotTime = new Date(snapshotDate).getTime();

          // Filter records with dateReviewed > snapshotDate
          const futureRecords = hNameRecords
            .filter((r) => new Date(r.dateReviewed).getTime() > snapshotTime)
            .sort(
              (a, b) =>
                new Date(a.dateReviewed).getTime() -
                new Date(b.dateReviewed).getTime()
            );

          if (futureRecords.length > 0) {
            // Should equal the name of the record with smallest dateReviewed > S
            should(result).equal(futureRecords[0].name);
          } else if (currentName) {
            // Should fall back to currentName
            should(result).equal(currentName);
          } else {
            // Should fall back to empty string
            should(result).equal('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Temporal cave name resolution uses HEntrance's own id_cave
 *
 * For any array of HEntrance records with varying cave IDs (integer or
 * object with .id) and cave h_name maps, resolveCaveNamesForSnapshots
 * resolves each record's caveName using its own cave ID.
 * When cave ID is falsy, caveName is set to null.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.3
 */
describe('TemporalNameResolver - Property 2: Temporal cave name resolution uses HEntrance own id_cave', () => {
  it('should resolve each entrance caveName from its own cave ID, setting null for falsy cave', function () {
    this.timeout(30000);

    // Cave ID arbitrary: either a plain integer or an object with .id
    const caveIdArb = fc.oneof(
      positiveIntArb,
      positiveIntArb.map((id) => ({ id }))
    );

    // HEntrance record with a cave field and an id (snapshot date)
    const hEntranceArb = fc.record({
      id: isoDateArb,
      cave: fc.oneof(caveIdArb, fc.constant(null), fc.constant(undefined)),
    });

    fc.assert(
      fc.property(
        fc.array(hEntranceArb, { minLength: 1, maxLength: 10 }),
        fc.array(
          fc.tuple(
            positiveIntArb,
            fc.array(hNameRecordArb, { minLength: 0, maxLength: 5 })
          ),
          { minLength: 0, maxLength: 5 }
        ),
        fc.array(fc.tuple(positiveIntArb, nameArb), {
          minLength: 0,
          maxLength: 5,
        }),
        (hEntrances, caveHNameEntries, currentCaveNameEntries) => {
          // Build Maps from generated data
          const caveHNameMap = new Map(caveHNameEntries);
          const currentCaveNameMap = new Map(currentCaveNameEntries);

          // Deep copy hEntrances to avoid mutation issues across runs
          const entrancesCopy = hEntrances.map((e) => ({ ...e }));

          const result = TemporalNameResolver.resolveCaveNamesForSnapshots(
            entrancesCopy,
            caveHNameMap,
            currentCaveNameMap
          );

          should(result).be.an.Array();
          should(result.length).equal(entrancesCopy.length);

          for (const entrance of result) {
            const caveId = entrance.cave?.id ?? entrance.cave;

            if (!caveId) {
              // Falsy cave → caveName must be null
              should(entrance.caveName).be.null();
            } else {
              // Should resolve using resolveNameAtDate with the cave's data
              const caveHNames = caveHNameMap.get(caveId) || [];
              const currentCaveName = currentCaveNameMap.get(caveId) || null;
              const expected = TemporalNameResolver.resolveNameAtDate(
                entrance.id,
                caveHNames,
                currentCaveName
              );
              should(entrance.caveName).equal(expected);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Name-change snapshot injection completeness
 *
 * Output count from buildNameChangeSnapshots equals input record count.
 * All required fields are present: id, t_id, name, author, reviewer,
 * dateInscription, dateReviewed, caveName, isNameChangeSnapshot: true
 *
 * Validates: Requirements 3.1, 3.2, 3.5
 */
describe('TemporalNameResolver - Property 3: Name-change snapshot injection completeness', () => {
  it('should produce one snapshot per h_name record with all required fields present', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        positiveIntArb,
        fc.array(hNameRecordArb, { minLength: 0, maxLength: 20 }),
        (entranceId, hNameRecords) => {
          // Simple resolveCaveNameFn that returns a fixed string
          const resolveCaveNameFn = () => 'TestCave';

          const result = TemporalNameResolver.buildNameChangeSnapshots(
            entranceId,
            hNameRecords,
            resolveCaveNameFn
          );

          // Output count equals input count
          should(result.length).equal(hNameRecords.length);

          // All required fields are present on each snapshot
          for (let i = 0; i < result.length; i += 1) {
            const snapshot = result[i];
            const source = hNameRecords[i];

            should(snapshot).have.property('id', source.dateReviewed);
            should(snapshot).have.property('t_id', entranceId);
            should(snapshot).have.property('name', source.name);
            should(snapshot).have.property('author', source.author);
            should(snapshot).have.property('reviewer', source.reviewer);
            should(snapshot).have.property(
              'dateInscription',
              source.dateInscription
            );
            should(snapshot).have.property('dateReviewed', source.dateReviewed);
            should(snapshot).have.property('caveName');
            should(snapshot).have.property('isNameChangeSnapshot', true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Merged timeline is sorted chronologically
 *
 * mergeAndSort output is always sorted by new Date(item.id).getTime()
 * ascending, regardless of input order.
 *
 * Validates: Requirements 3.4
 */
describe('TemporalNameResolver - Property 4: Merged timeline is sorted chronologically', () => {
  it('should produce a chronologically sorted output regardless of input order', function () {
    this.timeout(30000);

    // Simple snapshot-like object with an id (ISO date string)
    const snapshotArb = fc.record({
      id: isoDateArb,
      name: nameArb,
    });

    fc.assert(
      fc.property(
        fc.array(snapshotArb, { minLength: 0, maxLength: 20 }),
        fc.array(snapshotArb, { minLength: 0, maxLength: 20 }),
        (hEntrances, nameChangeSnapshots) => {
          const result = TemporalNameResolver.mergeAndSort(
            hEntrances,
            nameChangeSnapshots
          );

          // Total length is sum of both inputs
          should(result.length).equal(
            hEntrances.length + nameChangeSnapshots.length
          );

          // Verify chronological sort by Date comparison
          for (let i = 1; i < result.length; i += 1) {
            const prev = new Date(result[i - 1].id).getTime();
            const curr = new Date(result[i].id).getTime();
            should(prev).be.belowOrEqual(
              curr,
              `Items at index ${i - 1} and ${i} are not in chronological order: ${result[i - 1].id} > ${result[i].id}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Converter caveName and isNameChangeSnapshot passthrough
 *
 * For any source object passed to toEntrance:
 * - If source.caveName is a non-null string, then result.caveName equals it
 * - If source.caveName is null or undefined, then result.caveName is null
 * - If source.isNameChangeSnapshot is true, then result.isNameChangeSnapshot is true
 * - If source.isNameChangeSnapshot is undefined or false, then result.isNameChangeSnapshot is false
 *
 * Validates: Requirements 4.2, 4.3
 */
describe('TemporalNameResolver - Property 5: Converter caveName and isNameChangeSnapshot passthrough', () => {
  // eslint-disable-next-line global-require
  const { toEntrance } = require('../../../api/services/mapping/converters');

  it('should pass through caveName and isNameChangeSnapshot correctly for any source', function () {
    this.timeout(30000);

    const caveNameArb = fc.oneof(
      nameArb,
      fc.constant(null),
      fc.constant(undefined)
    );

    const isNameChangeSnapshotArb = fc.oneof(
      fc.constant(true),
      fc.constant(false),
      fc.constant(undefined)
    );

    fc.assert(
      fc.property(
        caveNameArb,
        isNameChangeSnapshotArb,
        (caveName, isNameChangeSnapshot) => {
          const source = {
            id: 1,
            names: [],
            caveName,
            isNameChangeSnapshot,
          };

          const result = toEntrance(source);

          // caveName passthrough
          if (caveName != null) {
            should(result.caveName).equal(caveName);
          } else {
            should(result.caveName).be.null();
          }

          // isNameChangeSnapshot passthrough
          if (isNameChangeSnapshot === true) {
            should(result.isNameChangeSnapshot).equal(true);
          } else {
            should(result.isNameChangeSnapshot).equal(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
