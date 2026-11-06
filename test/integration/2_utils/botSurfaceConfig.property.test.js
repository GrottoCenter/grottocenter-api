const should = require('should');
const fc = require('fast-check');
const {
  ENTITY_TYPES,
  parseEntityTypes,
} = require('../../../api/utils/botSurfaceConfig');

// A list as an operator might type it: any subset, any order, with repeats,
// mixed case and spaces around the commas
const spelled = fc.array(
  fc.record({
    name: fc.constantFrom(...ENTITY_TYPES),
    upper: fc.boolean(),
    before: fc.constantFrom('', ' ', '  '),
    after: fc.constantFrom('', ' ', '\t'),
  }),
  { maxLength: 10 }
);

describe('botSurfaceConfig - Property: the allow-list is the set of names written', () => {
  it('returns exactly the distinct names, in the canonical order', () => {
    fc.assert(
      fc.property(spelled, (entries) => {
        const text = entries
          .map(
            (e) =>
              `${e.before}${e.upper ? e.name.toUpperCase() : e.name}${e.after}`
          )
          .join(',');
        const written = new Set(entries.map((e) => e.name));
        const parsed = parseEntityTypes(text);
        should(new Set(parsed)).eql(written);
        should(parsed.length).equal(written.size);
        // Canonical order: sorted by position in ENTITY_TYPES
        should(parsed).eql(ENTITY_TYPES.filter((t) => written.has(t)));
      }),
      { numRuns: 100 }
    );
  });

  it('fails for any list that holds a name outside the vocabulary', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ENTITY_TYPES), { maxLength: 4 }),
        fc
          .string({ minLength: 1, maxLength: 12 })
          .filter(
            (s) =>
              s.trim() !== '' &&
              !s.includes(',') &&
              !ENTITY_TYPES.includes(s.trim().toLowerCase())
          ),
        (valid, bad) => {
          should(() => parseEntityTypes([...valid, bad].join(','))).throw(
            /unknown type/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
