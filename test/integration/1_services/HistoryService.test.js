const should = require('should');
const HistoryService = require('../../../api/services/HistoryService');

describe('HistoryService', () => {
  describe('getEntranceHistories()', () => {
    it('should return empty array when entranceId is null', async () => {
      const histories = await HistoryService.getEntranceHistories(null);
      should(histories).be.an.Array();
      should(histories.length).equal(0);
    });

    it('should get histories for entrance', async () => {
      const histories = await HistoryService.getEntranceHistories(1);
      should(histories).be.an.Array();
    });
  });

  describe('getEntranceHHistories()', () => {
    it('should return empty array when entranceId is null', async () => {
      const histories = await HistoryService.getEntranceHHistories(null);
      should(histories).be.an.Array();
      should(histories.length).equal(0);
    });

    it('should get historical histories for entrance', async () => {
      const histories = await HistoryService.getEntranceHHistories(1);
      should(histories).be.an.Array();
    });
  });

  describe('getHistory()', () => {
    it('should get a history by id', async () => {
      const history = await HistoryService.getHistory(1);
      if (history) {
        should.exist(history.author);
      }
    });
  });

  describe('getHHistories()', () => {
    it('should get historical histories by id', async () => {
      const histories = await HistoryService.getHHistories(1);
      should(histories).be.an.Array();
    });
  });
});
