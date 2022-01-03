let should = require('should');

describe('ElasticsearchService', () => {
  describe('sanitizeQuery()', () => {
    it('should remove various special characters', async () => {
      const testString = '(te.st)d\'une"fonction#.';
      const result = await ElasticsearchService.sanitizeQuery(testString);
      should(result).equal(`te.st d'une fonction`);
    });
  });
});
