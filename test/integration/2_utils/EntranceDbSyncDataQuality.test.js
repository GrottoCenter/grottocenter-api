const should = require('should');
const sinon = require('sinon');
const CommonService = require('../../../api/services/CommonService');

describe('Entrance dbSync - dataQuality computation in processRows', () => {
  let processRows;

  before(() => {
    // eslint-disable-next-line global-require
    ({ processRows } = require('../../../api/dbSync/entities/entrance'));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should compute dataQuality from quality data and remove qualityData field', async () => {
    const qualityRow = {
      id_entrance: 1,
      general_latest_date_of_update: new Date(),
      general_nb_contributions: 3,
      location_latest_date_of_update: new Date(),
      location_nb_contributions: 2,
      description_latest_date_of_update: new Date(),
      description_nb_contributions: 1,
      document_latest_date_of_update: new Date(),
      document_nb_contributions: 2,
      rigging_latest_date_of_update: new Date(),
      rigging_nb_contributions: 1,
      history_latest_date_of_update: new Date(),
      history_nb_contributions: 2,
      comment_latest_date_of_update: new Date(),
      comment_nb_contributions: 3,
    };

    // Stub CommonService.query to return quality data for the quality join
    // and empty results for all other joins
    const queryStub = sinon.stub(CommonService, 'query');
    queryStub.callsFake((sql) => {
      if (sql.includes('v_data_quality_compute_entrance')) {
        return Promise.resolve({ rows: [{ ...qualityRow }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const rows = [
      {
        id: 1,
        caveId: null,
        isSensitive: false,
        comments: [],
      },
    ];

    // Create an async iterable source that yields one batch of rows
    async function* source() {
      yield rows;
    }

    const results = [];
    for await (const row of processRows(source())) {
      results.push(row);
    }

    should(results).have.length(1);
    should(results[0]).have.property('dataQuality');
    should(results[0].dataQuality).be.a.Number();
    should(results[0].dataQuality).be.greaterThan(0);
    should(results[0].dataQuality).be.lessThanOrEqual(100);
    should(results[0]).not.have.property('qualityData');
  });

  it('should default dataQuality to 0 when no quality row exists', async () => {
    // Stub CommonService.query to return empty results for all joins
    const queryStub = sinon.stub(CommonService, 'query');
    queryStub.resolves({ rows: [] });

    const rows = [
      {
        id: 999,
        caveId: null,
        isSensitive: false,
        comments: [],
      },
    ];

    async function* source() {
      yield rows;
    }

    const results = [];
    for await (const row of processRows(source())) {
      results.push(row);
    }

    should(results).have.length(1);
    should(results[0]).have.property('dataQuality');
    should(results[0].dataQuality).equal(0);
    should(results[0]).not.have.property('qualityData');
  });
});
