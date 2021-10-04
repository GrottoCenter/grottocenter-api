\c grottoce;

-- h_ tables
SELECT SETVAL('h_cave_id_seq', (SELECT MAX(id) + 1 FROM public.h_cave));
SELECT SETVAL('h_comment_id_seq', (SELECT MAX(id) + 1 FROM public.h_comment));
SELECT SETVAL('h_description_id_seq', (SELECT MAX(id) + 1 FROM public.h_description));
SELECT SETVAL('h_document_id_seq', (SELECT MAX(id) + 1 FROM public.h_document));
SELECT SETVAL('h_entrance_id_seq', (SELECT MAX(id) + 1 FROM public.h_entrance));
SELECT SETVAL('h_grotto_id_seq', (SELECT MAX(id) + 1 FROM public.h_grotto));
SELECT SETVAL('h_history_id_seq', (SELECT MAX(id) + 1 FROM public.h_history));
SELECT SETVAL('h_location_id_seq', (SELECT MAX(id) + 1 FROM public.h_location));
SELECT SETVAL('h_massif_id_seq', (SELECT MAX(id) + 1 FROM public.h_massif));
SELECT SETVAL('h_name_id_seq', (SELECT MAX(id) + 1 FROM public.h_name));
SELECT SETVAL('h_rigging_id_seq', (SELECT MAX(id) + 1 FROM public.h_rigging));

-- t_ tables
SELECT SETVAL('t_caver_id_seq', (SELECT MAX(id) + 1 FROM public.t_caver));
SELECT SETVAL('t_bbs_id_seq', (SELECT MAX(id) + 1 FROM public.t_bbs));
SELECT SETVAL('t_cave_id_seq', (SELECT MAX(id) + 1 FROM public.t_cave));
SELECT SETVAL('t_caver_id_seq', (SELECT MAX(id) + 1 FROM public.t_caver));
SELECT SETVAL('t_comment_id_seq', (SELECT MAX(id) + 1 FROM public.t_comment));
SELECT SETVAL('t_crs_id_seq', (SELECT MAX(id) + 1 FROM public.t_crs));
SELECT SETVAL('t_description_id_seq', (SELECT MAX(id) + 1 FROM public.t_description));
SELECT SETVAL('t_document_id_seq', (SELECT MAX(id) + 1 FROM public.t_document));
SELECT SETVAL('t_entrance_id_seq', (SELECT MAX(id) + 1 FROM public.t_entrance));
SELECT SETVAL('t_file_id_seq', (SELECT MAX(id) + 1 FROM public.t_file));
SELECT SETVAL('t_file_format_id_seq', (SELECT MAX(id) + 1 FROM public.t_file_format));
SELECT SETVAL('t_grotto_id_seq', (SELECT MAX(id) + 1 FROM public.t_grotto));
SELECT SETVAL('t_history_id_seq', (SELECT MAX(id) + 1 FROM public.t_history));
SELECT SETVAL('t_location_id_seq', (SELECT MAX(id) + 1 FROM public.t_location));
SELECT SETVAL('t_massif_id_seq', (SELECT MAX(id) + 1 FROM public.t_massif));
SELECT SETVAL('t_name_id_seq', (SELECT MAX(id) + 1 FROM public.t_name));
SELECT SETVAL('t_point_id_seq', (SELECT MAX(id) + 1 FROM public.t_point));
SELECT SETVAL('t_region_id_seq', (SELECT MAX(id) + 1 FROM public.t_region));
SELECT SETVAL('t_rigging_id_seq', (SELECT MAX(id) + 1 FROM public.t_rigging));
SELECT SETVAL('t_right_id_seq', (SELECT MAX(id) + 1 FROM public.t_right));
