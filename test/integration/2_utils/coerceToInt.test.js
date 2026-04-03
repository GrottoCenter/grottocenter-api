const should = require('should');
const coerceToInt = require('../../../api/utils/coerceToInt');
const EntranceService = require('../../../api/services/EntranceService');
const CaveService = require('../../../api/services/CaveService');

describe('coerceToInt - Unit Tests', () => {
  describe('coerceToInt()', () => {
    it('should pass through integers unchanged', () => {
      should(coerceToInt(0)).equal(0);
      should(coerceToInt(1132)).equal(1132);
      should(coerceToInt(-500)).equal(-500);
    });

    it('should round decimals to nearest integer', () => {
      should(coerceToInt(1132.6)).equal(1133);
      should(coerceToInt(1132.4)).equal(1132);
      should(coerceToInt(1132.5)).equal(1133);
      should(coerceToInt(-1132.6)).equal(-1133);
      should(coerceToInt(0.1)).equal(0);
      should(coerceToInt(0.9)).equal(1);
    });

    it('should pass through null unchanged', () => {
      should(coerceToInt(null)).equal(null);
    });

    it('should pass through undefined unchanged', () => {
      should(coerceToInt(undefined)).equal(undefined);
    });

    it('should pass through NaN unchanged', () => {
      should(Number.isNaN(coerceToInt(NaN))).be.true();
    });

    it('should pass through Infinity unchanged', () => {
      should(coerceToInt(Infinity)).equal(Infinity);
      should(coerceToInt(-Infinity)).equal(-Infinity);
    });

    it('should pass through strings unchanged', () => {
      should(coerceToInt('abc')).equal('abc');
      should(coerceToInt('')).equal('');
    });

    it('should round numeric strings to nearest integer', () => {
      should(coerceToInt('1132.6')).equal(1133);
      should(coerceToInt('1132.4')).equal(1132);
      should(coerceToInt('1132')).equal(1132);
      should(coerceToInt('-500.3')).equal(-500);
    });
  });

  describe('EntranceService.getConvertedDataFromClientRequest()', () => {
    const makeReq = (body) => ({
      body,
      param: (key) => body[key],
      token: { id: 1 },
    });

    it('should round decimal altitude to nearest integer', () => {
      const req = makeReq({ altitude: 1132.6 });
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.altitude).equal(1133);
    });

    it('should round decimal precision to nearest integer', () => {
      const req = makeReq({ precision: 5.7 });
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.precision).equal(6);
    });

    it('should round decimal yearDiscovery to nearest integer', () => {
      const req = makeReq({ yearDiscovery: 1973.8 });
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.yearDiscovery).equal(1974);
    });

    it('should pass through integer altitude unchanged', () => {
      const req = makeReq({ altitude: 1132 });
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.altitude).equal(1132);
    });

    it('should pass through null altitude unchanged', () => {
      const req = makeReq({ altitude: null });
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.altitude).equal(null);
    });
  });

  describe('CaveService.getConvertedDataFromClient()', () => {
    const makeReq = (body) => ({
      body,
      param: (key) => body[key],
      token: { id: 1 },
    });

    it('should round decimal depth to nearest integer', () => {
      const req = makeReq({ depth: 250.4 });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.depth).equal(250);
    });

    it('should round decimal length to nearest integer', () => {
      const req = makeReq({ length: 1500.7 });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.caveLength).equal(1501);
    });

    it('should pass through integer depth unchanged', () => {
      const req = makeReq({ depth: 250 });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.depth).equal(250);
    });

    it('should preserve temperature decimal exactly', () => {
      const req = makeReq({ temperature: 12.5 });
      const result = CaveService.getConvertedDataFromClient(req);
      should(result.temperature).equal(12.5);
    });
  });
});
