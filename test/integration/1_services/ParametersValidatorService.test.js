const should = require('should');
const sinon = require('sinon');
const ParametersValidatorService = require('../../../api/services/ParametersValidatorService');

describe('ParametersValidatorService', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      param: sinon.stub(),
    };
    res = {
      badRequest: sinon.stub(),
    };
  });

  describe('errorMsgOneOfEntityExist()', () => {
    it('should return error message for entity types', () => {
      const result = ParametersValidatorService.errorMsgOneOfEntityExist([
        'cave',
        'entrance',
      ]);
      should(result).have.property('message');
      should(result.message).containEql('cave');
      should(result.message).containEql('entrance');
    });
  });

  describe('checkOneOfEntityExist()', () => {
    it('should return false when no entity provided', async () => {
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['cave', 'entrance']
      );
      should(result).be.false();
      should(res.badRequest.calledOnce).be.true();
    });

    it('should return false when entity not found', async () => {
      req.param.withArgs('cave').returns(999999);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['cave']
      );
      should(result).be.false();
      should(res.badRequest.calledOnce).be.true();
    });

    it('should return entity info when cave exists', async () => {
      req.param.withArgs('cave').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['cave']
      );
      should(result).not.be.false();
      should(result.type).equal('cave');
      should(result.id).equal(1);
      should.exist(result.value);
    });

    it('should return entity info when entrance exists', async () => {
      req.param.withArgs('entrance').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['entrance']
      );
      should(result).not.be.false();
      should(result.type).equal('entrance');
      should(result.id).equal(1);
    });

    it('should return entity info when document exists', async () => {
      req.param.withArgs('document').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['document']
      );
      should(result).not.be.false();
      should(result.type).equal('document');
    });

    it('should return entity info when massif exists', async () => {
      req.param.withArgs('massif').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['massif']
      );
      should(result).not.be.false();
      should(result.type).equal('massif');
    });

    it('should return entity info when grotto exists', async () => {
      req.param.withArgs('grotto').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['grotto']
      );
      should(result).not.be.false();
      should(result.type).equal('grotto');
    });

    it('should return false for unsupported entity type', async () => {
      req.param.withArgs('unsupported').returns(1);
      req.param.returns(undefined);
      const result = await ParametersValidatorService.checkOneOfEntityExist(
        req,
        res,
        ['unsupported']
      );
      should(result).be.false();
      should(res.badRequest.calledOnce).be.true();
    });
  });

  describe('errorMsgCheckAllExist()', () => {
    it('should return error message for parameters', () => {
      const result = ParametersValidatorService.errorMsgCheckAllExist([
        'name',
        'language',
      ]);
      should(result).have.property('message');
      should(result.message).containEql('name');
      should(result.message).containEql('language');
    });
  });

  describe('checkAllExist()', () => {
    it('should return false when some parameters missing', () => {
      req.param.withArgs('name').returns('Test');
      req.param.withArgs('language').returns(undefined);
      const result = ParametersValidatorService.checkAllExist(req, res, [
        'name',
        'language',
      ]);
      should(result).be.false();
      should(res.badRequest.calledOnce).be.true();
    });

    it('should return values when all parameters exist', () => {
      req.param.withArgs('name').returns('Test');
      req.param.withArgs('language').returns('eng');
      const result = ParametersValidatorService.checkAllExist(req, res, [
        'name',
        'language',
      ]);
      should(result).be.an.Array();
      should(result[0]).equal('Test');
      should(result[1]).equal('eng');
    });

    it('should return false when parameter is empty string', () => {
      req.param.withArgs('name').returns('');
      const result = ParametersValidatorService.checkAllExist(req, res, [
        'name',
      ]);
      should(result).be.false();
    });

    it('should return false when parameter is null', () => {
      req.param.withArgs('name').returns(null);
      const result = ParametersValidatorService.checkAllExist(req, res, [
        'name',
      ]);
      should(result).be.false();
    });
  });
});
