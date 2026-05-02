const should = require('should');
const sinon = require('sinon');
const DataQualityComputeService = require('../../../api/services/DataQualityComputeService');
const CommonService = require('../../../api/services/CommonService');

describe('DataQualityComputeService - sort/order', () => {
  let queryStub;
  let capturedSql;

  beforeEach(() => {
    capturedSql = null;
    queryStub = sinon.stub(CommonService, 'query').callsFake((sql) => {
      capturedSql = sql;
      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(() => {
    queryStub.restore();
  });

  // --- Data methods: sort + order provided ---

  describe('getEntrancesWithQualityByMassif', () => {
    it('should include ORDER BY before LIMIT when sort and order are provided', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByMassif(
        1,
        10,
        0,
        'entrance_name',
        'desc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY entrance_name DESC/);
      const orderIdx = capturedSql.indexOf('ORDER BY');
      const limitIdx = capturedSql.indexOf('LIMIT');
      orderIdx.should.be.lessThan(limitIdx);
    });

    it('should not include ORDER BY when sort is null', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByMassif(
        1,
        10,
        0,
        null,
        null
      );
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });

    it('should include ORDER BY even without pagination (limit=null)', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByMassif(
        1,
        null,
        null,
        'entrance_name',
        'asc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY entrance_name ASC/);
      capturedSql.should.not.match(/LIMIT/);
    });

    it('should not contain placeholder token in final SQL', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByMassif(
        1,
        10,
        0,
        'entrance_name',
        'desc'
      );
      capturedSql.should.not.containEql('{{ORDER_BY}}');
    });

    it('should not contain placeholder token when sort is null', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByMassif(
        1,
        10,
        0,
        null,
        null
      );
      capturedSql.should.not.containEql('{{ORDER_BY}}');
    });
  });

  describe('getEntrancesWithQualityByCountry', () => {
    it('should include ORDER BY before LIMIT when sort and order are provided', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByCountry(
        'FR',
        10,
        0,
        'date_of_update',
        'asc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY date_of_update ASC/);
      const orderIdx = capturedSql.indexOf('ORDER BY');
      const limitIdx = capturedSql.indexOf('LIMIT');
      orderIdx.should.be.lessThan(limitIdx);
    });

    it('should not include ORDER BY when sort is null', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByCountry(
        'FR',
        10,
        0,
        null,
        null
      );
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });

    it('should include ORDER BY even without pagination (limit=null)', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByCountry(
        'FR',
        null,
        null,
        'country_name',
        'desc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY country_name DESC/);
      capturedSql.should.not.match(/LIMIT/);
    });
  });

  describe('getEntrancesWithQualityByRegion', () => {
    it('should include ORDER BY before LIMIT when sort and order are provided', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByRegion(
        'FR-01',
        10,
        0,
        'general_nb_contributions',
        'desc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY general_nb_contributions DESC/);
      const orderIdx = capturedSql.indexOf('ORDER BY');
      const limitIdx = capturedSql.indexOf('LIMIT');
      orderIdx.should.be.lessThan(limitIdx);
    });

    it('should not include ORDER BY when sort is null', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByRegion(
        'FR-01',
        10,
        0,
        null,
        null
      );
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });

    it('should include ORDER BY even without pagination (limit=null)', async () => {
      await DataQualityComputeService.getEntrancesWithQualityByRegion(
        'FR-01',
        null,
        null,
        'entrance_name',
        'asc'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.match(/ORDER BY entrance_name ASC/);
      capturedSql.should.not.match(/LIMIT/);
    });
  });

  // --- Count methods: never contain ORDER BY ---

  describe('getEntrancesWithQualityByMassifCount', () => {
    it('should never contain ORDER BY', async () => {
      queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').callsFake((sql) => {
        capturedSql = sql;
        return Promise.resolve({ rows: [{ count: '0' }] });
      });
      await DataQualityComputeService.getEntrancesWithQualityByMassifCount(1);
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });
  });

  describe('getEntrancesWithQualityByCountryCount', () => {
    it('should never contain ORDER BY', async () => {
      queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').callsFake((sql) => {
        capturedSql = sql;
        return Promise.resolve({ rows: [{ count: '0' }] });
      });
      await DataQualityComputeService.getEntrancesWithQualityByCountryCount(
        'FR'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });
  });

  describe('getEntrancesWithQualityByRegionCount', () => {
    it('should never contain ORDER BY', async () => {
      queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').callsFake((sql) => {
        capturedSql = sql;
        return Promise.resolve({ rows: [{ count: '0' }] });
      });
      await DataQualityComputeService.getEntrancesWithQualityByRegionCount(
        'FR-01'
      );
      should(capturedSql).not.be.null();
      capturedSql.should.not.match(/ORDER BY/);
    });
  });
});
