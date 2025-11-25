const should = require('should');
const sinon = require('sinon');
const validateId = require('../../../api/policies/validateId');

describe('validateId policy', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: {},
      param: sinon.stub(),
    };
    res = {
      notFound: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call next() for valid positive integer in params', () => {
    req.params.id = '123';

    validateId(req, res, next);

    should(next.calledOnce).be.true();
    should(res.notFound.called).be.false();
  });

  it('should call next() for valid positive integer from param()', () => {
    req.param.returns('456');

    validateId(req, res, next);

    should(next.calledOnce).be.true();
    should(res.notFound.called).be.false();
  });

  it('should return notFound for ID 0', () => {
    req.params.id = '0';

    validateId(req, res, next);

    should(res.notFound.calledOnce).be.true();
    should(res.notFound.calledWith('Invalid ID: 0')).be.true();
    should(next.called).be.false();
  });

  it('should return notFound for negative ID', () => {
    req.params.id = '-1';

    validateId(req, res, next);

    should(res.notFound.calledOnce).be.true();
    should(res.notFound.calledWith('Invalid ID: -1')).be.true();
    should(next.called).be.false();
  });

  it('should return notFound for non-numeric ID', () => {
    req.params.id = 'abc';

    validateId(req, res, next);

    should(res.notFound.calledOnce).be.true();
    should(res.notFound.calledWith('Invalid ID: abc')).be.true();
    should(next.called).be.false();
  });

  it('should return notFound for decimal ID', () => {
    req.params.id = '12.5';

    validateId(req, res, next);

    should(res.notFound.calledOnce).be.true();
    should(next.called).be.false();
  });

  it('should handle numeric input', () => {
    req.params.id = 42;

    validateId(req, res, next);

    should(next.calledOnce).be.true();
    should(res.notFound.called).be.false();
  });
});
