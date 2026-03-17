const should = require('should');
const sinon = require('sinon');
const RecentChangeService = require('../../../api/services/RecentChangeService');
const CommonService = require('../../../api/services/CommonService');

describe('RecentChangeService - 7-day window fix', () => {
  describe('getRecent() query includes date filter and limit', () => {
    let querySpy;

    afterEach(() => {
      if (querySpy) {
        querySpy.restore();
        querySpy = null;
      }
    });

    it('should include WHERE date_change filter in the query', async () => {
      querySpy = sinon.spy(CommonService, 'query');
      await RecentChangeService.getRecent();
      should(querySpy.calledOnce).be.true();
      const sql = querySpy.firstCall.args[0];
      should(sql).containEql("interval '7 days'");
      should(sql).containEql('current_timestamp');
    });

    it('should include LIMIT in the query', async () => {
      querySpy = sinon.spy(CommonService, 'query');
      await RecentChangeService.getRecent();
      const sql = querySpy.firstCall.args[0];
      should(sql.toLowerCase()).containEql('limit 500');
    });

    it('should still return results ordered by date DESC', async () => {
      querySpy = sinon.spy(CommonService, 'query');
      await RecentChangeService.getRecent();
      const sql = querySpy.firstCall.args[0];
      should(sql.toLowerCase()).containEql('order by date_change desc');
    });
  });
});
