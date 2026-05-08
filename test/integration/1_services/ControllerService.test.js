const should = require('should');
const sinon = require('sinon');
const ControllerService = require('../../../api/services/ControllerService');

describe('ControllerService', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      token: { groups: [] },
      url: 'http://example.com/api/items?range=0-10',
    };
    res = {
      badRequest: sinon.stub().returnsThis(),
      notFound: sinon.stub().returnsThis(),
      ok: sinon.stub().returnsThis(),
      serverError: sinon.stub().returnsThis(),
      partialContent: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('treat()', () => {
    it('should return badRequest when error occurs', () => {
      const parameters = { controllerMethod: 'testMethod' };
      const error = new Error('Test error');

      ControllerService.treat(req, error, null, parameters, res);

      should(res.badRequest.calledOnce).be.true();
      should(
        res.badRequest.calledWith('testMethod error: Error: Test error')
      ).be.true();
    });

    it('should return notFound when found is null', () => {
      const parameters = { notFoundMessage: 'Item not found' };

      ControllerService.treat(req, null, null, parameters, res);

      should(res.notFound.calledOnce).be.true();
      should(res.notFound.calledWith('Item not found')).be.true();
    });

    it('should return notFound when found is undefined', () => {
      const parameters = { notFoundMessage: 'Item not found' };

      ControllerService.treat(req, null, undefined, parameters, res);

      should(res.notFound.calledOnce).be.true();
    });

    it('should return ok when found is valid', () => {
      const found = { id: 1, name: 'Test' };
      const parameters = {};

      ControllerService.treat(req, null, found, parameters, res);

      should(res.ok.calledOnce).be.true();
      should(res.ok.calledWith(found)).be.true();
    });

    it('should return ok when found is an empty array', () => {
      const found = [];
      const parameters = {};

      ControllerService.treat(req, null, found, parameters, res);

      should(res.ok.calledOnce).be.true();
      should(res.ok.calledWith(found)).be.true();
    });
  });

  describe('treatAndConvert()', () => {
    const converter = (data) =>
      data.map((item) => ({ ...item, converted: true }));

    it('should set JSON-LD Link header', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        total: 10,
        skip: 0,
        limit: 10,
        maxRange: 100,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(
        res.set.calledWith(
          'Link',
          '<https://ontology.uis-speleo.org/grottocenter.org_context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
        )
      ).be.true();
    });

    it('should return serverError when error occurs', () => {
      const error = new Error('Database error');
      const parameters = { searchedItem: 'items' };

      ControllerService.treatAndConvert(
        req,
        error,
        null,
        parameters,
        res,
        converter
      );

      should(res.serverError.calledOnce).be.true();
      should(
        res.serverError.calledWith(
          'An internal error occurred when getting items'
        )
      ).be.true();
    });

    it('should return notFound when found is null', () => {
      const parameters = { searchedItem: 'items' };

      ControllerService.treatAndConvert(
        req,
        null,
        null,
        parameters,
        res,
        converter
      );

      should(res.notFound.calledOnce).be.true();
      should(res.notFound.calledWith('items not found')).be.true();
    });

    it('should return notFound when found is undefined', () => {
      const parameters = { searchedItem: 'items' };

      ControllerService.treatAndConvert(
        req,
        null,
        undefined,
        parameters,
        res,
        converter
      );

      should(res.notFound.calledOnce).be.true();
    });

    it('should return ok with converted data when total < found.length', () => {
      const found = [{ id: 1 }, { id: 2 }];
      const parameters = { searchedItem: 'items', total: 1 };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.ok.calledOnce).be.true();
      const result = res.ok.getCall(0).args[0];
      should(result).be.an.Array();
      should(result[0]).have.property('converted', true);
    });

    it('should call treatRange when total >= found.length', () => {
      const found = [{ id: 1 }, { id: 2 }];
      const parameters = {
        searchedItem: 'items',
        total: 10,
        skip: 0,
        limit: 10,
        maxRange: 100,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.callCount).be.greaterThan(1);
      should(res.partialContent.calledOnce).be.true();
    });
  });

  describe('treatRange()', () => {
    const converter = (data) =>
      data.map((item) => ({ ...item, converted: true }));

    it('should set Accept-Range header', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Accept-Range', 'items 100')).be.true();
    });

    it('should set Content-Range header correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Content-Range', '0-10/50')).be.true();
    });

    it('should set Link header with pagination links', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 10,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=10-20',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="first"')
        );
      should(linkCall).not.be.undefined();
      should(linkCall.args[1]).match(/rel="first"/);
      should(linkCall.args[1]).match(/rel="prev"/);
      should(linkCall.args[1]).match(/rel="next"/);
      should(linkCall.args[1]).match(/rel="last"/);
    });

    it('should set Access-Control-Expose-Headers', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(
        res.set.calledWith('Access-Control-Expose-Headers', 'Content-Range')
      ).be.true();
    });

    it('should return partialContent with converted data', () => {
      const found = [{ id: 1 }, { id: 2 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.partialContent.calledOnce).be.true();
      const result = res.partialContent.getCall(0).args[0];
      should(result).be.an.Array();
      should(result[0]).have.property('converted', true);
    });

    it('should handle first page correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Content-Range', '0-10/50')).be.true();
      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('range=0-10')
        );
      should(linkCall).not.be.undefined();
    });

    it('should handle middle page correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 20,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=20-30',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Content-Range', '20-30/50')).be.true();
      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('range=10-20')
        );
      should(linkCall).not.be.undefined();
    });

    it('should handle last page correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 40,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=40-50',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Content-Range', '40-50/50')).be.true();
    });

    it('should handle when limit exceeds total', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 100,
        total: 50,
        url: 'http://example.com/api/items?range=0-100',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      should(res.set.calledWith('Content-Range', '0-50/50')).be.true();
    });

    it('should calculate prev range correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 20,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=20-30',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="prev"')
        );
      should(linkCall.args[1]).match(/range=10-20/);
    });

    it('should calculate next range correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 10,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=10-20',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="next"')
        );
      should(linkCall.args[1]).match(/range=20-30/);
    });

    it('should calculate last range correctly', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 45,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="last"')
        );
      should(linkCall.args[1]).match(/range=35-45/);
    });

    it('should handle skip at 0 for prev calculation', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="prev"')
        );
      should(linkCall.args[1]).match(/range=0-10/);
    });

    it('should handle when next would exceed total', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 45,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=45-55',
      };

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converter
      );

      const linkCall = res.set
        .getCalls()
        .find(
          (call) =>
            call.args[0] === 'Link' && call.args[1].includes('rel="next"')
        );
      should(linkCall.args[1]).match(/range=50-50/);
    });

    it('should pass meta to converter', () => {
      const found = [{ id: 1 }];
      const parameters = {
        searchedItem: 'items',
        maxRange: 100,
        skip: 0,
        limit: 10,
        total: 50,
        url: 'http://example.com/api/items?range=0-10',
      };
      const converterSpy = sinon.spy((data, meta) => data); // eslint-disable-line no-unused-vars

      ControllerService.treatAndConvert(
        req,
        null,
        found,
        parameters,
        res,
        converterSpy
      );

      should(converterSpy.calledOnce).be.true();
      const meta = converterSpy.getCall(0).args[1];
      should(meta).have.property('hasCompleteViewRight');
    });
  });
});
