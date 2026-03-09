const should = require('should');
const fc = require('fast-check');

// Feature: db-access-patterns-optimization
// Property 6: NameService Map-based lookup equivalence

/**
 * Property 6: NameService Map-based lookup equivalence.
 * Encodes: grouping names by entity ID using a Map produces the same
 * result as using Array.filter() for each entity.
 * Covers: random entity/name arrays with varying overlap.
 */
describe('NameServiceMap - Property 6: Map vs filter equivalence', () => {
  const entityIdArb = fc.integer({ min: 1, max: 50 });

  const nameArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    entityId: entityIdArb,
    isMain: fc.boolean(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
  });

  const scenarioArb = fc.record({
    entityIds: fc.uniqueArray(entityIdArb, { minLength: 1, maxLength: 10 }),
    names: fc.array(nameArb, { minLength: 0, maxLength: 30 }),
  });

  it('should produce identical groupings with Map and filter', async function mapEquivalence() {
    this.timeout(120000);
    await fc.assert(
      fc.property(scenarioArb, ({ entityIds, names }) => {
        // Filter approach (old)
        const filterResult = entityIds.map((eid) => ({
          id: eid,
          names: names.filter((n) => n.entityId === eid),
        }));

        // Map approach (new)
        const namesByEntity = new Map();
        for (const name of names) {
          const key = name.entityId;
          if (!namesByEntity.has(key)) namesByEntity.set(key, []);
          namesByEntity.get(key).push(name);
        }
        const mapResult = entityIds.map((eid) => ({
          id: eid,
          names: namesByEntity.get(eid) || [],
        }));

        should(mapResult).deepEqual(filterResult);
      }),
      { numRuns: 100 }
    );
  });
});
