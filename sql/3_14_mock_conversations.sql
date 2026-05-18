\c grottoce;

-- conversation 1 between 1 (Admin) and 2 (Moderator)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (1, '2023-01-01 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (1, 1), (1, 2);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(1, 1, 2, 'Hello admin, I have a question about moderation.', '2023-01-01 10:01:00', '2023-01-01 10:05:00'),
(2, 1, 1, 'Sure, what do you need?', '2023-01-01 10:06:00', '2023-01-01 10:10:00'),
(3, 1, 2, 'Is there a guide for deleting spam?', '2023-01-01 10:11:00', NULL); -- unread by admin

-- conversation 2 between 1 (Admin) and 3 (User)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (2, '2023-02-01 14:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (2, 1), (2, 3);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(4, 2, 3, 'Hello, I cannot reset my password.', '2023-02-01 14:05:00', NULL),
(5, 2, 3, 'Can you help me?', '2023-02-01 14:06:00', NULL);

-- conversation 3 between 1 (Admin) and 4 (Leader)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (3, '2023-03-01 09:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (3, 1), (3, 4);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(6, 3, 1, 'Welcome to the platform, leader!', '2023-03-01 09:05:00', '2023-03-01 09:10:00'),
(7, 3, 4, 'Thanks!', '2023-03-01 09:15:00', '2023-03-01 09:20:00');
