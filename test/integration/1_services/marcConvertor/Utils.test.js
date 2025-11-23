const should = require('should');
const Utils = require('../../../../api/services/marcConvertor/Utils');

describe('marcConvertor/Utils', () => {
  describe('extractIdentifier', () => {
    it('should extract identifier by type', () => {
      const identifiers = [
        'isbn:123456',
        'issn:789012',
        'url:http://example.com',
      ];
      should(Utils.extractIdentifier(identifiers, 'isbn')).equal('123456');
      should(Utils.extractIdentifier(identifiers, 'issn')).equal('789012');
      should(Utils.extractIdentifier(identifiers, 'url')).equal(
        'http://example.com'
      );
    });

    it('should return null if identifier not found', () => {
      const identifiers = ['isbn:123456'];
      should(Utils.extractIdentifier(identifiers, 'doi')).be.null();
    });

    it('should return null if identifiers is null', () => {
      should(Utils.extractIdentifier(null, 'isbn')).be.null();
    });

    it('should return null if identifiers is not an array', () => {
      should(Utils.extractIdentifier('not-array', 'isbn')).be.null();
    });
  });

  describe('formatDateForMarc', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-03-15T10:30:45');
      const formatted = Utils.formatDateForMarc(date);
      should(formatted).match(/^20240315\d{6}\.0$/);
    });

    it('should handle string date', () => {
      const formatted = Utils.formatDateForMarc('2024-01-01T00:00:00');
      should(formatted).match(/^20240101\d{6}\.0$/);
    });
  });

  describe('getFileFormat', () => {
    it('should return correct format for pdf', () => {
      should(Utils.getFileFormat('document.pdf')).equal('application/pdf');
    });

    it('should return correct format for xml', () => {
      should(Utils.getFileFormat('data.xml')).equal('application/xml');
    });

    it('should return correct format for doc', () => {
      should(Utils.getFileFormat('file.doc')).equal('application/msword');
    });

    it('should return correct format for docx', () => {
      should(Utils.getFileFormat('file.docx')).equal(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should return null for unknown format', () => {
      should(Utils.getFileFormat('file.unknown')).be.null();
    });

    it('should handle uppercase extensions', () => {
      should(Utils.getFileFormat('document.PDF')).equal('application/pdf');
    });
  });

  describe('getCurrentDateYYYYMMDD', () => {
    it('should return date in YYYYMMDD format', () => {
      const result = Utils.getCurrentDateYYYYMMDD();
      should(result).match(/^\d{8}$/);
    });
  });

  describe('determineIsoCode3166', () => {
    it('should return 1 for 3-letter codes', () => {
      should(Utils.determineIsoCode3166('USA')).equal(1);
      should(Utils.determineIsoCode3166('FRA')).equal(1);
    });

    it('should return 2 for codes longer than 3', () => {
      should(Utils.determineIsoCode3166('US-CA')).equal(2);
      should(Utils.determineIsoCode3166('FR-75')).equal(2);
    });

    it('should return 0 for codes shorter than 3', () => {
      should(Utils.determineIsoCode3166('US')).equal(0);
      should(Utils.determineIsoCode3166('FR')).equal(0);
    });
  });

  describe('determineBibliographicLevel', () => {
    it('should return s for collection', () => {
      should(Utils.determineBibliographicLevel('collection')).equal('s');
      should(Utils.determineBibliographicLevel('COLLECTION')).equal('s');
    });

    it('should return a for article', () => {
      should(Utils.determineBibliographicLevel('article')).equal('a');
      should(Utils.determineBibliographicLevel('ARTICLE')).equal('a');
    });

    it('should return m for other types', () => {
      should(Utils.determineBibliographicLevel('book')).equal('m');
      should(Utils.determineBibliographicLevel('report')).equal('m');
      should(Utils.determineBibliographicLevel('unknown')).equal('m');
    });
  });

  describe('determineTypeDocument', () => {
    it('should return a for text types', () => {
      should(Utils.determineTypeDocument(['text'])).equal('a');
      should(Utils.determineTypeDocument(['article'])).equal('a');
      should(Utils.determineTypeDocument(['book'])).equal('a');
      should(Utils.determineTypeDocument(['report'])).equal('a');
    });

    it('should return e for map types', () => {
      should(Utils.determineTypeDocument(['map'])).equal('e');
      should(Utils.determineTypeDocument(['topographic drawing'])).equal('e');
      should(Utils.determineTypeDocument(['topographic data'])).equal('e');
    });

    it('should return g for moving image', () => {
      should(Utils.determineTypeDocument(['moving image'])).equal('g');
    });

    it('should return i for sound', () => {
      should(Utils.determineTypeDocument(['sound'])).equal('i');
    });

    it('should return k for image', () => {
      should(Utils.determineTypeDocument(['image'])).equal('k');
    });

    it('should return l for interactive resource', () => {
      should(Utils.determineTypeDocument(['interactive resource'])).equal('l');
      should(Utils.determineTypeDocument(['dataset'])).equal('l');
    });

    it('should return m for collection types', () => {
      should(Utils.determineTypeDocument(['collection'])).equal('m');
      should(Utils.determineTypeDocument(['issue'])).equal('m');
      should(Utils.determineTypeDocument(['physical object'])).equal('m');
      should(Utils.determineTypeDocument(['authorization to publish'])).equal(
        'm'
      );
    });

    it('should return a for unknown types', () => {
      should(Utils.determineTypeDocument(['unknown'])).equal('a');
    });

    it('should return null for null types', () => {
      should(Utils.determineTypeDocument(null)).be.null();
    });

    it('should return null for empty array', () => {
      should(Utils.determineTypeDocument([])).be.null();
    });

    it('should return null for non-array', () => {
      should(Utils.determineTypeDocument('not-array')).be.null();
    });

    it('should handle uppercase types', () => {
      should(Utils.determineTypeDocument(['TEXT'])).equal('a');
      should(Utils.determineTypeDocument(['MAP'])).equal('e');
    });
  });

  describe('getTypeWithListSets', () => {
    it('should extract type from listSets', () => {
      const listSets = ['set1', 'grottocenter:article'];
      should(Utils.getTypeWithListSets(listSets)).equal('article');
    });

    it('should return null if listSets is null', () => {
      should(Utils.getTypeWithListSets(null)).be.null();
    });

    it('should return null if listSets is not an array', () => {
      should(Utils.getTypeWithListSets('not-array')).be.null();
    });

    it('should return null if listSets has 1 or fewer elements', () => {
      should(Utils.getTypeWithListSets(['set1'])).be.null();
      should(Utils.getTypeWithListSets([])).be.null();
    });

    it('should handle uppercase in listSets', () => {
      const listSets = ['set1', 'grottocenter:ARTICLE'];
      should(Utils.getTypeWithListSets(listSets)).equal('article');
    });
  });
});
