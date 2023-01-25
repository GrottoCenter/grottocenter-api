\c grottoce;
-- v_massif_info definition
-- not populated, (WITH NO DATA), the schema only
CREATE MATERIALIZED VIEW v_massif_info AS
  SELECT m.id as id_massif,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(DISTINCT e.id) as nb_entrances
  FROM t_massif m
  JOIN t_entrance e ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
  JOIN t_cave c ON e.id_cave = c.id
  JOIN t_name n ON n.id_cave = c.id
  WHERE n.is_main = true
  AND c.is_deleted = false
  AND e.is_deleted = false
  AND m.is_deleted = false
  GROUP BY(m.id, c.id, n.name, c.depth, c.length, c.is_diving )
WITH NO DATA;
