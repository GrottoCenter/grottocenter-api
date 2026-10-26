const should = require('should');
const fc = require('fast-check');
const {
  WHITELIST,
  project,
} = require('../../../api/utils/botSurfaceWhitelist');

const scalar = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null)
);

// Keys that are not part of any whitelist, with the risky JS ones included.
const extraKey = fc
  .oneof(
    fc.string({ minLength: 1, maxLength: 12 }),
    fc.constantFrom('latitude', 'geogPolygon', 'isSensitive', 'constructor')
  )
  .filter((key) => key !== '__proto__');

const NESTED_KEYS = [
  'caves',
  'descriptions',
  'entrances',
  'license',
  'massifs',
  'organizationAuthors',
  'subjects',
];

const typesAndLevels = Object.entries(WHITELIST).flatMap(([type, levels]) =>
  Object.keys(levels).map((level) => [type, level])
);

describe('botSurfaceWhitelist - Property: extra keys never get through', () => {
  it('outputs exactly the whitelisted keys, whatever else the source holds', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...typesAndLevels),
        fc.dictionary(extraKey, scalar),
        scalar,
        ([type, level], extras, value) => {
          const fields = WHITELIST[type][level];
          // Keys holding nested entities get an empty list; the others a scalar.
          const row = { ...extras };
          fields.forEach((field) => {
            row[field] = NESTED_KEYS.includes(field) ? [] : value;
          });
          const result = project(type, level, row);
          should(Object.keys(result).sort()).deepEqual(fields);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('never outputs a key that the whitelist does not name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...typesAndLevels),
        fc.dictionary(extraKey, scalar),
        ([type, level], row) => {
          Object.keys(project(type, level, row)).forEach((key) => {
            should(WHITELIST[type][level]).containEql(key);
          });
        }
      ),
      { numRuns: 300 }
    );
  });
});
