const should = require('should');
const coerceToNumeric = require('../../../api/utils/coerceToNumeric');
const GrottoService = require('../../../api/services/GrottoService');
const CaveService = require('../../../api/services/CaveService');

describe('coerceToNumeric - Unit Tests', () => {
  describe('coerceToNumeric()', () => {
    it('should convert empty string to null', () => {
      should(coerceToNumeric('')).equal(null);
    });

    it('should convert whitespace-only string to null', () => {
      should(coerceToNumeric(' ')).equal(null);
      should(coerceToNumeric('  ')).equal(null);
      should(coerceToNumeric('\t')).equal(null);
    });

    it('should pass through null unchanged', () => {
      should(coerceToNumeric(null)).equal(null);
    });

    it('should pass through undefined unchanged', () => {
      should(coerceToNumeric(undefined)).equal(undefined);
    });

    it('should pass through numeric strings unchanged', () => {
      should(coerceToNumeric('43.62505')).equal('43.62505');
      should(coerceToNumeric('-3.862038')).equal('-3.862038');
      should(coerceToNumeric('0')).equal('0');
      should(coerceToNumeric('100')).equal('100');
    });

    it('should pass through numbers unchanged', () => {
      should(coerceToNumeric(43.62505)).equal(43.62505);
      should(coerceToNumeric(0)).equal(0);
      should(coerceToNumeric(-100)).equal(-100);
    });

    // Design boundary: coerceToNumeric intentionally does NOT validate that
    // the value is a well-formed number. Its only job is to convert blank
    // strings to null so PostgreSQL doesn't choke on ''. Actual numeric
    // validation is delegated to Waterline / the DB adapter, which will
    // reject malformed values like 'abc' with a proper validation error.
    it('should pass through non-numeric strings unchanged', () => {
      should(coerceToNumeric('abc')).equal('abc');
      should(coerceToNumeric('12.3.4')).equal('12.3.4');
    });
  });

  describe('GrottoService.getConvertedDataFromClientRequest()', () => {
    const makeReq = (body) => ({
      body,
      param: (key) => body[key],
    });

    it('should coerce empty latitude and longitude to null', () => {
      const req = makeReq({ latitude: '', longitude: '' });
      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.latitude).equal(null);
      should(result.longitude).equal(null);
    });

    it('should preserve valid numeric latitude and longitude', () => {
      const req = makeReq({
        latitude: '43.62505',
        longitude: '3.862038',
      });
      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.latitude).equal('43.62505');
      should(result.longitude).equal('3.862038');
    });

    it('should pass through null latitude and longitude', () => {
      const req = makeReq({ latitude: null, longitude: null });
      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.latitude).equal(null);
      should(result.longitude).equal(null);
    });
  });

  describe('CaveService.getConvertedDataFromClient()', () => {
    const makeReq = (body) => ({
      body,
      param: (key) => body[key],
    });

    it('should coerce empty latitude and longitude to null', () => {
      const req = makeReq({ latitude: '', longitude: '' });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.latitude).equal(null);
      should(result.longitude).equal(null);
    });

    it('should preserve valid numeric latitude and longitude', () => {
      const req = makeReq({
        latitude: '43.62505',
        longitude: '3.862038',
      });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.latitude).equal('43.62505');
      should(result.longitude).equal('3.862038');
    });
  });
});
