let should = require('should');

describe('CommentService', () => {
  describe('getStats()', () => {
    it('should get the entrance stats', async () => {
      const stats = await CommentService.getStats(1);
      should(stats.aestheticism).equal(2);
      should(stats.caving).equal(8);
      should(stats.approach).equal(8);
    });
  });
});
