\c grottoce;

-- Create v_region_info materialized view for region statistics
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
  LEFT JOIN t_massif m ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
  AND m.is_deleted = false
  WHERE e.is_deleted = false
  AND e.iso_3166_2 IS NOT NULL
  GROUP BY(e.iso_3166_2, c.id, n.name, c.depth, c.length, c.is_diving, m.id)
  WITH DATA;

-- Add index for better performance
CREATE UNIQUE INDEX ON v_region_info(id_massif, id_cave, id_region);