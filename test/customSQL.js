const UPDATE_SEQUENCES_QUERY = `
-- See this page to know how to get all the sequences updated: https://wiki.postgresql.org/wiki/Fixing_Sequences

-- t_ tables
SELECT SETVAL('public.t_cave_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_cave;
SELECT SETVAL('public.t_caver_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_caver;
SELECT SETVAL('public.t_comment_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_comment;
SELECT SETVAL('public.t_description_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_description;
SELECT SETVAL('public.t_document_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_document;
SELECT SETVAL('public.t_entrance_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_entrance;
SELECT SETVAL('public.t_file_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_file;
SELECT SETVAL('public.t_grotto_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_grotto;
SELECT SETVAL('public.t_group_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_group;
SELECT SETVAL('public.t_history_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_history;
SELECT SETVAL('public.t_location_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_location;
SELECT SETVAL('public.t_massif_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_massif;
SELECT SETVAL('public.t_name_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_name;
SELECT SETVAL('public.t_notification_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_notification;
SELECT SETVAL('public.t_option_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_option;
SELECT SETVAL('public.t_point_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_point;
SELECT SETVAL('public.t_region_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_region;
SELECT SETVAL('public.t_rigging_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_rigging;
`;

const ALTER_MASSIF_COLUMN_GEOG_POLYGON = `
ALTER TABLE public.t_massif ALTER COLUMN geog_polygon TYPE geography USING geog_polygon::geography;
`;

const ALTER_ENTRANCE_COLUMN_POINT_GEOM =
  'ALTER TABLE t_entrance ADD COLUMN point_geom geometry(Point, 4326);';

module.exports = {
  UPDATE_SEQUENCES_QUERY,
  ALTER_MASSIF_COLUMN_GEOG_POLYGON,
  ALTER_ENTRANCE_COLUMN_POINT_GEOM,
};
