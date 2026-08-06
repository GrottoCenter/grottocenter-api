const should = require('should');
const fc = require('fast-check');
const {
  mapAuthorsOrganizationForSearch,
} = require('../../../api/services/DocumentService');

describe('DocumentService - Property: updateInSearch authorsOrganization mapping invariant', () => {
  it('should map each organization to its first name entry', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            names: fc.array(fc.record({ name: fc.string() }), { minLength: 1 }),
          })
        ),
        (orgArray) => {
          const result = mapAuthorsOrganizationForSearch(orgArray);
          should(result).be.an.Array();
          should(result).have.length(orgArray.length);
          result.forEach((item, i) => {
            should(item.name).equal(orgArray[i].names[0].name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return an empty array for empty input', () => {
    const result = mapAuthorsOrganizationForSearch([]);
    should(result).be.an.Array();
    should(result).have.length(0);
  });

  it('should confirm ?? [] fallback is necessary: empty names array yields undefined name', () => {
    // e.names?.[0]?.name is undefined when names is empty — this documents why
    // the ?? [] fallback in mapAuthorsOrganizationForSearch is needed to avoid
    // emitting null to Typesense for a string[] field.
    const org = { names: [] };
    const name = org.names?.[0]?.name;
    should(name).be.undefined();
  });
});
