const should = require('should');
const CommentService = require('../../../api/services/CommentService');

describe('CommentService', () => {
  describe('getStatsFromId()', () => {
    it('should get the entrance stats', async () => {
      const stats = await CommentService.getStatsFromId(1);
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

    it('should return null when pgInterval is null', () => {
      const result = CommentService.postgreIntervalObjectToDbString(null);
      should(result).be.null();
    });

    it('should return null when pgInterval is undefined', () => {
      const result = CommentService.postgreIntervalObjectToDbString(undefined);
      should(result).be.null();
    });

    it('should handle full duration object', () => {
      const duration = CommentService.postgreIntervalObjectToDbString({
        days: 1,
        hours: 3,
        minutes: 30,
        seconds: 45,
      });
      should(duration).equal('27:30:45');
    });
  });

  describe('getTimeInfos()', () => {
    it('should get time infos for entrance', async () => {
      const timeInfos = await CommentService.getTimeInfos(1);
      should.exist(timeInfos);
      should(timeInfos).have.property('eTTrail');
      should(timeInfos).have.property('eTUnderground');
    });
  });

  describe('getEntranceComments()', () => {
    it('should return empty array when entranceId is null', async () => {
      const comments = await CommentService.getEntranceComments(null);
      should(comments).be.an.Array();
      should(comments.length).equal(0);
    });

    it('should get comments for entrance', async () => {
      const comments = await CommentService.getEntranceComments(1);
      should(comments).be.an.Array();
      should(comments.length).be.greaterThan(0);
      should.exist(comments[0].author);
    });
  });

  describe('getEntranceHComments()', () => {
    it('should return empty array when entranceId is null', async () => {
      const comments = await CommentService.getEntranceHComments(null);
      should(comments).be.an.Array();
      should(comments.length).equal(0);
    });

    it('should get historical comments for entrance', async () => {
      const comments = await CommentService.getEntranceHComments(1);
      should(comments).be.an.Array();
    });
  });

  describe('getComment()', () => {
    it('should get a comment by id', async () => {
      const comment = await CommentService.getComment(1);
      should.exist(comment);
      should.exist(comment.author);
    });
  });

  describe('getHComments()', () => {
    it('should get historical comments by id', async () => {
      const comments = await CommentService.getHComments(1);
      should(comments).be.an.Array();
    });
  });
});
