const should = require('should');
const sinon = require('sinon');
const ErrorService = require('../../../api/services/ErrorService');

describe('ErrorService', () => {
  let res;

  beforeEach(() => {
    res = {
      conflict: sinon.stub(),
      badRequest: sinon.stub(),
      serverError: sinon.stub(),
    };
  });

  describe('getDefaultErrorHandler()', () => {
    it('should handle E_UNIQUE error with attrNames', () => {
      const error = { code: 'E_UNIQUE', attrNames: ['email', 'username'] };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.conflict.calledOnce).be.true();
      should(res.conflict.getCall(0).args[0]).containEql('email,username');
    });

    it('should handle E_UNIQUE error with raw footprint', () => {
      const error = { code: 'E_UNIQUE', raw: { footprint: { keys: 'id' } } };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.conflict.calledOnce).be.true();
      should(res.conflict.getCall(0).args[0]).containEql('id');
    });

    it('should handle E_UNIQUE error without attributes', () => {
      const error = { code: 'E_UNIQUE' };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.conflict.calledOnce).be.true();
    });

    it('should handle UsageError', () => {
      const error = { name: 'UsageError', message: 'Invalid usage' };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.badRequest.calledOnce).be.true();
      should(res.badRequest.calledWith('Invalid usage')).be.true();
    });

    it('should handle AdapterError', () => {
      const error = { name: 'AdapterError', message: 'Database error' };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.badRequest.calledOnce).be.true();
      should(res.badRequest.calledWith('Database error')).be.true();
    });

    it('should handle unknown error', () => {
      const error = { name: 'UnknownError', message: 'Something went wrong' };
      const handler = ErrorService.getDefaultErrorHandler(res);
      handler(error);
      should(res.serverError.calledOnce).be.true();
      should(res.serverError.calledWith('Something went wrong')).be.true();
    });
  });
});
