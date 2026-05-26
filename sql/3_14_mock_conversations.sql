\c grottoce;

-- Caver IDs mapping (refer to sql/3_01_mock_cavers.sql):
-- #1 - Adrien Admin (Admin)
-- #2 - Melvil Mode (Moderator)
-- #3 - Ursulle Use (User)
-- #4 - Léa Lead (Leader)
-- #5 - Alex All (Admin, Moderator, User, Leader)
-- #6 - John Doe (User, Moderator)

-- Conversation 1: Admin (1) and Moderator (2) [Active] - LONG Discussion (25 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (1, '2023-01-01 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (1, 1), (1, 2);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(1, 1, 2, 'Hello admin, I have a question about moderation.', '2023-01-01 10:01:00', '2023-01-01 10:02:00'),
(2, 1, 1, 'Sure, what do you need?', '2023-01-01 10:02:00', '2023-01-01 10:03:00'),
(3, 1, 2, 'Is there a guide for deleting spam?', '2023-01-01 10:03:00', '2023-01-01 10:04:00'),
(4, 1, 1, 'I can point you to the wiki page.', '2023-01-01 10:04:00', '2023-01-01 10:05:00'),
(5, 1, 2, 'That would be helpful.', '2023-01-01 10:05:00', '2023-01-01 10:06:00'),
(6, 1, 1, 'Here is the link: /wiki/spam-guidelines.', '2023-01-01 10:06:00', '2023-01-01 10:07:00'),
(7, 1, 2, 'Thanks, I will read it today.', '2023-01-01 10:07:00', '2023-01-01 10:08:00'),
(8, 1, 1, 'Let me know if you have any questions.', '2023-01-01 10:08:00', '2023-01-01 10:09:00'),
(9, 1, 2, 'I have one quick question now actually.', '2023-01-01 10:09:00', '2023-01-01 10:10:00'),
(10, 1, 1, 'Go ahead.', '2023-01-01 10:10:00', '2023-01-01 10:11:00'),
(11, 1, 2, 'Do we ban first-time spammers immediately?', '2023-01-01 10:11:00', '2023-01-01 10:12:00'),
(12, 1, 1, 'Usually we warn them first, unless it is a bot.', '2023-01-01 10:12:00', '2023-01-01 10:13:00'),
(13, 1, 2, 'How do we identify bots?', '2023-01-01 10:13:00', '2023-01-01 10:14:00'),
(14, 1, 1, 'Usually by the username and repetitive pattern.', '2023-01-01 10:14:00', '2023-01-01 10:15:00'),
(15, 1, 2, 'Okay, makes sense. I saw a suspicious user earlier.', '2023-01-01 10:15:00', '2023-01-01 10:16:00'),
(16, 1, 1, 'What is their username?', '2023-01-01 10:16:00', '2023-01-01 10:17:00'),
(17, 1, 2, 'SpammyMcSpamface.', '2023-01-01 10:17:00', '2023-01-01 10:18:00'),
(18, 1, 1, 'Yeah, that one is definitely a bot. Banned.', '2023-01-01 10:18:00', '2023-01-01 10:19:00'),
(19, 1, 2, 'Great. Thanks for the quick action.', '2023-01-01 10:19:00', '2023-01-01 10:20:00'),
(20, 1, 1, 'No problem. Keep up the good work.', '2023-01-01 10:20:00', '2023-01-01 10:21:00'),
(21, 1, 2, 'I will. I will continue checking the queue.', '2023-01-01 10:21:00', '2023-01-01 10:22:00'),
(22, 1, 1, 'Perfect.', '2023-01-01 10:22:00', '2023-01-01 10:23:00'),
(23, 1, 2, 'One more thing, is the new server ready?', '2023-01-01 10:23:00', '2023-01-01 10:24:00'),
(24, 1, 1, 'Almost, we are doing some final migrations.', '2023-01-01 10:24:00', '2023-01-01 10:25:00'),
(25, 1, 2, 'Let me know if you need help testing pagination.', '2023-01-01 10:25:00', NULL);

-- Conversation 2: Admin (1) and User (3) [Active] - LONG Discussion (22 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (2, '2023-02-01 14:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (2, 1), (2, 3);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(26, 2, 3, 'Hello, I cannot reset my password.', '2023-02-01 14:05:00', '2023-02-01 14:11:00'),
(27, 2, 3, 'Can you help me?', '2023-02-01 14:06:00', '2023-02-01 14:11:00'),
(28, 2, 1, 'Hi Ursulle! I can definitely help with that. Did you check your spam folder for the reset email?', '2023-02-01 14:10:00', '2023-02-01 14:12:00'),
(29, 2, 3, 'Yes, I checked but there is nothing there.', '2023-02-01 14:12:00', '2023-02-01 14:15:00'),
(30, 2, 1, 'Okay. Let me check the logs for your email address: user@user.com.', '2023-02-01 14:15:00', '2023-02-01 14:16:00'),
(31, 2, 1, 'Ah, I see a delivery block from your email provider.', '2023-02-01 14:16:00', '2023-02-01 14:17:00'),
(32, 2, 3, 'Oh really? Why is that?', '2023-02-01 14:17:00', '2023-02-01 14:19:00'),
(33, 2, 1, 'Sometimes they block our automated emails thinking it is spam. I have unblocked it from our end.', '2023-02-01 14:19:00', '2023-02-01 14:20:00'),
(34, 2, 1, 'Can you try requesting a new password reset link now?', '2023-02-01 14:20:00', '2023-02-01 14:21:00'),
(35, 2, 3, 'Okay, let me try... Just requested it.', '2023-02-01 14:21:00', '2023-02-01 14:23:00'),
(36, 2, 3, 'Still nothing. Let me refresh again.', '2023-02-01 14:22:00', '2023-02-01 14:23:00'),
(37, 2, 3, 'Ah! It just arrived! Thanks!', '2023-02-01 14:23:00', '2023-02-01 14:25:00'),
(38, 2, 1, 'Excellent. Please click the link and set your new password.', '2023-02-01 14:25:00', '2023-02-01 14:26:00'),
(39, 2, 3, 'I clicked it, but it says "token expired".', '2023-02-01 14:26:00', '2023-02-01 14:28:00'),
(40, 2, 1, 'That is strange. The token should last 24 hours. Did you request it twice?', '2023-02-01 14:28:00', '2023-02-01 14:29:00'),
(41, 2, 3, 'Yes, I clicked the button twice because it was slow.', '2023-02-01 14:29:00', '2023-02-01 14:31:00'),
(42, 2, 1, 'Ah, that is why. The second request invalidated the first token. Please check for the second email.', '2023-02-01 14:31:00', '2023-02-01 14:32:00'),
(43, 2, 3, 'Okay, I see the second email now. Let me click that one.', '2023-02-01 14:32:00', '2023-02-01 14:35:00'),
(44, 2, 3, 'It worked! I was able to set a new password.', '2023-02-01 14:35:00', '2023-02-01 14:36:00'),
(45, 2, 1, 'Glad to hear that. Let me know if you need anything else.', '2023-02-01 14:36:00', '2023-02-01 14:37:00'),
(46, 2, 3, 'Thank you so much for the quick help!', '2023-02-01 14:37:00', '2023-02-01 14:38:00'),
(47, 2, 1, 'You''re welcome! Have a great day.', '2023-02-01 14:38:00', NULL);

-- Conversation 3: Admin (1) and Leader (4) [Active] - (8 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (3, '2023-03-01 09:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (3, 1), (3, 4);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(48, 3, 1, 'Welcome to the platform, leader!', '2023-03-01 09:05:00', '2023-03-01 09:10:00'),
(49, 3, 4, 'Thanks! I''m planning to organize some caving trips soon.', '2023-03-01 09:15:00', '2023-03-01 09:20:00'),
(50, 3, 1, 'That''s great. Let me know if you need help with setting up the grotto templates.', '2023-03-01 09:22:00', '2023-03-01 09:30:00'),
(51, 3, 4, 'Actually, yes. Can I import coordinates from GPX?', '2023-03-01 09:35:00', '2023-03-01 09:40:00'),
(52, 3, 1, 'Not directly in the message, but you can upload GPX files when editing cave entrance details.', '2023-03-01 09:42:00', '2023-03-01 09:50:00'),
(53, 3, 4, 'Oh, perfect. I will try that tonight.', '2023-03-01 09:55:00', '2023-03-01 10:00:00'),
(54, 3, 1, 'Great, let me know if you hit any bugs.', '2023-03-01 10:05:00', '2023-03-01 10:10:00'),
(55, 3, 4, 'Will do, thank you.', '2023-03-01 10:15:00', NULL);

-- Conversation 4: Admin (1) and Alex All (5) [Active] - (10 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (4, '2023-03-02 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (4, 1), (4, 5);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(56, 4, 5, 'Hey admin, quick question about massifs.', '2023-03-02 10:05:00', '2023-03-02 10:10:00'),
(57, 4, 1, 'Sure, go ahead.', '2023-03-02 10:12:00', '2023-03-02 10:15:00'),
(58, 4, 5, 'Are massif outlines sensitive data? Should we hide them?', '2023-03-02 10:17:00', '2023-03-02 10:20:00'),
(59, 4, 1, 'Usually no, only specific cave entrances can be marked sensitive.', '2023-03-02 10:22:00', '2023-03-02 10:25:00'),
(60, 4, 5, 'Ah, I see. What about massifs in restricted nature reserves?', '2023-03-02 10:27:00', '2023-03-02 10:30:00'),
(61, 4, 1, 'In those cases, we can set the massif as sensitive. There is a flag `is_sensitive` on the massif model.', '2023-03-02 10:32:00', '2023-03-02 10:35:00'),
(62, 4, 5, 'Got it. I''ll make sure to use that flag appropriately.', '2023-03-02 10:37:00', '2023-03-02 10:40:00'),
(63, 4, 1, 'Awesome, thanks for checking first.', '2023-03-02 10:42:00', '2023-03-02 10:45:00'),
(64, 4, 5, 'No problem. Talk to you later!', '2023-03-02 10:47:00', '2023-03-02 10:50:00'),
(65, 4, 1, 'See ya.', '2023-03-02 10:52:00', NULL);

-- Conversation 5: Admin (1) and John Doe (6) [Archived by Admin] - LONG Discussion (24 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (5, '2023-03-03 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (5, 1), (5, 6);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(66, 5, 6, 'Greetings, John here. Did you get my report?', '2023-03-03 10:05:00', '2023-03-03 10:10:00'),
(67, 5, 1, 'Hi John! Yes, I received it. Thanks for the detailed report on Dent de Crolles.', '2023-03-03 10:12:00', '2023-03-03 10:15:00'),
(68, 5, 6, 'Awesome. I was worried the attachment didn''t upload correctly.', '2023-03-03 10:17:00', '2023-03-03 10:20:00'),
(69, 5, 1, 'It did, the PDF formatting looks perfect.', '2023-03-03 10:22:00', '2023-03-03 10:25:00'),
(70, 5, 6, 'Great. I have some more data for the adjacent caves.', '2023-03-03 10:27:00', '2023-03-03 10:30:00'),
(71, 5, 1, 'Feel free to submit them. Are they also in the same massif?', '2023-03-03 10:32:00', '2023-03-03 10:35:00'),
(72, 5, 6, 'Yes, all part of the same system. They are interconnected.', '2023-03-03 10:37:00', '2023-03-03 10:40:00'),
(73, 5, 1, 'Excellent. If they are connected, you can link them using the junction table.', '2023-03-03 10:42:00', '2023-03-03 10:45:00'),
(74, 5, 6, 'Oh, how do I do that?', '2023-03-03 10:47:00', '2023-03-03 10:50:00'),
(75, 5, 1, 'When editing a cave, there''s a section to add connections/junctions.', '2023-03-03 10:52:00', '2023-03-03 10:55:00'),
(76, 5, 6, 'I see. Does it require a validator to approve the junction?', '2023-03-03 10:57:00', '2023-03-03 11:00:00'),
(77, 5, 1, 'Yes, all junction edits go through the review queue.', '2023-03-03 11:02:00', '2023-03-03 11:05:00'),
(78, 5, 6, 'That makes sense to prevent incorrect data.', '2023-03-03 11:07:00', '2023-03-03 11:10:00'),
(79, 5, 1, 'Exactly. It helps keep the database clean.', '2023-03-03 11:12:00', '2023-03-03 11:15:00'),
(80, 5, 6, 'I noticed some duplicate entries for Grotto 1, by the way.', '2023-03-03 11:17:00', '2023-03-03 11:20:00'),
(81, 5, 1, 'Ah, let me look into that. Do you have the IDs?', '2023-03-03 11:22:00', '2023-03-03 11:25:00'),
(82, 5, 6, 'One is ID 12 and the other is ID 15, I think.', '2023-03-03 11:27:00', '2023-03-03 11:30:00'),
(83, 5, 1, 'Thanks, checking now.', '2023-03-03 11:32:00', '2023-03-03 11:35:00'),
(84, 5, 1, 'Yes, they are definitely duplicates. I will merge them.', '2023-03-03 11:36:00', '2023-03-03 11:40:00'),
(85, 5, 6, 'Awesome. Thanks for the quick response.', '2023-03-03 11:42:00', '2023-03-03 11:45:00'),
(86, 5, 1, 'Merged! ID 15 now redirects to ID 12.', '2023-03-03 11:47:00', '2023-03-03 11:50:00'),
(87, 5, 6, 'Perfect. I''ll continue checking the list.', '2023-03-03 11:52:00', '2023-03-03 11:55:00'),
(88, 5, 1, 'Thanks for your help, John! I''ll archive this thread now since it''s resolved.', '2023-03-03 11:57:00', '2023-03-03 12:00:00'),
(89, 5, 6, 'Sounds good, have a great day!', '2023-03-03 12:05:00', '2023-03-03 12:10:00');

INSERT INTO public.t_conversation_archive (id, id_conversation, id_caver, archived_at) VALUES (1, 5, 1, '2023-03-04 12:00:00');

-- Conversation 6: Moderator (2) and User (3) [Active] - (6 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (6, '2023-03-04 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (6, 2), (6, 3);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(90, 6, 2, 'Hi Ursulle, could you verify the comments on Grotto 2?', '2023-03-04 10:05:00', '2023-03-04 10:10:00'),
(91, 6, 3, 'Sure, what''s wrong with them?', '2023-03-04 10:15:00', '2023-03-04 10:20:00'),
(92, 6, 2, 'They seem to contain some promotional links.', '2023-03-04 10:22:00', '2023-03-04 10:25:00'),
(93, 6, 3, 'Ah, let me check. Yes, I see it. I will edit it out.', '2023-03-04 10:30:00', '2023-03-04 10:35:00'),
(94, 6, 2, 'Thanks for the quick edit.', '2023-03-04 10:40:00', '2023-03-04 10:45:00'),
(95, 6, 3, 'No problem, glad to help.', '2023-03-04 10:50:00', NULL);

-- Conversation 7: Moderator (2) and John Doe (6) [Active] - (5 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (7, '2023-03-05 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (7, 2), (7, 6);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(96, 7, 6, 'Hey Melvil, do you know when the next moderation meeting is?', '2023-03-05 10:05:00', '2023-03-05 10:10:00'),
(97, 7, 2, 'It is scheduled for next Tuesday at 18:00 UTC.', '2023-03-05 10:15:00', '2023-03-05 10:20:00'),
(98, 7, 6, 'Great, I will be there.', '2023-03-05 10:25:00', '2023-03-05 10:30:00'),
(99, 7, 2, 'Perfect. I will send the agenda link soon.', '2023-03-05 10:35:00', '2023-03-05 10:40:00'),
(100, 7, 6, 'Thanks, see you then.', '2023-03-05 10:45:00', NULL);

-- Conversation 8: User (3) and Alex All (5) [Active] - (4 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (8, '2023-03-06 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (8, 3), (8, 5);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(101, 8, 3, 'Hi Alex, can you review my latest caving trip report?', '2023-03-06 10:05:00', '2023-03-06 10:10:00'),
(102, 8, 5, 'Yes, I will look at it this afternoon.', '2023-03-06 10:15:00', '2023-03-06 10:20:00'),
(103, 8, 3, 'Thank you! I added some photos too.', '2023-03-06 10:25:00', '2023-03-06 10:30:00'),
(104, 8, 5, 'Nice, looking forward to it.', '2023-03-06 10:35:00', NULL);

-- Conversation 9: Leader (4) and Alex All (5) [Archived by Leader] - (2 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (9, '2023-03-07 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (9, 4), (9, 5);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(105, 9, 4, 'Hey Alex, are we still on for the Sunday outing?', '2023-03-07 10:05:00', '2023-03-07 10:10:00'),
(106, 9, 5, 'Yes, meeting at 8:00 AM at the usual spot.', '2023-03-07 10:15:00', '2023-03-07 10:20:00');

INSERT INTO public.t_conversation_archive (id, id_conversation, id_caver, archived_at) VALUES (2, 9, 4, '2023-03-08 12:00:00');

-- Conversation 10: Alex All (5) and John Doe (6) [Active] - (3 messages)
INSERT INTO public.t_conversation (id, date_inscription) VALUES (10, '2023-03-08 10:00:00');
INSERT INTO public.j_participant (id_conversation, id_caver) VALUES (10, 5), (10, 6);
INSERT INTO public.t_message (id, id_conversation, id_caver_sender, body, date_sent, date_read) VALUES
(107, 10, 5, 'Hey John, did you find the map layer bug?', '2023-03-08 10:05:00', '2023-03-08 10:10:00'),
(108, 10, 6, 'Yes, it only happens on mobile Safari.', '2023-03-08 10:15:00', '2023-03-08 10:20:00'),
(109, 10, 5, 'Ah, good catch. I''ll look into fixing it.', '2023-03-08 10:25:00', NULL);
