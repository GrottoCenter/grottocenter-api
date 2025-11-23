const should = require('should');

describe('DocumentCSVImportService', () => {
  let DocumentCSVImportService;

  before(() => {
    // eslint-disable-next-line global-require
    DocumentCSVImportService = require('../../../api/services/DocumentCSVImportService');
  });

  describe('getConvertedDescriptionFromCsv', () => {
    it('should convert basic description data', async () => {
      const data = {
        'rdfs:label': 'Test Title',
        'karstlink:hasDescriptionDocument/dct:description': 'Test body',
        'dc:language': 'EN',
        'dct:rights/dct:created': '2024-01-01',
      };
      const result =
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(data, 1);
      should(result.author).equal(1);
      should(result.title).equal('Test Title');
      should(result.body).equal('Test body');
    });

    it('should handle missing optional fields', async () => {
      const data = {
        'rdfs:label': 'Test Title',
      };
      const result =
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(data, 1);
      should(result.author).equal(1);
      should(result.title).equal('Test Title');
    });

    it('should use description language over dc:language', async () => {
      const data = {
        'rdfs:label': 'Test',
        'karstlink:hasDescriptionDocument/dc:language': 'FR',
        'dc:language': 'EN',
      };
      const result =
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(data, 1);
      should.exist(result.language);
    });

    it('should handle 2-letter language codes', async () => {
      const data = {
        'rdfs:label': 'Test',
        'dc:language': 'fr',
      };
      const result =
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(data, 1);
      should.exist(result.language);
    });
  });

  describe('getConvertedDocumentFromCsv', () => {
    it('should throw error for invalid license', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'invalid-license',
        'dct:creator': 'Test Author',
      };
      try {
        await DocumentCSVImportService.getConvertedDocumentFromCsv(
          req,
          data,
          1
        );
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).containEql('license');
      }
    });

    it('should throw error for invalid document type', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY-NC-ND',
        'dct:creator': 'Test Author',
        'karstlink:documentType': 'InvalidType',
      };
      try {
        await DocumentCSVImportService.getConvertedDocumentFromCsv(
          req,
          data,
          1
        );
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).containEql('document type');
      }
    });

    it('should throw error for non-existent parent document', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY-NC-ND',
        'dct:creator': 'Test Author',
        'dct:isPartOf': 999999,
      };
      try {
        await DocumentCSVImportService.getConvertedDocumentFromCsv(
          req,
          data,
          1
        );
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).containEql('parent');
      }
    });

    it('should convert document with valid license', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY-NC-ND',
        'dct:creator': 'Test Author',
        id: '123',
        'dct:rights/cc:attributionName': 'Test DB',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.author).equal(1);
      should(result.idDbImport).equal('123');
      should(result.nameDbImport).equal('Test DB');
      should.exist(result.license);
    });

    it('should handle multiple creators separated by pipe', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY-SA',
        'dct:creator': 'Author1|Author2',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.authors).be.an.Array();
    });

    it('should handle language code conversion', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test Author',
        'dc:language': 'fr',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.languages).be.an.Array();
    });

    it('should handle country code conversion', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'ODBL',
        'dct:creator': 'Test Author',
        'gn:countryCode': 'fr',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.countries).be.an.Array();
    });

    it('should handle subjects separated by pipe', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'ODC-BY',
        'dct:creator': 'Test Author',
        'dct:subject': 'subject1|subject2|subject3',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.subjects).be.an.Array();
      should(result.subjects.length).equal(3);
    });

    it('should handle empty creators', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY-SA',
        'dct:creator': '',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.authors).be.an.Array();
      should(result.authors.length).equal(0);
    });
    it('should handle identifier type trimming and lowercase', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test Author',
        'dct:identifier': '  ISBN  ',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.identifierType).equal('isbn');
    });

    it('should handle document type by URL', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test',
        'karstlink:documentType':
          'https://ontology.uis-speleo.org/ontology/#topography',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should.exist(result.type);
    });

    it('should handle valid parent document', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test',
        'dct:isPartOf': 1,
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.parent).equal(1);
    });

    it('should handle datePublication', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test',
        'dct:date': '2024-01-01',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.datePublication).equal('2024-01-01');
    });

    it('should handle identifier and source', async () => {
      const req = {};
      const data = {
        'dct:rights/karstlink:licenseType': 'CC-BY',
        'dct:creator': 'Test',
        'dct:source': 'http://example.com',
        'dct:identifier': 'doi',
      };
      const result = await DocumentCSVImportService.getConvertedDocumentFromCsv(
        req,
        data,
        1
      );
      should(result.identifier).equal('http://example.com');
      should(result.identifierType).equal('doi');
    });
  });

  describe('getConvertedDescriptionFromCsv', () => {
    it('should handle dateReviewed from modified date', async () => {
      const data = {
        'rdfs:label': 'Test',
        'dct:rights/dct:modified': '2024-06-01',
      };
      const result =
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(data, 1);
      should.exist(result.dateReviewed);
    });
  });
});
