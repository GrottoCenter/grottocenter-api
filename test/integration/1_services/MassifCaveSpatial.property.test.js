const should = require('should');
const CommonService = require('../../../api/services/CommonService');

// Feature: db-access-patterns-optimization
// Property 2: Massif spatial containment equivalence via entrance point_geom
// Property 3: Cave-to-massif reverse lookup equivalence via entrance point_geom

const OLD_CAVES_IN_MASSIF = `
  SELECT c.id
  FROM t_cave AS c
  JOIN t_massif AS m
  ON ST_Contains(
    ST_SetSRID(m.geog_polygon::geometry, 4326),
    ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)
  )
  WHERE m.id = $1 AND c.is_deleted = false
  ORDER BY c.id
`;

const NEW_CAVES_IN_MASSIF = `
  SELECT DISTINCT c.id
  FROM t_cave AS c
  JOIN t_entrance AS e ON e.id_cave = c.id
  JOIN t_massif AS m ON m.id = $1
  WHERE ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND c.is_deleted = false AND e.is_deleted = false
  ORDER BY c.id
`;

const OLD_MASSIFS_FOR_CAVE = `
  SELECT m.id
  FROM t_massif AS m
  JOIN t_cave AS c
  ON ST_Contains(
    ST_SetSRID(m.geog_polygon::geometry, 4326),
    ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)
  )
  WHERE c.id = $1
  ORDER BY m.id
`;

const NEW_MASSIFS_FOR_CAVE = `
  SELECT DISTINCT m.id
  FROM t_massif AS m
  JOIN t_entrance AS e ON ST_Contains(m.geog_polygon::geometry, e.point_geom)
  WHERE e.id_cave = $1
  AND e.is_deleted = false AND m.is_deleted = false
  ORDER BY m.id
`;

/**
 * Property 2: Massif spatial containment equivalence via entrance point_geom.
 * Encodes: querying caves via entrance point_geom returns the same cave IDs
 * as querying via ST_MakePoint(cave.longitude, cave.latitude).
 * Covers: all massifs with non-null geog_polygon in the fixture data.
 */
describe('MassifCaveSpatial - Property 2: caves-in-massif equivalence', () => {
  it('should return same cave IDs via entrance point_geom as via cave coords', async () => {
    const massifs = await TMassif.find({ where: { isDeleted: false } });
    const withPolygon = massifs.filter((m) => m.geogPolygon);

    const results = await Promise.all(
      withPolygon.map((massif) =>
        Promise.all([
          CommonService.query(OLD_CAVES_IN_MASSIF, [massif.id]),
          CommonService.query(NEW_CAVES_IN_MASSIF, [massif.id]),
        ]).then(([oldResult, newResult]) => ({
          massifId: massif.id,
          oldIds: oldResult.rows.map((r) => r.id),
          newIds: newResult.rows.map((r) => r.id),
        }))
      )
    );

    results.forEach(({ massifId, oldIds, newIds }) => {
      should(newIds).deepEqual(oldIds, `Mismatch for massif ${massifId}`);
    });
  });
});

/**
 * Property 3: Cave-to-massif reverse lookup equivalence via entrance point_geom.
 * Encodes: looking up massifs for a cave via entrance point_geom returns the
 * same massif IDs as via ST_MakePoint(cave.longitude, cave.latitude).
 * Covers: all caves with at least one entrance in the fixture data.
 */
describe('MassifCaveSpatial - Property 3: massifs-for-cave equivalence', () => {
  it('should return same massif IDs via entrance point_geom as via cave coords', async () => {
    const caves = await TCave.find({ where: { isDeleted: false } });

    const results = await Promise.all(
      caves.map((cave) =>
        Promise.all([
          CommonService.query(OLD_MASSIFS_FOR_CAVE, [cave.id]),
          CommonService.query(NEW_MASSIFS_FOR_CAVE, [cave.id]),
        ]).then(([oldResult, newResult]) => ({
          caveId: cave.id,
          oldIds: oldResult.rows.map((r) => r.id),
          newIds: newResult.rows.map((r) => r.id),
        }))
      )
    );

    results.forEach(({ caveId, oldIds, newIds }) => {
      should(newIds).deepEqual(oldIds, `Mismatch for cave ${caveId}`);
    });
  });
});
