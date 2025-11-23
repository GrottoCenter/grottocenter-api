/* eslint-disable global-require */
const should = require('should');

describe('marcConvertor/country/Default', () => {
  let DefaultConvertor;

  before(() => {
    DefaultConvertor = require('../../../../../api/services/marcConvertor/country/Default');
  });

  describe('normalizeMarc', () => {
    it('should return document unchanged', async () => {
      const document = { id: 1, title: 'Test', author: 'Author' };
      const result = await DefaultConvertor.normalizeMarc(document);
      should(result).deepEqual(document);
    });

    it('should handle empty document', async () => {
      const document = {};
      const result = await DefaultConvertor.normalizeMarc(document);
      should(result).deepEqual(document);
    });
  });
});
