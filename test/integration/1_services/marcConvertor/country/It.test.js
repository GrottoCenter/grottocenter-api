/* eslint-disable global-require */
const should = require('should');

describe('marcConvertor/country/It', () => {
  let ItConvertor;

  before(() => {
    ItConvertor = require('../../../../../api/services/marcConvertor/country/It');
  });

  describe('normalizeMarc', () => {
    it('should set dcRights to null', async () => {
      const document = { dcRights: 'Some rights' };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.dcRights).be.null();
    });

    it('should set Responsability from dcCreators', async () => {
      const document = { dcCreators: ['Author1', 'Author2'] };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.Responsability).equal('Author1');
    });

    it('should set Responsability from dcPublisher when no creators', async () => {
      const document = { dcPublisher: 'Publisher' };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.Responsability).equal('edited by Publisher');
    });

    it('should not set Responsability when creator is Unknown', async () => {
      const document = { dcCreators: ['Unknown'] };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.Responsability).be.undefined();
    });

    it('should not set Responsability when publisher is Unknown', async () => {
      const document = { dcPublisher: 'Unknown' };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.Responsability).be.undefined();
    });

    it('should create otherField for collection with issues', async () => {
      const document = {
        dcTypeGrottocenter: 'collection',
        children: [
          { id: 1, dcTypeGrottocenter: 'issue', dcTitle: 'Issue 1' },
          { id: 2, dcTypeGrottocenter: 'issue', dcTitle: 'Issue 2' },
        ],
      };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.otherField).be.an.Array();
      should(result.otherField.length).equal(2);
      should(result.otherField[0][0]).equal('462');
    });

    it('should handle collection without children', async () => {
      const document = { dcTypeGrottocenter: 'collection' };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.otherField).be.an.Array();
      should(result.otherField.length).equal(0);
    });

    it('should handle non-collection documents', async () => {
      const document = { dcTypeGrottocenter: 'article' };
      const result = await ItConvertor.normalizeMarc(document);
      should(result.otherField).be.an.Array();
      should(result.otherField.length).equal(0);
    });
  });
});
