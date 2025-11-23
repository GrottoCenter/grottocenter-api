/* eslint-disable global-require */
const should = require('should');

describe('marcConvertor/format/Unimarc', () => {
  let Unimarc;

  before(() => {
    Unimarc = require('../../../../../api/services/marcConvertor/format/Unimarc');
  });

  describe('transform', () => {
    it('should transform basic document', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test Document',
        dcCreators: ['Author1'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
      should.exist(result.record);
    });

    it('should handle document with multiple creators', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: ['Author1', 'Author2'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle Unknown creator', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: ['Unknown'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle publisher and date', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcPublisher: 'Publisher',
        dcDate: new Date('2024-01-01'),
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle languages', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcLanguages: ['eng', 'fra'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle coverages with ISO codes', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCoverages: ['FRA', 'FR-75'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle parents', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypeGrottocenter: 'article',
        parents: [{ id: 2, dcTitle: 'Parent Document' }],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle all optional fields', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcDescriptions: ['Description 1'],
        dcSources: ['Source 1'],
        dcSubjects: ['Subject1'],
        dcFormats: ['application/pdf'],
        dcRights: 'CC-BY',
        dcPages: '100',
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle otherField', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypeGrottocenter: 'article',
        parents: [],
        otherField: [['462', ['0', '123'], ['t', 'Title']]],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle empty creators array', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: [],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle contributor', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcContributor: 'Contributor Name',
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle Unknown contributor', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcContributor: 'Unknown',
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle Unknown publisher', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcPublisher: 'Unknown',
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle identifiers', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcIdentifiers: [
          'isbn:123',
          'issn:456',
          'ean:789',
          'url:http://test.com',
        ],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle multiple descriptions', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcDescriptions: ['Desc1', 'Desc2'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle multiple sources', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcSources: ['Source1', 'Source2'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle null format in dcFormats', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcFormats: [null, 'pdf'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle identifier without value', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcIdentifiers: ['unknown:'],
        dcTypeGrottocenter: 'article',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle document type book', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypeGrottocenter: 'book',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });

    it('should handle document type issue', async () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypeGrottocenter: 'issue',
        parents: [],
      };
      const result = await Unimarc.transform(document);
      should.exist(result);
    });
  });
});
