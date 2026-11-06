const should = require('should');
const readRecentChangeFilters = require('../../../api/utils/recentChangeFilters');

const read = (query) => readRecentChangeFilters((name) => query[name]);

describe('recentChangeFilters', () => {
  it('returns no filter when none is given', () => {
    should(read({})).eql({ filters: {} });
  });

  it('reads every filter, upper-casing country and region codes', () => {
    should(
      read({
        countryId: 'fr',
        regionId: 'fr-ara',
        massifId: '123',
        organizationId: '456',
      })
    ).eql({
      filters: {
        countryId: 'FR',
        regionId: 'FR-ARA',
        massifId: 123,
        organizationId: 456,
      },
    });
  });

  it('accepts numeric ISO 3166-2 subdivisions', () => {
    should(read({ regionId: 'FR-01' })).eql({ filters: { regionId: 'FR-01' } });
  });

  [
    ['countryId', ''],
    ['countryId', 'FRA'],
    ['countryId', 'F1'],
    ['countryId', ['FR', 'ES']],
    ['regionId', 'FR'],
    ['regionId', 'ARA'],
    ['regionId', 'FR-ARAX'],
    ['regionId', 'FR_ARA'],
    ['massifId', ''],
    ['massifId', '0'],
    ['massifId', '-1'],
    ['massifId', '1.5'],
    ['massifId', '12abc'],
    ['massifId', '2147483648'],
    ['organizationId', 'abc'],
    ['organizationId', ['1', '2']],
  ].forEach(([field, value]) => {
    it(`rejects ${field}=${JSON.stringify(value)}`, () => {
      const { error } = read({ [field]: value });
      should(error).match({ field, value });
      should(error.message).startWith(field);
    });
  });

  it('reports the first invalid parameter', () => {
    const { error } = read({ countryId: 'FR', massifId: 'x', regionId: 'y' });
    should(error.field).equal('regionId');
  });
});
