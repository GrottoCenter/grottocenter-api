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

  it('should call next() when token has subject MfaEnrollment', () => {
    req.token = { id: 1, sub: 'MfaEnrollment', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(next.calledOnce).be.true();
    should(res.unauthorized.called).be.false();
  });

  it('should return 401 when req.token is missing', () => {
    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(
      res.unauthorized.calledWith(
        'Bearer token not found: you need to be authenticated to perform this action.'
      )
    ).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.token is undefined', () => {
    req.token = undefined;

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when req.token is null', () => {
    req.token = null;

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when token has subject Authentication', () => {
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

  it('should return 401 when token has no sub claim', () => {
    req.token = { id: 1, groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(
      res.unauthorized.calledWith(
        'Invalid token: a valid MFA enrollment token is required.'
      )
    ).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when token has an arbitrary subject', () => {
    req.token = { id: 1, sub: 'SomethingElse', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should return 401 when token sub is empty string', () => {
    req.token = { id: 1, sub: '', groups: [] };

    mfaEnrollmentAuth(req, res, next);

    should(res.unauthorized.calledOnce).be.true();
    should(next.called).be.false();
  });
});
