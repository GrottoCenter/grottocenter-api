const should = require('should');

describe('EntranceCSVImportService', () => {
  let EntranceCSVImportService;

  before(() => {
    // eslint-disable-next-line global-require
    EntranceCSVImportService = require('../../../api/services/EntranceCSVImportService');
  });
  describe('getConvertedNameAndDescCaveFromCsv', () => {
    it('should convert basic cave name data', () => {
      const rawData = {
        'rdfs:label': 'Test Cave',
        'rdfs:label/dc:language': 'EN',
        'dct:rights/dct:created': '2024-01-01',
      };
      const result =
        EntranceCSVImportService.getConvertedNameAndDescCaveFromCsv(rawData, 1);
      should(result.author).equal(1);
      should(result.name).equal('Test Cave');
      should(result.language).equal('en');
    });

    it('should handle missing optional fields', () => {
      const rawData = {
        'rdfs:label': 'Test Cave',
      };
      const result =
        EntranceCSVImportService.getConvertedNameAndDescCaveFromCsv(rawData, 1);
      should(result.author).equal(1);
      should(result.name).equal('Test Cave');
    });
  });

  describe('getConvertedCaveFromCsv', () => {
    it('should convert cave data with vertical extend', () => {
      const rawData = {
        'w3geo:latitude': 45.5,
        'w3geo:longitude': 6.5,
        'karstlink:length': 100,
        'karstlink:verticalExtend': 50,
      };
      const result = EntranceCSVImportService.getConvertedCaveFromCsv(
        rawData,
        1
      );
      should(result.author).equal(1);
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
      should(result.length).equal(100);
      should(result.depth).equal(50);
    });

    it('should calculate depth from above and below entrance', () => {
      const rawData = {
        'w3geo:latitude': 45.5,
        'w3geo:longitude': 6.5,
        'karstlink:extendBelowEntrance': '30',
        'karstlink:extendAboveEntrance': '20',
      };
      const result = EntranceCSVImportService.getConvertedCaveFromCsv(
        rawData,
        1
      );
      should(result.depth).equal(50);
    });

    it('should handle missing depth data', () => {
      const rawData = {
        'w3geo:latitude': 45.5,
        'w3geo:longitude': 6.5,
      };
      const result = EntranceCSVImportService.getConvertedCaveFromCsv(
        rawData,
        1
      );
      should(result.depth).equal(0);
    });
  });

  describe('getConvertedNameDescLocEntranceFromCsv', () => {
    it('should convert entrance with description', async () => {
      const rawData = {
        'karstlink:hasDescriptionDocument/dct:title': 'Test Description',
        'karstlink:hasDescriptionDocument/dct:description': 'Description body',
        'karstlink:hasDescriptionDocument/dc:language': 'EN',
      };
      const result =
        await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
          rawData,
          1
        );
      should(result.description).be.an.Object();
      should(result.description.title).equal('Test Description');
      should(result.description.body).equal('Description body');
      should(result.description.language).equal('en');
    });

    it('should convert entrance with name', async () => {
      const rawData = {
        'rdfs:label': 'Test Entrance',
        'rdfs:label/dc:language': 'FR',
      };
      const result =
        await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
          rawData,
          1
        );
      should(result.name).be.an.Object();
      should(result.name.text).equal('Test Entrance');
      should(result.name.language).equal('fr');
    });

    it('should convert entrance with location', async () => {
      const rawData = {
        'karstlink:hasAccessDocument/dct:description': 'Access description',
        'karstlink:hasAccessDocument/dc:language': 'EN',
      };
      const result =
        await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
          rawData,
          1
        );
      should(result.location).be.an.Object();
      should(result.location.body).equal('Access description');
      should(result.location.language).equal('en');
    });

    it('should return empty object when no data', async () => {
      const rawData = {};
      const result =
        await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
          rawData,
          1
        );
      should(result).be.an.Object();
      should(Object.keys(result).length).equal(0);
    });
  });

  describe('getConvertedEntranceFromCsv', () => {
    it('should convert entrance data', () => {
      const rawData = {
        'gn:countryCode': 'FR',
        'dwc:coordinatePrecision': 10,
        'w3geo:altitude': 1500,
        id: '123',
        'dct:rights/cc:attributionName': 'Test DB',
      };
      const cave = { id: 1, latitude: 45.5, longitude: 6.5 };
      const result = EntranceCSVImportService.getConvertedEntranceFromCsv(
        rawData,
        1,
        cave
      );
      should(result.author).equal(1);
      should(result.country).equal('FR');
      should(result.precision).equal(10);
      should(result.altitude).equal(1500);
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
      should(result.cave).equal(1);
      should(result.isOfInterest).equal(false);
      should(result.geology).equal('Q35758');
      should(result.idDbImport).equal('123');
      should(result.nameDbImport).equal('Test DB');
    });

    it('should handle minimal entrance data', () => {
      const rawData = {};
      const cave = { id: 1, latitude: 45.5, longitude: 6.5 };
      const result = EntranceCSVImportService.getConvertedEntranceFromCsv(
        rawData,
        1,
        cave
      );
      should(result.author).equal(1);
      should(result.cave).equal(1);
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
    });
  });
});
