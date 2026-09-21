const should = require('should');
const computeBoundingBoxAreaKm2 = require('../../../api/utils/computeBoundingBoxAreaKm2');

const EARTH_RADIUS_KM = 6371.0088;
const WHOLE_EARTH_KM2 = 4 * Math.PI * EARTH_RADIUS_KM * EARTH_RADIUS_KM;

const box = (swLat, swLng, neLat, neLng) => [
  { lat: swLat, lng: swLng },
  { lat: neLat, lng: neLng },
];

const areaOf = (...args) => computeBoundingBoxAreaKm2(...box(...args));

describe('computeBoundingBoxAreaKm2 - Unit Tests', () => {
  describe('agreement with PostGIS', () => {
    // Reference values from ST_Area(ST_MakeEnvelope(...)::geography) / 1e6 on
    // PostGIS 3.4.3. The spherical formula deviates from the WGS84 ellipsoid by
    // under 0.5%, so each is asserted within 1%.
    const withinOnePercent = (actual, expected) => {
      should(Math.abs(actual - expected) / expected).be.below(0.01);
    };

    it('should match PostGIS for one degree at the equator', () => {
      withinOnePercent(areaOf(0, 0, 1, 1), 12308.778);
    });

    it('should match PostGIS for a 2.5 x 2 degree box at 45N', () => {
      withinOnePercent(areaOf(45, 0, 47, 2.5), 43044.731);
    });

    it('should match PostGIS for a 1 x 10 degree band north of the equator', () => {
      withinOnePercent(areaOf(0, 0, 10, 1), 122486.265);
    });

    it('should match PostGIS for a zoom-12 tile at 45N', () => {
      withinOnePercent(areaOf(45, 6, 45.0878, 6.087890625), 67.566);
    });

    // ST_Area(::geography) cannot produce this one: whole-world bounds raise
    // "Antipodal (180 degrees long) edge detected!". The closed form is the
    // better oracle anyway, and it pins both constant and formula at once.
    it('should return the whole sphere for world bounds', () => {
      const area = areaOf(-90, -180, 90, 180);
      should(Math.abs(area - WHOLE_EARTH_KM2) / WHOLE_EARTH_KM2).be.below(
        0.0001
      );
    });
  });

  describe('the cap boundary', () => {
    it('should put a 2.0 x 2 degree box at 45N just under 35000 km²', () => {
      const area = areaOf(45, 0, 47, 2);
      should(area).be.below(35000);
      should(area).be.above(34000);
    });

    it('should put a 2.1 x 2 degree box at 45N just over 35000 km²', () => {
      const area = areaOf(45, 0, 47, 2.1);
      should(area).be.above(35000);
      should(area).be.below(37000);
    });
  });

  describe('bounds that ST_MakeEnvelope normalises', () => {
    // The decisive case. ST_MakeEnvelope(170,-10,-170,10,4326) is
    // POLYGON((170 -10,170 10,-170 10,-170 -10,170 -10)) and ST_Within accepts
    // POINT(0 0) while rejecting POINT(175 0): a 340 degree wide box, not a 20
    // degree strip across the antimeridian. Reporting the narrow reading would
    // understate the most expensive requests the endpoint receives by 17x.
    it('should treat inverted longitudes as the wide complement', () => {
      const area = areaOf(-10, 170, 10, -170);
      should(area).be.above(8e7);
      should(area).be.below(9e7);
      should(area).equal(areaOf(-10, -170, 10, 170));
    });

    it('should treat inverted latitudes as the normalised band', () => {
      should(areaOf(10, 0, 0, 1)).equal(areaOf(0, 0, 10, 1));
    });

    it('should be independent of which corner is passed first', () => {
      const [sw, ne] = box(45, 0, 47, 2);
      should(computeBoundingBoxAreaKm2(sw, ne)).equal(
        computeBoundingBoxAreaKm2(ne, sw)
      );
    });
  });

  describe('degenerate and polar boxes', () => {
    // 360 degrees of longitude over 0.009 of latitude. This is the box
    // computeBoundingBox emits in the web app when the centre sits on a pole,
    // where it gives up on cos(lat) and covers every longitude. It is 6.5
    // degrees² but only a few km², and 35000 km² is about 2.8 degrees² at the
    // equator — so a cap expressed in degrees² would reject a request that
    // barely touches the planet.
    it('should give a polar full-longitude box a negligible area', () => {
      const area = areaOf(89.99102, -180, 90, 180);
      should(area).be.above(0);
      should(area).be.below(35000);
    });

    it('should return zero when both corners coincide', () => {
      should(areaOf(45, 3, 45, 3)).equal(0);
    });

    it('should return zero for a box with no latitude span', () => {
      should(areaOf(45, 0, 45, 10)).equal(0);
    });
  });

  describe('coercion of query parameter values', () => {
    it('should treat numeric strings exactly like numbers', () => {
      should(areaOf('45', '0', '47', '2')).equal(areaOf(45, 0, 47, 2));
    });

    it('should return NaN when a coordinate is not a number', () => {
      should(areaOf('abc', 0, 47, 2)).be.NaN();
      should(areaOf(45, 0, 47, 'xyz')).be.NaN();
    });

    it('should return NaN for infinite or overflowing coordinates', () => {
      should(areaOf(Infinity, 0, 47, 2)).be.NaN();
      should(areaOf(45, 0, 47, '1e400')).be.NaN();
      should(areaOf(45, 0, 47, undefined)).be.NaN();
    });

    // Pre-existing behaviour of the geoloc endpoints, asserted so that it
    // changes deliberately rather than by accident: req.param returns '' for a
    // parameter that is present but empty, and both Number('') and Number(null)
    // are 0. Neither reaches this helper in practice, because
    // checkAndGetCoordinatesParams rejects missing coordinates with a 400
    // first — and treating them as 0 only ever shrinks the computed box, so it
    // cannot open a hole in the cap.
    it('should coerce an empty string and null to zero rather than NaN', () => {
      should(areaOf(45, 0, 47, '')).equal(areaOf(45, 0, 47, 0));
      should(areaOf(45, 0, 47, null)).equal(areaOf(45, 0, 47, 0));
    });
  });
});
