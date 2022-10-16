const should = require('should');
const CommentService = require('../../../api/services/CommentService');

describe('CommentService', () => {
  describe('getStats()', () => {
    it('should get the entrance stats', async () => {
      const stats = await CommentService.getStats(1);
      should(stats.aestheticism).equal(2);
      should(stats.caving).equal(8);
      should(stats.approach).equal(8);
    });
  });
  describe('postgreIntervalObjectToDbString()', () => {
    it('should convert a duration object into a DB string for API', async () => {
      const duration = CommentService.postgreIntervalObjectToDbString({
        hours: 2,
        minutes: 15,
      });
      should(duration).equal('02:15:00');
    });
  });
});
