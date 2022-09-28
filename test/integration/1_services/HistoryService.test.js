const should = require('should');
const HistoryService = require('../../../api/services/HistoryService');

const HISTORY_PROPERTIES = [
  'id',
  'dateInscription',
  'dateReviewed',
  'relevance',
  'body',
  'author',
  'reviewer',
  'cave',
  'entrance',
  'point',
  'language',
];

describe('HistoryService', () => {
  describe('getCaveHistories()', () => {
    it('should get the cave histories', async () => {
      const histories = await HistoryService.getCaveHistories(1);
      should(histories).have.length(2);
      for (const history of histories) {
        should(history).have.properties(HISTORY_PROPERTIES);
        should(history.id).not.be.undefined();
        should(history.body).not.be.empty();
        should(history.cave).not.be.undefined();
      }
    });
  });
});
