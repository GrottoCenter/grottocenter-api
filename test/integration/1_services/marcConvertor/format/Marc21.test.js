/* eslint-disable global-require */
const should = require('should');

describe('marcConvertor/format/Marc21', () => {
  let Marc21;

  before(() => {
    Marc21 = require('../../../../../api/services/marcConvertor/format/Marc21');
  });

  describe('transform', () => {
    it('should transform basic document', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test Document',
        dcCreators: ['Author1'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
      should.exist(result.record);
    });

    it('should handle document with multiple creators', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: ['Author1', 'Author2', 'Author3'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle Unknown creator', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: ['Unknown'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle publisher and date', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcPublisher: 'Publisher',
        dcDate: new Date('2024-01-01'),
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle languages', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcLanguages: ['eng', 'fra'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle identifiers', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcIdentifiers: [
          'isbn:123456',
          'issn:789',
          'ean:111',
          'url:http://test.com',
        ],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle all optional fields', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcDescriptions: ['Description 1'],
        dcCoverages: ['FRA', 'Coverage'],
        dcSubjects: ['Subject1'],
        dcFormats: ['application/pdf'],
        dcRelations: ['Relation1'],
        dcRights: ['CC-BY'],
        dcTypeGrottocenter: 'article',
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle document type article', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypes: ['article'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle document type book', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypes: ['book'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle document type issue', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcTypes: ['issue'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle empty creators array', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcCreators: [],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle contributor', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcContributor: 'Contributor Name',
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle Unknown contributor', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcContributor: 'Unknown',
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle Unknown publisher', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcPublisher: 'Unknown',
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle title with Responsability', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        Responsability: 'Test Responsibility',
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle multiple descriptions', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcDescriptions: ['Desc1', 'Desc2'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle null format in dcFormats', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcFormats: [null, 'pdf'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });

    it('should handle identifier without value', () => {
      const document = {
        id: 1,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
        dcIdentifiers: ['unknown:'],
      };
      const result = Marc21.transform(document);
      should.exist(result);
    });
  });
});
