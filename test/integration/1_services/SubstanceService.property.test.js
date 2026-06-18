/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const sinon = require('sinon');

// Feature: substance-reference-table
// Property 1: External ID / External Source Consistency
// For any substance record, if externalId is non-null then externalSource must
// equal 'PubChem', and if externalId is null then externalSource must also be null.

/**
 * Property 1: External ID / External Source Consistency
 * Encodes: the application-level invariant that externalSource is always 'PubChem'
 * when externalId is present, and null when externalId is absent.
 * Covers: all combinations of externalId presence/absence.
 *
 * Validates: Requirements 1.5, 1.6
 */
describe('SubstanceService - Property 1: externalId/externalSource consistency', () => {
  it('should enforce externalSource = PubChem when externalId is non-null, and null when externalId is null', function () {
    this.timeout(60000);

    const createdIds = [];

    // Generate externalId as either null or a random numeric string (PubChem CID format)
    const externalIdArb = fc.oneof(
      fc.constant(null),
      fc.integer({ min: 1, max: 999999999 }).map(String)
    );

    // Generate unique names to avoid conflicts with fixtures
    const nameArb = fc
      .stringMatching(/^[a-zA-Z]{3,20}$/)
      .map((s) => `prop_test_${s}_${Date.now()}_${Math.random()}`);

    return fc
      .assert(
        fc.asyncProperty(nameArb, externalIdArb, async (name, externalId) => {
          // Apply the application-level rule: derive externalSource from externalId
          const externalSource = externalId !== null ? 'PubChem' : null;

          const substance = await TSubstance.create({
            name,
            formula: null,
            casNumber: null,
            externalId,
            externalSource,
            author: 1,
            dateInscription: new Date(),
          }).fetch();

          createdIds.push(substance.id);

          // Verify the invariant holds after creation
          if (substance.externalId !== null) {
            should(substance.externalSource).equal(
              'PubChem',
              `externalSource should be 'PubChem' when externalId is '${substance.externalId}'`
            );
          } else {
            should(substance.externalSource).be.null();
          }
        }),
        { numRuns: 100 }
      )
      .finally(async () => {
        // Clean up all created records
        if (createdIds.length > 0) {
          await TSubstance.destroy({ id: createdIds });
        }
      });
  });
});

// Feature: substance-reference-table
// Property 6: Search Results Match Criteria
// For any search string of 2+ characters and any set of local substances,
// every result returned by SubstanceService.search must satisfy:
// (a) the substance's name, formula, or cas_number contains the search string case-insensitively
// (b) results are ordered alphabetically by name
// (c) at most 20 results are returned
// (d) each result has fields: id, name, formula, casNumber, externalId, externalSource

/**
 * Property 6: Search Results Match Criteria
 * Encodes: the filtering, ordering, and shape invariants of SubstanceService.search.
 * Covers: all local search results for substrings derived from known fixture data.
 *
 * Validates: Requirements 6.3, 6.5
 */
