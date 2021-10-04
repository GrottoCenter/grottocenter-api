\c grottoce;

INSERT INTO public.t_identifier_type (code, "text", regexp)
VALUES ('doi  ', 'digital object identifier', '^.+$'),
	(
		'isbn ',
		'international standard book number',
		'^(97[89]-)?[0-9]{1,5}-[0-9]+-[0-9]+-[0-9]$'
	),
	(
		'issn ',
		'international standard serial number',
		'^[0-9]{4}-[0-9]{3}[0-9x]$'
	),
	(
		'url  ',
		'uniform resource locator',
		'^[a-z]{2,5}://.+\..+$'
	);