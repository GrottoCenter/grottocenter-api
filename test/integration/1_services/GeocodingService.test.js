const should = require('should');
const sinon = require('sinon');
const https = require('https');
const GeocodingService = require('../../../api/services/GeocodingService');

describe('GeocodingService', () => {
  describe('findISOHierarchy()', () => {
    it('should find ISO hierarchy for a code', () => {
      const result = GeocodingService.findISOHierarchy('FR-ARA');
      should(result).be.an.Array();
      should(result.length).be.greaterThan(0);
      should(result[result.length - 1].code).equal('FR-ARA');
    });

    it('should handle code without parent', () => {
      const result = GeocodingService.findISOHierarchy('US-CA');
      should(result).be.an.Array();
      should(result.length).be.greaterThan(0);
    });
  });

  describe('getISOTranslation()', () => {
    it('should get ISO translations', async () => {
      const result = await GeocodingService.getISOTranslation(['FR-ARA']);
      should(result).be.an.Array();
    });

    it('should handle empty array', async () => {
      const result = await GeocodingService.getISOTranslation([]);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });
  });

  describe('reverse()', () => {
    it('should return null when rate limit exceeded', async () => {
      const clock = sinon.useFakeTimers();
      const stub = sinon
        .stub(https, 'get')
        .callsFake((url, options, callback) => {
          const mockRes = {
            headers: { 'content-type': 'application/json' },
            on: (event, handler) => {
              if (event === 'data')
                handler(
                  Buffer.from(
                    JSON.stringify({ address: { country_code: 'fr' } })
                  )
                );
              if (event === 'end') handler();
              return mockRes;
            },
          };
          callback(mockRes);
          return { on: () => {} };
        });
      const promises = [];
      for (let i = 0; i < 10; i += 1) {
        promises.push(GeocodingService.reverse(45.0, 6.0));
      }
      await clock.tickAsync(10000);
      const results = await Promise.all(promises);
      const nullResults = results.filter((r) => r === null);
      should(nullResults.length).be.greaterThan(0);
      stub.restore();
      clock.restore();
    });

    it('should return null when response has no address', async () => {
      const stub = sinon
        .stub(https, 'get')
        .callsFake((url, options, callback) => {
          const mockRes = {
            headers: { 'content-type': 'application/json' },
            on: (event, handler) => {
              if (event === 'data') handler(Buffer.from('{}'));
              if (event === 'end') handler();
              return mockRes;
            },
          };
          callback(mockRes);
          return { on: () => {} };
        });
      const result = await GeocodingService.reverse(45.0, 6.0);
      should(result).be.null();
      stub.restore();
    });
  });
});
