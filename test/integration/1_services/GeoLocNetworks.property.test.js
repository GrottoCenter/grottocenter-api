const should = require('should');
const fc = require('fast-check');
const { formatNetworks } = require('../../../api/services/GeoLocService');

/**
 * Arbitrary: generate a set of flat rows as would come from the SQL query.
 * Each network has 2+ entrances with unique IDs (matching SQL primary key
 * guarantee). The centroid (longitude/latitude) is the average of entrance
 * coordinates — replicated here to match the window function.
 */
const networkRowsArbitrary = fc
  .array(
    fc.record({
      caveName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
        nil: undefined,
      }),
      entrances: fc.uniqueArray(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
            nil: null,
          }),
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        }),
        { minLength: 2, maxLength: 10, selector: (e) => e.id }
      ),
    }),
    { minLength: 1, maxLength: 5 }
  )
  .map((networks) => {
    const rows = [];
    networks.forEach((net, idx) => {
      const caveId = idx + 1; // unique cave IDs
      const avgLat =
        net.entrances.reduce((s, e) => s + e.latitude, 0) /
        net.entrances.length;
      const avgLng =
        net.entrances.reduce((s, e) => s + e.longitude, 0) /
        net.entrances.length;
      const name = net.caveName || `Network ${caveId}`;
      for (const ent of net.entrances) {
        rows.push({
          id: caveId,
          name,
          longitude: avgLng,
          latitude: avgLat,
          entrance_id: ent.id,
          entrance_name: ent.name,
          entrance_longitude: ent.longitude,
          entrance_latitude: ent.latitude,
        });
      }
    });
    return rows;
  });

describe('GeoLocService formatNetworks - Property Tests', () => {
  describe('Property 1: every network has more than one entrance', () => {
    it('should produce networks each with at least 2 entrances', () => {
      fc.assert(
        fc.property(networkRowsArbitrary, (rows) => {
          const networks = formatNetworks(rows);
          for (const network of networks) {
            should(network.entrances.length).be.greaterThan(1);
          }
        }),
        { numRuns: 100 }
      );
    }).timeout(10000);
  });

  describe('Property 2: centroid equals arithmetic mean of entrance coordinates', () => {
    it('should have centroid matching average of entrance lat/lng', () => {
      fc.assert(
        fc.property(networkRowsArbitrary, (rows) => {
          const networks = formatNetworks(rows);
          for (const network of networks) {
            const expectedLat =
              network.entrances.reduce((s, e) => s + e.latitude, 0) /
              network.entrances.length;
            const expectedLng =
              network.entrances.reduce((s, e) => s + e.longitude, 0) /
              network.entrances.length;
            should(network.latitude).be.approximately(expectedLat, 1e-10);
            should(network.longitude).be.approximately(expectedLng, 1e-10);
          }
        }),
        { numRuns: 100 }
      );
    }).timeout(10000);
  });

  describe('Property 6: backwards-compatible output shape', () => {
    it('should always include id, name, longitude, latitude, entrances', () => {
      fc.assert(
        fc.property(networkRowsArbitrary, (rows) => {
          const networks = formatNetworks(rows);
          for (const network of networks) {
            should(network).have.property('id');
            should(network).have.property('name');
            should(network).have.property('longitude');
            should(network).have.property('latitude');
            should(network).have.property('entrances');
            should(network.entrances).be.an.Array();
            for (const entrance of network.entrances) {
              should(entrance).have.property('id');
              should(entrance).have.properties('name', 'latitude', 'longitude');
            }
          }
        }),
        { numRuns: 100 }
      );
    }).timeout(10000);
  });
});
