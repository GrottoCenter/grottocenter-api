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

    describe('landing page and licence links', () => {
      const base = {
        id: 7,
        lastUpdate: new Date('2024-01-01'),
        dcTitle: 'Test',
      };
      const fieldsOf = (result, tag) =>
        result.getRecord().fields.filter((f) => f.tag === tag);
      const sub = (field, code) =>
        field.subfields.find((s) => s.code === code)?.value;

      it('should add the landing page in 856 $u with $y Grottocenter', () => {
        const result = Marc21.transform({
          ...base,
          landingPageUrl: 'https://grottocenter.org/ui/documents/7',
        });
        const [field] = fieldsOf(result, '856');
        should.exist(field);
        should(sub(field, 'u')).equal(
          'https://grottocenter.org/ui/documents/7'
        );
        should(sub(field, 'y')).equal('Grottocenter');
      });

      it('should add the licence name and URL in one 540', () => {
        const result = Marc21.transform({
          ...base,
          dcRights: ['CC-BY'],
          dcLicenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        });
        const fields = fieldsOf(result, '540');
        fields.should.have.length(1);
        should(sub(fields[0], 'a')).equal('Licence: CC-BY');
        should(sub(fields[0], 'u')).equal(
          'https://creativecommons.org/licenses/by/3.0/'
        );
      });

      it('should ignore an empty licence name and keep the URL', () => {
        const result = Marc21.transform({
          ...base,
          dcRights: [null],
          dcLicenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        });
        const fields = fieldsOf(result, '540');
        fields.should.have.length(1);
        should(sub(fields[0], 'a')).be.undefined();
        should(sub(fields[0], 'u')).equal(
          'https://creativecommons.org/licenses/by/3.0/'
        );
      });

      it('should add neither field when the links are missing', () => {
        const result = Marc21.transform(base);
        fieldsOf(result, '856').should.have.length(0);
        fieldsOf(result, '540').should.have.length(0);
      });
    });
  });
});
