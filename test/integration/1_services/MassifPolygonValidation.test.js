const should = require('should');
const MassifService = require('../../../api/services/MassifService');

describe('MassifService', () => {
  describe('matchPolygonError', () => {
    it('should map self-intersection errors', () => {
      const err = MassifService.matchPolygonError('Self-intersection[0.5 0.5]');
      should(err.code).equal('POLYGON_SELF_INTERSECTION');
      should(err.message).match(/edges cross each other/);
    });

    it('should map too few points errors', () => {
      const err = MassifService.matchPolygonError(
        'Too few points in geometry component[0 0]'
      );
      should(err.code).equal('POLYGON_TOO_FEW_POINTS');
      should(err.message).match(/not have enough points/);
    });

    it('should map hole lies outside shell errors', () => {
      const err = MassifService.matchPolygonError(
        'Hole lies outside shell[1 1]'
      );
      should(err.code).equal('POLYGON_HOLE_OUTSIDE');
      should(err.message).match(/hole is located outside/);
    });

    it('should map nested holes errors', () => {
      const err = MassifService.matchPolygonError('Nested holes[2 2]');
      should(err.code).equal('POLYGON_NESTED_HOLES');
      should(err.message).match(/holes within holes/);
    });

    it('should map disconnected interior errors', () => {
      const err = MassifService.matchPolygonError('Disconnected interior');
      should(err.code).equal('POLYGON_DISCONNECTED');
      should(err.message).match(/split into disconnected parts/);
    });

    it('should map duplicate rings errors', () => {
      const err = MassifService.matchPolygonError('Duplicate Rings[0 0]');
      should(err.code).equal('POLYGON_DUPLICATE_RINGS');
      should(err.message).match(/duplicate rings/);
    });

    it('should map lwgeom_area_spher errors', () => {
      const err = MassifService.matchPolygonError(
        'lwgeom_area_spher(oid) returned area < 0.0'
      );
      should(err.code).equal('POLYGON_INVALID_WINDING');
      should(err.message).match(/invalid winding order/);
    });

    it('should map antipodal edge errors', () => {
      const err = MassifService.matchPolygonError(
        'Antipodal (180 degrees long) edge detected!'
      );
      should(err.code).equal('POLYGON_ANTIPODAL_EDGE');
      should(err.message).match(/spans exactly 180/);
    });

    it('should map crosses equator errors', () => {
      const err = MassifService.matchPolygonError(
        'ptarray_area_spheroid: cannot handle ptarray that crosses equator'
      );
      should(err.code).equal('POLYGON_CROSSES_EQUATOR');
      should(err.message).match(/crosses the equator/);
    });

    it('should return fallback for unknown errors', () => {
      const err = MassifService.matchPolygonError('some unknown PostGIS error');
      should(err.code).equal('POLYGON_INVALID');
      should(err.message).match(/could not be processed/);
    });
  });
});
