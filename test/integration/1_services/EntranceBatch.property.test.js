const should = require('should');
const fc = require('fast-check');
const NameService = require('../../../api/services/NameService');

// Feature: db-access-patterns-optimization
// Property 4: Batch find equivalence for entrance population
// Property 5: Batch name resolution equivalence for history entries

/**
 * Property 4: Batch find equivalence for entrance population.
 * Encodes: Model.find({ id: ids }) returns the same records as
 * Promise.all(ids.map(id => Model.findOne(id))), ignoring order.
 * Covers: random subsets of valid fixture IDs plus invalid IDs.
 */
describe('EntranceBatch - Property 4: batch find equivalence', () => {
  it('should return same TName records with batch find as with individual findOne', async function batchFindEquivalence() {
    this.timeout(120000);

    const allNames = await TName.find();
    const validIds = allNames.map((n) => n.id);

    // Arbitrary: pick a random subset of valid IDs plus some invalid ones
    const idArb = fc.array(
      fc.oneof(
        { weight: 7, arbitrary: fc.constantFrom(...validIds) },
        { weight: 3, arbitrary: fc.integer({ min: 90000, max: 99999 }) }
      ),
      { minLength: 0, maxLength: 10 }
    );

    await fc.assert(
      fc.asyncProperty(idArb, async (ids) => {
        const uniqueIds = [...new Set(ids)];
        const batchResult = uniqueIds.length
          ? await TName.find({ id: uniqueIds })
          : [];

        const individualResult = await Promise.all(
          uniqueIds.map((id) => TName.findOne(id))
        );
        const individualFiltered = individualResult.filter(Boolean);

        const batchIds = batchResult.map((r) => r.id).sort();
        const individualIds = individualFiltered.map((r) => r.id).sort();

        should(batchIds).deepEqual(individualIds);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Batch name resolution equivalence for history entries.
 * Encodes: calling NameService.setNames once for all entrance stubs
 * produces the same name assignments as calling it per-entry.
 * Covers: all fixture entrance IDs.
 */
describe('EntranceBatch - Property 5: batch name resolution equivalence', () => {
  it('should assign same names in batch as in per-entry calls', async () => {
    const entrances = await TEntrance.find({ select: ['id'] });
    const ids = entrances.map((e) => e.id);

    // Batch approach: one call
    const batchStubs = ids.map((id) => ({ id }));
    await NameService.setNames(batchStubs, 'entrance');

    // Per-entry approach: one call per ID
    const perEntryResults = await Promise.all(
      ids.map(async (id) => {
        const stub = [{ id }];
        await NameService.setNames(stub, 'entrance');
        return { id, names: stub[0].names, name: stub[0].name };
      })
    );

    batchStubs.forEach((batchEntry) => {
      const perEntry = perEntryResults.find((p) => p.id === batchEntry.id);
      const batchNameIds = batchEntry.names.map((n) => n.id).sort();
      const perEntryNameIds = perEntry.names.map((n) => n.id).sort();
      should(batchNameIds).deepEqual(
        perEntryNameIds,
        `Name mismatch for entrance ${batchEntry.id}`
      );
      should(batchEntry.name).equal(perEntry.name);
    });
  });
});
