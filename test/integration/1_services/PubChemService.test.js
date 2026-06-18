const should = require('should');
const sinon = require('sinon');

describe('PubChemService', () => {
  let fetchStub;
  let logWarnStub;

  beforeEach(() => {
    logWarnStub = sinon.stub(sails.log, 'warn');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('search()', () => {
    it('should return mapped results on successful autocomplete and property lookup', async () => {
      fetchStub = sinon.stub(global, 'fetch');

      // First call: autocomplete
      fetchStub.onFirstCall().resolves({
        ok: true,
        json: async () => ({
          dictionary_terms: {
            compound: ['Nitrate', 'Nitrite'],
          },
        }),
      });

      // Second call: property lookup for "Nitrate"
      fetchStub.onSecondCall().resolves({
        ok: true,
        json: async () => ({
          PropertyTable: {
            Properties: [{ MolecularFormula: 'NO3-', CID: 943 }],
          },
        }),
      });

      // Third call: property lookup for "Nitrite"
      fetchStub.onThirdCall().resolves({
        ok: true,
        json: async () => ({
          PropertyTable: {
            Properties: [{ MolecularFormula: 'NO2-', CID: 946 }],
          },
        }),
      });

      const results = await PubChemService.search('nitr');

      should(results).be.an.Array();
      should(results).have.length(2);

      should(results[0]).have.property('name', 'Nitrate');
      should(results[0]).have.property('formula', 'NO3-');
      should(results[0]).have.property('casNumber', null);
      should(results[0]).have.property('externalId', '943');
      should(results[0]).have.property('externalSource', 'PubChem');

      should(results[1]).have.property('name', 'Nitrite');
      should(results[1]).have.property('formula', 'NO2-');
      should(results[1]).have.property('externalId', '946');
      should(results[1]).have.property('externalSource', 'PubChem');
    });

    it('should return [] on timeout (AbortError)', async () => {
      fetchStub = sinon.stub(global, 'fetch').callsFake(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const results = await PubChemService.search('calcium');

      should(results).be.an.Array();
      should(results).have.length(0);
      should(logWarnStub.called).be.true();
    });

    it('should return [] on non-200 HTTP response from autocomplete', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: false,
        status: 500,
      });

      const results = await PubChemService.search('calcium');

      should(results).be.an.Array();
      should(results).have.length(0);
      should(logWarnStub.called).be.true();
    });

    it('should return [] on 429 rate limit response', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: false,
        status: 429,
      });

      const results = await PubChemService.search('calcium');

      should(results).be.an.Array();
      should(results).have.length(0);
      should(logWarnStub.called).be.true();
    });

    it('should return [] when autocomplete returns no results', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({
          dictionary_terms: {
            compound: [],
          },
        }),
      });

      const results = await PubChemService.search('xyznonexistent');

      should(results).be.an.Array();
      should(results).have.length(0);
    });

    it('should return result with null formula/CID when property lookup fails', async () => {
      fetchStub = sinon.stub(global, 'fetch');

      // First call: autocomplete succeeds
      fetchStub.onFirstCall().resolves({
        ok: true,
        json: async () => ({
          dictionary_terms: {
            compound: ['Calcium'],
          },
        }),
      });

      // Second call: property lookup fails with non-200
      fetchStub.onSecondCall().resolves({
        ok: false,
        status: 404,
      });

      const results = await PubChemService.search('calc');

      should(results).be.an.Array();
      should(results).have.length(1);
      should(results[0]).have.property('name', 'Calcium');
      should(results[0]).have.property('formula', null);
      should(results[0]).have.property('externalId', null);
      should(results[0]).have.property('externalSource', null);
      should(results[0]).have.property('casNumber', null);
    });
  });
});
