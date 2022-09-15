\c grottoce;
INSERT INTO public.t_notification (
  id, date_inscription, date_read_at,
  id_cave, id_comment, id_description, id_document, id_entrance, id_grotto, id_history, id_location, id_massif, id_rigging,
  id_notification_type, id_notifier, id_notified
) VALUES (
  -- cave
  1, '2022-08-26 20:58:18.000', NULL,
  5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  1, 4, 5
), (
  -- comment
  2, '2020-09-07 17:42:51.000', NULL,
  NULL, 5556, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  1, 2, 5
), (
  -- description
  3, '2014-11-02 20:10:18.000', NULL,
  NULL, NULL, 21, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  1, 4, 5
), (
  -- document
  4, '2022-09-14 06:25:01.000', NULL,
  NULL, NULL, NULL, 2998, NULL, NULL, NULL, NULL, NULL, NULL,
  1, 1, 5
), (
  -- entrance
  5, '2008-07-28 16:40:40.000', NULL,
  NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL,
  1, 3, 5
), (
  -- grotto
  6, '2008-07-29 14:58:06.000', NULL,
  NULL, NULL, NULL, NULL, NULL, 7, NULL, NULL, NULL, NULL,
  1, 2, 5
), (
  -- history
  7, '2009-08-16 12:08:27.000', NULL,
  NULL, NULL, NULL, NULL, NULL, NULL, 101, NULL, NULL, NULL,
  1, 3, 5
), (
  -- location
  8, '2022-09-15 15:08:37.000', NULL,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, 305, NULL, NULL,
  1, 6, 5
), (
  -- massif
  9, '2022-09-15 15:08:37.000', NULL,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, NULL,
  1, 2, 5
), (
  -- rigging
  10, '2008-07-28 20:00:34.000', NULL,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3,
  1, 6, 5
);

