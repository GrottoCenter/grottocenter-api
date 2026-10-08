const should = require('should');
const sinon = require('sinon');
const mfaEnrollmentAuth = require('../../../api/policies/mfaEnrollmentAuth');

describe('mfaEnrollmentAuth policy', () => {
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

  it('should call next() when req.mfaEnrollmentToken has subject MfaEnrollment', () => {
    req.mfaEnrollmentToken = { id: 1, sub: 'MfaEnrollment', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(next.calledOnce).be.true();
    should(res.unauthorized.called).be.false();
  });

  it('should return 401 when no token is present', () => {
    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(
      res.unauthorized.calledWith(
        'Bearer token not found: you need to be authenticated to perform this action.'
      )
    ).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when both tokens are null', () => {
    req.token = null;
    req.mfaEnrollmentToken = null;

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when only a full Authentication token is present', () => {
    req.token = { id: 1, sub: 'Authentication', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(
      res.unauthorized.calledWith(
        'Invalid token: a valid MFA enrollment token is required.'
      )
    ).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.token has subject MfaEnrollment but req.mfaEnrollmentToken is unset', () => {
    req.token = { id: 1, sub: 'MfaEnrollment', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.mfaEnrollmentToken has no sub claim', () => {
    req.mfaEnrollmentToken = { id: 1, groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(
      res.unauthorized.calledWith(
        'Invalid token: a valid MFA enrollment token is required.'
      )
    ).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.mfaEnrollmentToken has an arbitrary subject', () => {
    req.mfaEnrollmentToken = { id: 1, sub: 'SomethingElse', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.mfaEnrollmentToken sub is empty string', () => {
    req.mfaEnrollmentToken = { id: 1, sub: '', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });
});