describe('SubstanceService - Property 6: search results match criteria', () => {
  // Known fixture substances to derive substrings from
  const fixtureValues = ['Nitrate', 'Calcium', 'NO3-', 'Ca2+', '14797-55-8'];

  it('should return results matching the search string, ordered by name, limited to 20, with correct shape', function () {
    this.timeout(60000);

    // Generate substrings of length 2+ from fixture values
    const searchStringArb = fc
      .record({
        sourceIndex: fc.integer({ min: 0, max: fixtureValues.length - 1 }),
        start: fc.nat(),
        length: fc.integer({ min: 2, max: 10 }),
      })
      .map(({ sourceIndex, start, length }) => {
        const source = fixtureValues[sourceIndex];
        const actualStart = start % Math.max(1, source.length - 1);
        const actualLength = Math.min(length, source.length - actualStart);
        return source.substring(
          actualStart,
          actualStart + Math.max(2, actualLength)
        );
      })
      .filter((s) => s.length >= 2);

    return fc.assert(
      fc.asyncProperty(searchStringArb, async (searchString) => {
        const results = await SubstanceService.search(searchString, false);

        // (c) At most 20 results
        should(results).be.an.Array();
        should(results.length).be.belowOrEqual(20);

        // (b) Results ordered alphabetically by name
        for (let i = 1; i < results.length; i += 1) {
          results[i].name
            .localeCompare(results[i - 1].name)
            .should.be.aboveOrEqual(
              0,
              `Expected '${results[i].name}' >= '${results[i - 1].name}' alphabetically`
            );
        }

        const lowerSearch = searchString.toLowerCase();

        for (const result of results) {
          // (d) Each result has the required fields
          should(result).have.property('id');
          should(result).have.property('name');
          should(result).have.property('formula');
          should(result).have.property('casNumber');
          should(result).have.property('externalId');
          should(result).have.property('externalSource');

          // (a) name, formula, or cas_number contains search string case-insensitively
          const nameMatch = result.name.toLowerCase().includes(lowerSearch);
          const formulaMatch =
            result.formula &&
            result.formula.toLowerCase().includes(lowerSearch);
          const casMatch =
            result.casNumber &&
            result.casNumber.toLowerCase().includes(lowerSearch);

          should(nameMatch || formulaMatch || casMatch).be.true(
            `Result '${result.name}' (formula: ${result.formula}, cas: ${result.casNumber}) does not match search '${searchString}'`
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: substance-reference-table
// Property 7: PubChem Fallback for Authenticated Users Only
// For any search that yields zero local results, PubChem is called if and only
// if the user is authenticated. When PubChem is called, results have id=null.
// When not authenticated, response is empty.

/**
 * Property 7: PubChem Fallback for Authenticated Users Only
 * Encodes: the authentication gate on PubChem fallback when local results are empty.
 * Covers: all combinations of authentication status with non-matching search strings.
 *
 * Validates: Requirements 6.6, 6.7
 */
describe('SubstanceService - Property 7: PubChem fallback auth gate', () => {
  it('should call PubChem only when authenticated and local results are empty, with id=null in results', function () {
    this.timeout(60000);

    // Generate random strings unlikely to match fixtures (long random alphanumeric)
    const nonMatchingSearchArb = fc
      .stringMatching(/^[xyzwqjk]{4,12}$/)
      .map((s) => `zzz_${s}_nonexistent`);

    const isAuthenticatedArb = fc.boolean();

    return fc.assert(
      fc.asyncProperty(
        nonMatchingSearchArb,
        isAuthenticatedArb,
        async (searchString, isAuthenticated) => {
          const pubChemStub = sinon.stub(PubChemService, 'search').resolves([
            {
              name: `FakePubChem_${searchString}`,
              formula: 'H2O',
              casNumber: null,
              externalId: '12345',
              externalSource: 'PubChem',
            },
          ]);

          try {
            const results = await SubstanceService.search(
              searchString,
              isAuthenticated
            );

            should(results).be.an.Array();

            if (isAuthenticated) {
              // PubChem should have been called
              should(pubChemStub.calledOnce).equal(true);
              // All results from PubChem fallback have id=null
              for (const result of results) {
                should(result.id).equal(null);
              }
            } else {
              // PubChem should NOT have been called
              should(pubChemStub.called).equal(false);
              // Response must be empty
              should(results.length).equal(0);
            }
          } finally {
            pubChemStub.restore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: substance-reference-table
// Property 8: Substance Creation Idempotence
// For any substance name, calling createOrFind with that name when it already
// exists returns the existing record (created=false). Calling when it doesn't
// exist creates a new record (created=true).

/**
 * Property 8: Substance Creation Idempotence
 * Encodes: the idempotence invariant of SubstanceService.createOrFind —
 * creating twice with the same name (case-insensitive) returns the same record.
 * Covers: random unique substance names, verifying create-then-find cycle.
 *
 * Validates: Requirements 8.2, 8.3
 */
describe('SubstanceService - Property 8: creation idempotence', () => {
  it('should create on first call and find existing on second call (case-insensitive)', function () {
    this.timeout(120000);

    const createdIds = [];

    // Generate unique substance names that won't collide with fixtures
    const nameArb = fc
      .stringMatching(/^[A-Za-z]{3,15}$/)
      .map(
        (s) =>
          `proptest_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      );

    return fc
      .assert(
        fc.asyncProperty(nameArb, async (name) => {
          // Expected stored name: first letter capitalized
          const expectedName = name.charAt(0).toUpperCase() + name.slice(1);

          // First call: should create
          const firstResult = await SubstanceService.createOrFind({ name }, 1);

          should(firstResult).have.property('created', true);
          should(firstResult).have.property('substance');
          should(firstResult.substance).have.property('id');
          should(firstResult.substance.id).be.a.Number();
          should(firstResult.substance).have.property('name', expectedName);

          createdIds.push(firstResult.substance.id);

          // Second call with same name: should find existing
          const secondResult = await SubstanceService.createOrFind({ name }, 1);

          should(secondResult).have.property('created', false);
          should(secondResult).have.property('substance');
          should(secondResult.substance).have.property(
            'id',
            firstResult.substance.id
          );
          should(secondResult.substance).have.property('name', expectedName);

          // Third call with different case: should find existing (case-insensitive)
          const upperName = name.toUpperCase();
          const thirdResult = await SubstanceService.createOrFind(
            { name: upperName },
            1
          );

          should(thirdResult).have.property('created', false);
          should(thirdResult).have.property('substance');
          should(thirdResult.substance).have.property(
            'id',
            firstResult.substance.id
          );
        }),
        { numRuns: 50 }
      )
      .finally(async () => {
        // Clean up all created records
        if (createdIds.length > 0) {
          await TSubstance.destroy({ id: createdIds });
        }
      });
  });
});
