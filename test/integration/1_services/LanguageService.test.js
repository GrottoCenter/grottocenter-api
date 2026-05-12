const should = require('should');
const sinon = require('sinon');
const LanguageService = require('../../../api/services/LanguageService');

describe('LanguageService', () => {
  describe('getLocale', () => {
    it('should return undefined for null/undefined languageId', async () => {
      should(await LanguageService.getLocale(null)).be.undefined();
      should(await LanguageService.getLocale(undefined)).be.undefined();
    });

    it('should return the part1 locale code for a valid language', async () => {
      // 'fra' is French with part1 = 'fr'
      const locale = await LanguageService.getLocale('fra');
      should(locale).equal('fr');
    });

    it('should return undefined for a non-existent language', async () => {
      const locale = await LanguageService.getLocale('zzz');
      should(locale).be.undefined();
    });

    it('should return cached value without querying the DB again', async () => {
      // Use a language id that hasn't been cached yet in this test run
      const spy = sinon.spy(TLanguage, 'findOne');
      try {
        // First call should hit the DB
        const first = await LanguageService.getLocale('eng');
        // Second call should come from cache — no additional DB query
        const second = await LanguageService.getLocale('eng');
        should(first).equal(second);
        should(first).equal('en');
        // findOne should have been called exactly once for this language id
        const callsForEng = spy
          .getCalls()
          .filter((c) => c.args[0]?.id === 'eng');
        should(callsForEng.length).equal(1);
      } finally {
        spy.restore();
      }
    });
  });
});
