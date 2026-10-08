const should = require('should');
const sinon = require('sinon');
const tokenAuth = require('../../../api/policies/tokenAuth');

const NOT_FOUND_MESSAGE =
  'Bearer token not found: you need to be authenticated to perform this action.';

describe('tokenAuth policy', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      unauthorized: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call next() when req.token has subject Authentication', () => {
    req.token = { id: 1, sub: 'Authentication', groups: [] };

    tokenAuth(req, res, next);

    should(next.calledOnce).be.true();
    should(res.unauthorized.called).be.false();
  });

  it('should return 401 when req.token is missing', () => {
    tokenAuth(req, res, next);

    should(res.unauthorized.calledOnceWith(NOT_FOUND_MESSAGE)).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when only an MFA enrollment token is present', () => {
    req.mfaEnrollmentToken = { id: 1, sub: 'MfaEnrollment', groups: [] };

    tokenAuth(req, res, next);

    should(res.unauthorized.calledOnceWith(NOT_FOUND_MESSAGE)).be.true();
    should(next.called).be.false();
  });

  ['MfaEnrollment', 'Reset password', '', undefined].forEach((sub) => {
    it(`should return 401 when req.token has subject ${JSON.stringify(sub)}`, () => {
      req.token = { id: 1, sub, groups: [] };

      tokenAuth(req, res, next);

      should(res.unauthorized.calledOnceWith(NOT_FOUND_MESSAGE)).be.true();
      should(next.called).be.false();
    });
  });
});
