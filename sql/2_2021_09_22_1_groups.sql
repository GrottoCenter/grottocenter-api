\c grottoce;
INSERT INTO public.t_group (id, "name", "comments")
VALUES (
		1,
		'Administrator',
		'Technical responsible of the application.'
	),
	(2, 'Moderator', 'Content reviewers.'),
	(3, 'User', 'Default users group.'),
	(4, 'Visitor', 'Non connected people.'),
	(
		5,
		'Leader',
		'Contributors can refer to those people for any questions.'
	);
