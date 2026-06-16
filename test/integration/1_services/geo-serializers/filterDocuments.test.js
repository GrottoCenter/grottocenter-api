const should = require('should');
const {
  serializers,
  filterDocuments,
} = require('../../../../api/services/geo-serializers');

describe('geo-serializers/index', () => {
  describe('serializers registry', () => {
    it('should map geojson, kml, and gpx to serializer modules', () => {
      should(serializers).have.property('geojson');
      should(serializers).have.property('kml');
      should(serializers).have.property('gpx');
    });

    it('should expose contentType and fileExtension on each serializer', () => {
      should(serializers.geojson.contentType).equal('application/geo+json');
      should(serializers.geojson.fileExtension).equal('geojson');
      should(serializers.kml.contentType).equal(
        'application/vnd.google-earth.kml+xml'
      );
      should(serializers.kml.fileExtension).equal('kml');
      should(serializers.gpx.contentType).equal('application/gpx+xml');
      should(serializers.gpx.fileExtension).equal('gpx');
    });

    it('should not have unexpected format keys', () => {
      should(Object.keys(serializers)).deepEqual(['geojson', 'kml', 'gpx']);
    });
  });

  describe('filterDocuments', () => {
    it('should keep documents with valid coordinates and isSensitive false', () => {
      const docs = [
        { id: '1', latitude: 45.0, longitude: 2.0, isSensitive: false },
        { id: '2', latitude: -12.5, longitude: 130.7, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(2);
      should(result[0].id).equal('1');
      should(result[1].id).equal('2');
    });

    it('should remove documents with isSensitive === true', () => {
      const docs = [
        { id: '1', latitude: 45.0, longitude: 2.0, isSensitive: true },
        { id: '2', latitude: 10.0, longitude: 20.0, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(1);
      should(result[0].id).equal('2');
    });

    it('should remove documents with null latitude', () => {
      const docs = [
        { id: '1', latitude: null, longitude: 2.0, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should remove documents with undefined latitude', () => {
      const docs = [{ id: '1', longitude: 2.0, isSensitive: false }];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should remove documents with null longitude', () => {
      const docs = [
        { id: '1', latitude: 45.0, longitude: null, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should remove documents with undefined longitude', () => {
      const docs = [{ id: '1', latitude: 45.0, isSensitive: false }];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should remove sensitive documents with null coordinates without error (Req 10.5)', () => {
      const docs = [
        { id: '1', latitude: null, longitude: null, isSensitive: true },
        { id: '2', latitude: null, longitude: 2.0, isSensitive: true },
        { id: '3', latitude: 45.0, longitude: null, isSensitive: true },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should return an empty array when all entries are filtered (Req 10.4)', () => {
      const docs = [
        { id: '1', latitude: 45.0, longitude: 2.0, isSensitive: true },
        { id: '2', latitude: null, longitude: null, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(0);
    });

    it('should return an empty array for empty input', () => {
      const result = filterDocuments([]);
      should(result).have.length(0);
      should(result).be.an.Array();
    });

    it('should keep documents where isSensitive is not set (defaults to not sensitive)', () => {
      const docs = [{ id: '1', latitude: 45.0, longitude: 2.0 }];
      const result = filterDocuments(docs);
      should(result).have.length(1);
    });

    it('should keep documents where isSensitive is explicitly false', () => {
      const docs = [
        { id: '1', latitude: 45.0, longitude: 2.0, isSensitive: false },
      ];
      const result = filterDocuments(docs);
      should(result).have.length(1);
    });

    it('should preserve all document fields in the output', () => {
      const docs = [
        {
          id: '1',
          name: 'Test Cave',
          latitude: 45.0,
          longitude: 2.0,
          altitude: 500,
          isSensitive: false,
          country: 'FR',
        },
      ];
      const result = filterDocuments(docs);
      should(result[0]).deepEqual(docs[0]);
    });
  });
});
