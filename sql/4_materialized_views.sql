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

-- v_country_info definition
-- not populated, (WITH NO DATA), the schema only
CREATE MATERIALIZED VIEW v_country_info AS
  SELECT e.id_country as id_country,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(e.id) as nb_entrances,
  m.id as id_massif
  FROM t_entrance e
  LEFT JOIN t_cave c ON e.id_cave = c.id
  LEFT JOIN t_name n ON n.id_cave = c.id
  LEFT JOIN t_massif m ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
  AND n.is_main = true
  AND c.is_deleted = false
  AND m.is_deleted = false
  AND e.is_deleted = false
  GROUP BY(e.id_country, c.id, n.name, c.depth, c.length, c.is_diving, m.id)
  WITH NO DATA;

-- v_data_quality_compute_entrance definition
-- not populated, (WITH NO DATA), the schema only
CREATE MATERIALIZED VIEW v_data_quality_compute_entrance AS

  SELECT e.id as id_entrance,
  GREATEST(e.date_inscription, e.date_reviewed) as general_latest_date_of_update,
  (COUNT(DISTINCT e.date_inscription)+ COUNT(DISTINCT e.date_reviewed)) as general_nb_contributions,

  GREATEST(MAX(l.date_inscription), MAX(l.date_reviewed)) as location_latest_date_of_update,
  (COUNT(DISTINCT l.date_inscription)+ COUNT(DISTINCT l.date_reviewed)) as location_nb_contributions,

  GREATEST(MAX(d.date_inscription), MAX(d.date_reviewed)) as description_latest_date_of_update,
  (COUNT(DISTINCT d.date_inscription)+ COUNT(DISTINCT d.date_reviewed)) as description_nb_contributions,

  GREATEST(MAX(doc.date_inscription), MAX(doc.date_reviewed)) as document_latest_date_of_update,
  (COUNT(DISTINCT doc.date_inscription)+ COUNT(DISTINCT doc.date_reviewed)) as document_nb_contributions,

  GREATEST(MAX(r.date_inscription), MAX(r.date_reviewed)) as rigging_latest_date_of_update,
  (COUNT(DISTINCT r.date_inscription)+ COUNT(DISTINCT r.date_reviewed)) as rigging_nb_contributions,

  GREATEST(MAX(h.date_inscription), MAX(h.date_reviewed)) as history_latest_date_of_update,
  (COUNT(DISTINCT h.date_inscription)+ COUNT(DISTINCT h.date_reviewed)) as history_nb_contributions,

  GREATEST(MAX(c.date_inscription), MAX(c.date_reviewed)) as comment_latest_date_of_update,
  (COUNT(DISTINCT c.date_inscription)+ COUNT(DISTINCT c.date_reviewed)) as comment_nb_contributions,

  m.id as id_massif,
  n.name as entrance_name,
  nn.name as massif_name,
  e.id_country as id_country,
  co.fr_name as country_name,
  NOW() as date_of_update

  FROM t_entrance e
  LEFT JOIN t_country co ON co.iso = e.id_country
  LEFT JOIN t_location l ON e.id = l.id_entrance
  LEFT JOIN t_description d ON e.id = d.id_entrance
  LEFT JOIN t_document doc ON e.id = doc.id_entrance
  LEFT JOIN t_rigging r ON e.id = r.id_entrance
  LEFT JOIN t_history h ON e.id = h.id_entrance
  LEFT JOIN t_comment c ON e.id = c.id_entrance
  LEFT JOIN t_name n ON e.id = n.id_entrance
  LEFT JOIN t_massif m ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
  LEFT JOIN (SELECT * FROM t_name WHERE is_main = true) nn ON m.id = nn.id_massif
  WHERE n.is_main = true
  AND e.is_deleted = false
  GROUP BY e.id, m.id, n.name, nn.name, co.fr_name
  WITH NO DATA;

CREATE UNIQUE INDEX ON v_data_quality_compute_entrance(id_massif, id_entrance);
CREATE UNIQUE INDEX ON v_massif_info(id_massif, id_cave);
CREATE UNIQUE INDEX ON v_country_info(id_massif, id_cave);
