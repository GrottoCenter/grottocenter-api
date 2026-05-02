const should = require('should');
const sinon = require('sinon');
const {
  SORTABLE_COLUMNS,
  SORTABLE_COLUMNS_COUNTRY,
  VALIDATION_ERROR,
  validateSortParams,
} = require('../../../api/utils/validateSortParams');

describe('validateSortParams - Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      param: sinon.stub(),
    };
    res = {
      badRequest: sinon.spy(),
    };
  });

  describe('SORTABLE_COLUMNS', () => {
    it('should contain exactly 18 entries', () => {
      should(SORTABLE_COLUMNS).have.length(18);
    });

    it('should include all expected column names', () => {
      const expected = [
        'entrance_name',
        'date_of_update',
        'general_latest_date_of_update',
        'general_nb_contributions',
        'location_latest_date_of_update',
        'location_nb_contributions',
        'description_latest_date_of_update',
        'description_nb_contributions',
        'document_latest_date_of_update',
        'document_nb_contributions',
        'rigging_latest_date_of_update',
        'rigging_nb_contributions',
        'history_latest_date_of_update',
        'history_nb_contributions',
        'comment_latest_date_of_update',
        'comment_nb_contributions',
        'country_name',
        'massif_name',
      ];
      should(SORTABLE_COLUMNS).deepEqual(expected);
    });
  });

  describe('SORTABLE_COLUMNS_COUNTRY', () => {
    it('should contain exactly 17 entries (no massif_name)', () => {
      should(SORTABLE_COLUMNS_COUNTRY).have.length(17);
    });

    it('should not include massif_name', () => {
      should(SORTABLE_COLUMNS_COUNTRY).not.containEql('massif_name');
    });

    it('should be a strict subset of SORTABLE_COLUMNS', () => {
      SORTABLE_COLUMNS_COUNTRY.forEach((col) => {
        should(SORTABLE_COLUMNS).containEql(col);
      });
    });
  });

  describe('VALIDATION_ERROR', () => {
    it('should be a Symbol', () => {
      should(typeof VALIDATION_ERROR).equal('symbol');
    });

    it('should be retrievable via Symbol.for', () => {
      should(VALIDATION_ERROR).equal(Symbol.for('validateSortParams.error'));
    });
  });

  describe('valid sort column with default order', () => {
    it('should return { sort, order } with default asc when order is absent', () => {
      req.param.withArgs('sort').returns('entrance_name');
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'entrance_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });
  });

  describe('valid sort + valid order', () => {
    it('should return correct values for sort=date_of_update order=desc', () => {
      req.param.withArgs('sort').returns('date_of_update');
      req.param.withArgs('order').returns('desc');

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'date_of_update', order: 'desc' });
      should(res.badRequest.called).be.false();
    });

    it('should return correct values for sort=country_name order=asc', () => {
      req.param.withArgs('sort').returns('country_name');
      req.param.withArgs('order').returns('asc');

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'country_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });
  });

  describe('case-insensitive matching', () => {
    it('should accept uppercase sort column and normalise to lowercase', () => {
      req.param.withArgs('sort').returns('ENTRANCE_NAME');
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'entrance_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });

    it('should accept mixed-case sort column', () => {
      req.param.withArgs('sort').returns('Country_Name');
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'country_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });

    it('should accept uppercase order and normalise to lowercase', () => {
      req.param.withArgs('sort').returns('entrance_name');
      req.param.withArgs('order').returns('DESC');

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'entrance_name', order: 'desc' });
      should(res.badRequest.called).be.false();
    });

    it('should accept mixed-case order', () => {
      req.param.withArgs('sort').returns('entrance_name');
      req.param.withArgs('order').returns('Asc');

      const result = validateSortParams(req, res);

      should(result).deepEqual({ sort: 'entrance_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });
  });

  describe('invalid sort column', () => {
    it('should call res.badRequest and return VALIDATION_ERROR for unknown column', () => {
      req.param.withArgs('sort').returns('nonexistent_column');
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).equal(VALIDATION_ERROR);
      should(res.badRequest.calledOnce).be.true();
      should(res.badRequest.firstCall.args[0]).containEql(
        'Invalid sort column'
      );
      should(res.badRequest.firstCall.args[0]).containEql('nonexistent_column');
    });

    it('should list valid columns in the error message', () => {
      req.param.withArgs('sort').returns('bad_col');
      req.param.withArgs('order').returns(undefined);

      validateSortParams(req, res);

      const msg = res.badRequest.firstCall.args[0];
      should(msg).containEql('entrance_name');
      should(msg).containEql('massif_name');
    });
  });

  describe('invalid order value', () => {
    it('should call res.badRequest and return VALIDATION_ERROR for invalid order', () => {
      req.param.withArgs('sort').returns('entrance_name');
      req.param.withArgs('order').returns('ascending');

      const result = validateSortParams(req, res);

      should(result).equal(VALIDATION_ERROR);
      should(res.badRequest.calledOnce).be.true();
      should(res.badRequest.firstCall.args[0]).containEql(
        'Invalid order value'
      );
      should(res.badRequest.firstCall.args[0]).containEql('ascending');
    });
  });

  describe('no sort param', () => {
    it('should return null when sort is undefined', () => {
      req.param.withArgs('sort').returns(undefined);
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).be.null();
      should(res.badRequest.called).be.false();
    });

    it('should return null when sort is null', () => {
      req.param.withArgs('sort').returns(null);
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res);

      should(result).be.null();
      should(res.badRequest.called).be.false();
    });
  });

  describe('order without sort', () => {
    it('should return null and ignore order when sort is absent', () => {
      req.param.withArgs('sort').returns(undefined);
      req.param.withArgs('order').returns('desc');

      const result = validateSortParams(req, res);

      should(result).be.null();
      should(res.badRequest.called).be.false();
    });
  });

  describe('per-endpoint allow-list (SORTABLE_COLUMNS_COUNTRY)', () => {
    it('should reject massif_name when using country allow-list', () => {
      req.param.withArgs('sort').returns('massif_name');
      req.param.withArgs('order').returns(undefined);

      const result = validateSortParams(req, res, SORTABLE_COLUMNS_COUNTRY);

      should(result).equal(VALIDATION_ERROR);
      should(res.badRequest.calledOnce).be.true();
      should(res.badRequest.firstCall.args[0]).containEql(
        'Invalid sort column'
      );
    });

    it('should accept entrance_name when using country allow-list', () => {
      req.param.withArgs('sort').returns('entrance_name');
      req.param.withArgs('order').returns('asc');

      const result = validateSortParams(req, res, SORTABLE_COLUMNS_COUNTRY);

      should(result).deepEqual({ sort: 'entrance_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });

    it('should accept massif_name when using full allow-list', () => {
      req.param.withArgs('sort').returns('massif_name');
      req.param.withArgs('order').returns('asc');

      const result = validateSortParams(req, res, SORTABLE_COLUMNS);

      should(result).deepEqual({ sort: 'massif_name', order: 'asc' });
      should(res.badRequest.called).be.false();
    });
  });
});
