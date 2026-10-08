const should = require('should');
const parseBool = require('../../../api/utils/parseBool');
const readBoolParam = require('../../../api/utils/readBoolParam');

const makeReq = (params) => ({
  param: (key) => params[key],
  // formatStructuredError reads these
  headers: {},
  path: '/test',
  method: 'GET',
});

describe('parseBool - Unit Tests', () => {
  it('should map the true encodings to true', () => {
    should(parseBool(true)).be.true();
    should(parseBool('true')).be.true();
    should(parseBool('1')).be.true();
  });

  it('should map the false encodings to false', () => {
    should(parseBool(false)).be.false();
    should(parseBool('false')).be.false();
    should(parseBool('0')).be.false();
  });

  it('should treat undefined, null and the empty string as absent', () => {
    should(parseBool(undefined)).be.undefined();
    should(parseBool(null)).be.undefined();
    should(parseBool('')).be.undefined();
  });

  it('should reject other strings, including other casings and padding', () => {
    ['yes', 'no', 'on', 'TRUE', 'False', ' true', '1 ', '2', '-1'].forEach(
      (value) => should(parseBool(value)).equal(parseBool.INVALID)
    );
  });

  it('should reject numbers, objects and arrays', () => {
    [1, 0, NaN, {}, [], ['true'], { value: true }].forEach((value) =>
      should(parseBool(value)).equal(parseBool.INVALID)
    );
  });
});

describe('readBoolParam - Unit Tests', () => {
  it('should return the parsed value', () => {
    should(readBoolParam(makeReq({ flag: '0' }), 'flag', true)).eql({
      value: false,
    });
  });

  it('should return the default when the parameter is absent', () => {
    should(readBoolParam(makeReq({}), 'flag', true)).eql({ value: true });
    should(readBoolParam(makeReq({ flag: null }), 'flag', false)).eql({
      value: false,
    });
    should(readBoolParam(makeReq({}), 'flag')).eql({ value: undefined });
  });

  it('should return a structured error naming the parameter and value', () => {
    const { value, error } = readBoolParam(makeReq({ flag: 'yes' }), 'flag');

    should(value).be.undefined();
    should(error.code).equal('E_BAD_REQUEST');
    should(error.metadata).eql({ field: 'flag', value: 'yes' });
    should(error.reference_id).be.a.String();
  });

  describe('firstError()', () => {
    it('should return null when every parameter is valid or absent', () => {
      should(
        readBoolParam.firstError(makeReq({ a: 'true', b: false }), [
          'a',
          'b',
          'c',
        ])
      ).be.null();
    });

    it('should return the error of the first invalid parameter', () => {
      const error = readBoolParam.firstError(
        makeReq({ a: 'true', b: 'nope', c: 'never' }),
        ['a', 'b', 'c']
      );
      should(error.metadata.field).equal('b');
    });
  });
});

describe('Service converters - boolean fields', () => {
  let EntranceService;
  let MassifService;
  let CaveService;

  before(() => {
    /* eslint-disable global-require */
    EntranceService = require('../../../api/services/EntranceService');
    MassifService = require('../../../api/services/MassifService');
    CaveService = require('../../../api/services/CaveService');
    /* eslint-enable global-require */
  });

  const makeBodyReq = (body) => ({ body, param: (key) => body[key] });

  it('should parse every entrance flag and drop absent or null ones', () => {
    const result = EntranceService.getConvertedDataFromClientRequest(
      makeBodyReq({
        hasBat: '1',
        dangerCo2: 'false',
        isTouristic: true,
        isSensitive: null,
      })
    );

    should(result.hasBat).be.true();
    should(result.dangerCo2).be.false();
    should(result.isTouristic).be.true();
    // null would otherwise reach a NOT NULL column
    should(result.isSensitive).be.undefined();
    should(result.needCleanGear).be.undefined();
  });

  it('should list every boolean entrance attribute of TEntrance', () => {
    const booleanAttributes = Object.entries(TEntrance.attributes)
      .filter(([, def]) => def.type === 'boolean')
      .map(([name]) => name);
    EntranceService.BOOLEAN_FIELDS.forEach((field) =>
      should(booleanAttributes).containEql(field)
    );
  });

  it('should parse the massif sensitivity flags', () => {
    const result = MassifService.getConvertedDataFromClientRequest(
      makeBodyReq({ isSensitive: '0', isSensitiveLocked: 'true' })
    );

    should(result.isSensitive).be.false();
    should(result.isSensitiveLocked).be.true();
  });

  it('should parse the cave isDiving flag', () => {
    should(
      CaveService.getConvertedDataFromClient(makeBodyReq({ isDiving: '1' }))
        .isDiving
    ).be.true();
    should(
      CaveService.getConvertedDataFromClient(makeBodyReq({})).isDiving
    ).be.undefined();
  });
});
