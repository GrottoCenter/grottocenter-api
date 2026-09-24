\c grottoce;

-- Create v_region_info materialized view for region statistics
--
-- Superseded: sql/91_materialized_views.sql drops and recreates this view, and
-- sorts after this file, so that definition is the one a built database holds.
-- The join below is kept in step with it so this file is not copied as a model
-- for spatial joins — ST_Contains alone cannot use an index, and building the
-- point with ST_MakePoint instead of the indexed point_geom column rules out
-- the GiST index on t_entrance as well. See #1811.
CREATE MATERIALIZED VIEW v_region_info AS
  SELECT e.iso_3166_2 as id_region,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(e.id) as nb_entrances,
  m.id as id_massif
  FROM t_entrance e
  LEFT JOIN t_cave c ON e.id_cave = c.id AND c.is_deleted = false
  LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
  LEFT JOIN t_massif m ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND m.is_deleted = false
  WHERE e.is_deleted = false
  AND e.iso_3166_2 IS NOT NULL
  GROUP BY(e.iso_3166_2, c.id, n.name, c.depth, c.length, c.is_diving, m.id)
  WITH DATA;

-- Add index for better performance
CREATE UNIQUE INDEX ON v_region_info(id_massif, id_cave, id_region);