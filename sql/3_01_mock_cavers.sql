\c grottoce;

-- Accounts info (password is the email):
-- #1 - Adrien Admin - admin@admin.com => only admin
-- #2 - Melvil Mode - moderator@moderator.com => only moderator
-- #3 - Ursulle Use - user@user.com => only user
-- #4 - Léa Lead - leader@leader.com => only leader
-- #5 - Alex All - all@all.com => has all roles (admin, moderator, user & leader)
-- #6 - John Doe - john@doe.com => user and moderator

INSERT INTO public.t_caver (
		id,
		login,
		"password",
		activated,
		activation_code,
		banned,
		connection_counter,
		relevance,
		"name",
		surname,
		nickname,
		mail,
		mail_is_valid,
		date_inscription,
		date_last_connection,
		alert_for_news,
		show_links,
		detail_level,
		default_zoom,
		id_language,
    send_notification_by_email
	)
VALUES (
		7,
		'deleted',
		'$argon2id$v=19$m=65536,t=3,p=4$uhUWVLfyiprNpi2kp7250Q$/h5Q3hfOOGse4w/3QGcacAQq2qUTzXc+dczYoCUEQEY', -- welcome1
		false,
		'0',
		false,
		0,
		1,
		'deleted',
		'deleted',
		'deleted',
		'deleted@mail.no',
		true,
		'2020-12-21 22:23:20.000',
		NULL,
		false,
		false,
		30,
		NULL,
		'fra',
    true
	),
	(
		1,
		'AdrienAdmin',
		'$argon2id$v=19$m=65536,t=3,p=4$2qvWZcXYTJgAkZ8ee7ku6A$P+R+rYEqD0kwyXpHLo8jHq7CarBWxqu5BYY2eMqe9kU', -- admin@admin.com
		true,
		'0',
		false,
		716,
		35,
		'Adrien',
		'Admin',
		'AdrienAdmin',
		'admin@admin.com',
		true,
		'2008-07-28 13:56:41.000',
		'2019-02-06 00:30:06.000',
		true,
		false,
		15,
		8,
		'fra',
    false
	),
	(
		2,
		'MelvilMode',
		'$argon2id$v=19$m=65536,t=3,p=4$iP+UY7Kj4/YqzDk0x0Q9UQ$BwvXtzopaVFQKv4po3O+ssoPgqz41grt15XHFEWMYsI', -- moderator@moderator.com
		true,
		'0',
		false,
		53,
		2,
		'Melvil',
		'Mode',
		'MelvildMode',
		'moderator@moderator.com',
		true,
		'2008-07-28 14:41:41.000',
		'2013-03-26 11:50:09.000',
		true,
		true,
		30,
		13,
		'fra',
    false
	),
	(
		3,
		'UrsulleUse',
		'$argon2id$v=19$m=65536,t=3,p=4$HcA9eJYiIi4zOrh5vY61nw$SW/4XfLZ6vX/Ig9IA3WLeevWnurUFN/qgPyp4xJnoVI', -- user@user.com
		true,
		'0',
		false,
		5,
		1,
		'Ursulle',
		'Use',
		'UrsulleUse',
		'user@user.com',
		true,
		'2008-07-28 14:47:13.000',
		'2011-03-02 13:43:59.000',
		false,
		false,
		30,
		8,
		'fra',
    true
	),
	(
		4,
		'LéaLead',
		'$argon2id$v=19$m=65536,t=3,p=4$PjrfI1N70vZpWCV8Uiq2iQ$MIE+x7UC2zpclRZ6n63/7v9OGNJAKiM4lrt3Jx3wlnc', -- leader@leader.com
		true,
		'0',
		false,
		55,
		30,
		'Léa',
		'Lead',
		'LéaLead',
		'leader@leader.com',
		true,
		'2008-07-28 15:02:08.000',
		'2017-09-16 18:10:06.000',
		false,
		false,
		100,
		7,
		'fra',
    false
	),
	(
		5,
		'AlexAll',
		'$argon2id$v=19$m=65536,t=3,p=4$yIKg8kYOVGG/kAQGppE+Fg$TfGgkdL8MjYRrIDBc/vF9lcOapF9N0AS7MESdHd5UZw', -- all@all.com
		true,
		'0',
		false,
		56,
		1457,
		'Alex',
		'All',
		'AlexAll',
		'all@all.com',
		true,
		'2008-07-28 15:55:34.000',
		'2011-05-24 14:32:24.000',
		true,
		true,
		10,
		15,
		'fra',
    true
	),
	(
		6,
		'JohnDoe',
		'$argon2id$v=19$m=65536,t=3,p=4$7+koFbytXg3QSlsSbTS5Gw$/wha3q/nVjOztNKRsGnVNPXn5l+5uBoRELQ46VyLj5U', -- john@doe.com
		true,
		'0',
		false,
		404,
		406,
		'John',
		NULL,
		'JohnDoe',
		'john@doe.com',
		true,
		'2008-07-28 16:18:16.000',
		'2019-12-14 12:19:01.000',
		true,
		false,
		30,
		7,
		'fra',
    false
	);
INSERT INTO public.j_caver_group (id_caver, id_group)
VALUES (1, 1),
	(2, 2),
	(4, 5),
	(5, 1),
	(5, 2),
	(5, 5),
	(6, 2),
	(6, 5);
