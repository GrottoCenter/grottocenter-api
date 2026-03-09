const should = require('should');
const DocumentCSVImportService = require('../../../api/services/DocumentCSVImportService');

// Feature: db-access-patterns-optimization
// Property 7: Reference data cache completeness

/**
 * Property 7: Reference data cache completeness.
 * Encodes: every record returned by direct DB queries for licenses,
 * languages, countries, and doc types is present in the cache Maps.
 * Covers: all reference data in the test database.
 */
describe('ReferenceCacheCompleteness - Property 7: cache matches DB', () => {
  it('should contain all licenses keyed by name', async () => {
    const cache = await DocumentCSVImportService.loadReferenceCache();
    const allLicenses = await TLicense.find();
    allLicenses.forEach((license) => {
      const cached = cache.licensesByName.get(license.name);
      should.exist(cached, `Missing license: ${license.name}`);
      should(cached.id).equal(license.id);
    });
    should(cache.licensesByName.size).equal(allLicenses.length);
  });

  it('should contain all languages keyed by part1', async () => {
    const cache = await DocumentCSVImportService.loadReferenceCache();
    const allLanguages = await TLanguage.find();
    const withPart1 = allLanguages.filter((l) => l.part1);
    withPart1.forEach((lang) => {
      const cached = cache.languagesByPart1.get(lang.part1);
      should.exist(cached, `Missing language: ${lang.part1}`);
      should(cached.id).equal(lang.id);
    });
    should(cache.languagesByPart1.size).equal(withPart1.length);
  });

  it('should contain all countries keyed by id', async () => {
    const cache = await DocumentCSVImportService.loadReferenceCache();
    const allCountries = await TCountry.find();
    allCountries.forEach((country) => {
      const cached = cache.countriesById.get(country.id);
      should.exist(cached, `Missing country: ${country.id}`);
    });
    should(cache.countriesById.size).equal(allCountries.length);
  });

  it('should contain all doc types keyed by name and url', async () => {
    const cache = await DocumentCSVImportService.loadReferenceCache();
    const allTypes = await TType.find();
    allTypes.forEach((type) => {
      const cachedByName = cache.typesByName.get(type.name);
      should.exist(cachedByName, `Missing type by name: ${type.name}`);
      should(cachedByName.id).equal(type.id);
      if (type.url) {
        const cachedByUrl = cache.typesByUrl.get(type.url);
        should.exist(cachedByUrl, `Missing type by url: ${type.url}`);
        should(cachedByUrl.id).equal(type.id);
      }
    });
    should(cache.typesByName.size).equal(allTypes.length);
  });
});
