\c grottoce;
-- See this page to know how to get all the sequences updated: https://wiki.postgresql.org/wiki/Fixing_Sequences

-- h_ tables
SELECT SETVAL('public.h_cave_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_cave;
SELECT SETVAL('public.h_comment_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_comment;
SELECT SETVAL('public.h_description_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_description;
SELECT SETVAL('public.h_document_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_document;
SELECT SETVAL('public.h_entrance_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_entrance;
SELECT SETVAL('public.h_grotto_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_grotto;
SELECT SETVAL('public.h_history_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_history;
SELECT SETVAL('public.h_location_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_location;
SELECT SETVAL('public.h_massif_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_massif;
SELECT SETVAL('public.h_name_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_name;
SELECT SETVAL('public.h_rigging_id_seq', COALESCE(MAX(id), 1) ) FROM public.h_rigging;

-- t_ tables
SELECT SETVAL('public.t_bbs_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_bbs;
SELECT SETVAL('public.t_cave_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_cave;
SELECT SETVAL('public.t_caver_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_caver;
SELECT SETVAL('public.t_comment_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_comment;
SELECT SETVAL('public.t_crs_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_crs;
SELECT SETVAL('public.t_description_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_description;
SELECT SETVAL('public.t_document_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_document;
SELECT SETVAL('public.t_entrance_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_entrance;
SELECT SETVAL('public.t_file_format_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_file_format;
SELECT SETVAL('public.t_file_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_file;
SELECT SETVAL('public.t_grotto_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_grotto;
SELECT SETVAL('public.t_group_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_group;
SELECT SETVAL('public.t_history_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_history;
SELECT SETVAL('public.t_location_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_location;
SELECT SETVAL('public.t_massif_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_massif;
SELECT SETVAL('public.t_name_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_name;
SELECT SETVAL('public.t_option_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_option;
SELECT SETVAL('public.t_point_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_point;
SELECT SETVAL('public.t_region_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_region;
SELECT SETVAL('public.t_rigging_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_rigging;
SELECT SETVAL('public.t_right_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_right;