\c grottoce;
-- t_bbs definition

-- Drop table

-- DROP TABLE t_bbs;

CREATE TABLE t_bbs (
	id serial NOT NULL,
	articleyear int2 NULL,
	articletitle varchar(1000) NULL,
	librarycode varchar(50) NULL,
	publicationother varchar(500) NULL,
	publicationfascicule varchar(300) NULL,
	publicationpages varchar(100) NULL,
	"comments" varchar(500) NULL,
	publication_url varchar(1000) NULL,
	editor_address varchar(500) NULL,
	editor_email varchar(100) NULL,
	editor_url varchar(200) NULL,
	abstract varchar(5000) NULL,
	xauteurfull varchar(500) NULL,
	chaptercode varchar(10) NULL,
	countrycode varchar(30) NULL,
	xrefsubjectfull varchar(100) NULL,
	xcountrycodefull varchar(300) NULL,
	"ref" varchar(10) NULL,
	xrefnumeriquefinal bpchar(10) NULL,
	identifier bpchar(250) NULL,
	identifier_type bpchar(5) NULL,
	id_parent int4 NULL,
	pages varchar(100) NULL,
	CONSTRAINT t_bbs_pkey PRIMARY KEY (id)
);


-- t_country definition

-- Drop table

-- DROP TABLE t_country;

CREATE TABLE t_country (
	iso bpchar(2) NOT NULL,
	iso3 bpchar(3) NOT NULL,
	"numeric" int4 NOT NULL,
	latitude numeric(24,20) NULL,
	longitude numeric(24,20) NULL,
	native_name varchar(50) NULL,
	en_name varchar(50) NOT NULL,
	fr_name varchar(50) NOT NULL,
	es_name varchar(50) NOT NULL,
	de_name varchar(50) NOT NULL,
	bg_name varchar(50) NOT NULL,
	it_name varchar(50) NOT NULL,
	ca_name varchar(50) NOT NULL,
	nl_name varchar(50) NOT NULL,
	rs_name varchar(50) NOT NULL,
	CONSTRAINT t_country_pk PRIMARY KEY (iso)
);


-- t_file_format definition

-- Drop table

-- DROP TABLE t_file_format;

CREATE TABLE t_file_format (
	id smallserial NOT NULL,
	"extension" bpchar(12) NULL,
	"comment" varchar(250) NULL,
	mime_type varchar(100) NULL,
	softwares varchar(300) NULL,
	CONSTRAINT t_file_format_pk PRIMARY KEY (id)
);


-- t_group definition

-- Drop table

-- DROP TABLE t_group;

CREATE TABLE t_group (
	id smallserial NOT NULL,
	"name" varchar(200) NOT NULL,
	"comments" varchar(1000) NULL,
	CONSTRAINT t_group_pk PRIMARY KEY (id)
);


-- t_identifier_type definition

-- Drop table

-- DROP TABLE t_identifier_type;

CREATE TABLE t_identifier_type (
	code bpchar(5) NOT NULL,
	"text" varchar(250) NOT NULL,
	regexp varchar(250) NOT NULL,
	CONSTRAINT t_identifier_type_pk PRIMARY KEY (code)
);


-- t_language definition

-- Drop table

-- DROP TABLE t_language;

CREATE TABLE t_language (
	id bpchar(3) NOT NULL,
	part2b bpchar(3) NULL,
	part2t bpchar(3) NULL,
	part1 bpchar(2) NULL,
	"scope" bpchar(1) NOT NULL,
	"type" bpchar(1) NOT NULL,
	ref_name varchar(150) NOT NULL,
	"comment" varchar(150) NULL,
	is_prefered bool NOT NULL DEFAULT false,
	CONSTRAINT t_language_pk PRIMARY KEY (id)
);


-- t_license definition

-- Drop table

-- DROP TABLE t_license;

CREATE TABLE t_license (
	id int2 NOT NULL,
	"name" varchar(30) NOT NULL,
	"text" text NULL,
	is_copyrighted bool NOT NULL,
	url varchar(100) NOT NULL,
	CONSTRAINT t_license_pk PRIMARY KEY (id)
);


-- t_right definition

-- Drop table

-- DROP TABLE t_right;

CREATE TABLE t_right (
	id smallserial NOT NULL,
	"name" varchar(200) NOT NULL,
	"comments" varchar(1000) NULL,
	CONSTRAINT t_right_pk PRIMARY KEY (id)
);


-- j_country_language definition

-- Drop table

-- DROP TABLE j_country_language;

CREATE TABLE j_country_language (
	id_country bpchar(2) NOT NULL,
	id_language bpchar(3) NOT NULL,
	is_official bool NOT NULL,
	is_main bool NOT NULL DEFAULT false,
	CONSTRAINT j_country_language_pk PRIMARY KEY (id_country, id_language),
	CONSTRAINT j_country_language0_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT j_country_language1_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);


-- j_group_right definition

-- Drop table

-- DROP TABLE j_group_right;

CREATE TABLE j_group_right (
	id_group int2 NOT NULL,
	id_right int2 NOT NULL,
	CONSTRAINT j_group_right_pk PRIMARY KEY (id_group, id_right),
	CONSTRAINT j_group_right_t_group_fk FOREIGN KEY (id_group) REFERENCES t_group(id),
	CONSTRAINT j_group_right_t_right0_fk FOREIGN KEY (id_right) REFERENCES t_right(id)
);


-- t_caver definition

-- Drop table

-- DROP TABLE t_caver;

CREATE TABLE t_caver (
	id serial NOT NULL,
	login varchar(20) NULL,
	"password" varchar(64) NULL,
	activated bool NOT NULL DEFAULT false,
	activation_code varchar(64) NULL,
	banned bool NOT NULL DEFAULT false,
	connection_counter int4 NOT NULL DEFAULT 0,
	relevance int2 NOT NULL DEFAULT 0,
	"name" varchar(36) NULL,
	surname varchar(32) NULL,
	nickname varchar(68) NOT NULL,
	mail varchar(50) NOT NULL,
	mail_is_valid bool NOT NULL DEFAULT true,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_last_connection timestamp NULL,
	alert_for_news bool NOT NULL DEFAULT false,
	show_links bool NOT NULL DEFAULT false,
	detail_level int4 NULL,
	default_zoom int4 NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT t_caver_login_key UNIQUE (login),
	CONSTRAINT t_caver_pk PRIMARY KEY (id),
	CONSTRAINT t_caver_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);
CREATE INDEX t_caver_idx ON t_caver USING btree (login);


-- t_crs definition

-- Drop table

-- DROP TABLE t_crs;

CREATE TABLE t_crs (
	id smallserial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	definition varchar(1000) NOT NULL,
	bounds varchar(100) NULL,
	url varchar(200) NULL,
	enabled bool NOT NULL DEFAULT false,
	code varchar(50) NOT NULL,
	CONSTRAINT t_crs_code_key UNIQUE (code),
	CONSTRAINT t_crs_pk PRIMARY KEY (id),
	CONSTRAINT t_crs_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_crs_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id)
);


-- t_geology definition

-- Drop table

-- DROP TABLE t_geology;

CREATE TABLE t_geology (
	id bpchar(10) NOT NULL,
	"label" varchar(500) NOT NULL,
	id_parent bpchar(10) NOT NULL,
	CONSTRAINT t_geology_pk PRIMARY KEY (id),
	CONSTRAINT t_geology_fk FOREIGN KEY (id) REFERENCES t_geology(id)
);


-- t_grotto definition

-- Drop table

-- DROP TABLE t_grotto;

CREATE TABLE t_grotto (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	village varchar(100) NULL,
	county varchar(100) NULL,
	region varchar(100) NULL,
	city varchar(100) NULL,
	postal_code varchar(5) NULL,
	address varchar(200) NULL,
	mail varchar(50) NULL,
	year_birth int2 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	latitude numeric(24,20) NULL,
	longitude numeric(24,20) NULL,
	custom_message varchar(2000) NULL,
	is_official_partner bool NOT NULL DEFAULT false,
	url varchar(200) NULL,
	id_country bpchar(2) NULL,
	picture_file_name varchar(100) NULL,
	is_deleted bool NOT NULL DEFAULT false,
	redirect_to int4 NULL,
	CONSTRAINT t_grotto_pk PRIMARY KEY (id),
	CONSTRAINT t_grotto_t_caver4_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_grotto_t_caver5_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_grotto_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT t_grotto_t_grotto_fk FOREIGN KEY (redirect_to) REFERENCES t_grotto(id)
);

-- t_massif definition

-- Drop table

-- DROP TABLE t_massif;

CREATE TABLE t_massif (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	geog_polygon geography NULL,
	is_deleted bool NOT NULL DEFAULT false,
	redirect_to int4 NULL,
	CONSTRAINT t_massif_pk PRIMARY KEY (id),
	CONSTRAINT t_massif_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_massif_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_massif_t_massif_fk FOREIGN KEY (redirect_to) REFERENCES t_massif(id)
);

-- t_region definition

-- Drop table

-- DROP TABLE t_region;

CREATE TABLE t_region (
	id serial NOT NULL,
	code varchar(20) NOT NULL,
	is_deprecated bool NOT NULL DEFAULT false,
	"name" varchar(300) NULL,
	id_country bpchar(2) NOT NULL,
	CONSTRAINT t_region_pk PRIMARY KEY (id),
	CONSTRAINT t_region_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso)
);


-- t_subject definition

-- Drop table

-- DROP TABLE t_subject;

CREATE TABLE t_subject (
	code bpchar(5) NOT NULL,
	subject varchar(300) NOT NULL,
	code_parent bpchar(5) NULL,
	CONSTRAINT t_subject_pk PRIMARY KEY (code),
	CONSTRAINT t_subject_fk FOREIGN KEY (code_parent) REFERENCES t_subject(code)
);


-- t_type definition

-- Drop table

-- DROP TABLE t_type;

CREATE TABLE t_type (
	id int2 NOT NULL,
	"name" varchar(30) NOT NULL,
	"comment" varchar(500) NULL,
	id_parent int2 NULL,
	CONSTRAINT t_type_pk PRIMARY KEY (id),
	CONSTRAINT t_type_fk FOREIGN KEY (id_parent) REFERENCES t_type(id)
);


-- h_grotto definition

-- Drop table

-- DROP TABLE h_grotto;

CREATE TABLE h_grotto (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	village varchar(100) NULL,
	county varchar(100) NULL,
	region varchar(100) NULL,
	city varchar(100) NULL,
	postal_code varchar(5) NULL,
	address varchar(200) NULL,
	mail varchar(50) NULL,
	year_birth int2 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	latitude numeric(24,20) NULL,
	longitude numeric(24,20) NULL,
	custom_message varchar(2000) NULL,
	is_official_partner bool NOT NULL DEFAULT false,
	url varchar(200) NULL,
	id_country bpchar(2) NULL,
	picture_file_name varchar(100) NULL,
	CONSTRAINT h_grotto_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_grotto_t_caver4_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_grotto_t_caver5_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_grotto_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT h_grotto_t_grotto FOREIGN KEY (id) REFERENCES t_grotto(id)
);


-- h_massif definition

-- Drop table

-- DROP TABLE h_massif;

CREATE TABLE h_massif (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	geometry_kml varchar(2000) NULL,
	geog_polygon geography NULL,
	CONSTRAINT h_massif_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_massif_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_massif_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_massif_t_massif FOREIGN KEY (id) REFERENCES t_massif(id)
);


-- j_caver_group definition

-- Drop table

-- DROP TABLE j_caver_group;

CREATE TABLE j_caver_group (
	id_caver int4 NOT NULL,
	id_group int2 NOT NULL,
	CONSTRAINT j_caver_group_pk PRIMARY KEY (id_caver, id_group),
	CONSTRAINT j_caver_group_t_caver_fk FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_caver_group_t_group0_fk FOREIGN KEY (id_group) REFERENCES t_group(id)
);


-- j_country_crs definition

-- Drop table

-- DROP TABLE j_country_crs;

CREATE TABLE j_country_crs (
	id_crs int2 NOT NULL,
	id_country bpchar(2) NOT NULL,
	CONSTRAINT j_country_crs_pk PRIMARY KEY (id_crs, id_country),
	CONSTRAINT j_country_crs_t_country0_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT j_country_crs_t_crs_fk FOREIGN KEY (id_crs) REFERENCES t_crs(id)
);


-- j_grotto_caver definition

-- Drop table

-- DROP TABLE j_grotto_caver;

CREATE TABLE j_grotto_caver (
	id_caver int4 NOT NULL,
	id_grotto int4 NOT NULL,
	CONSTRAINT j_grotto_caver_pk PRIMARY KEY (id_caver, id_grotto),
	CONSTRAINT j_grotto_caver_t_caver_fk FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_grotto_caver_t_grotto0_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


-- j_license_type definition

-- Drop table

-- DROP TABLE j_license_type;

CREATE TABLE j_license_type (
	id_license int2 NOT NULL,
	id_type int2 NOT NULL,
	CONSTRAINT j_license_type_pk PRIMARY KEY (id_license, id_type),
	CONSTRAINT j_license_type_t_license_fk FOREIGN KEY (id_license) REFERENCES t_license(id),
	CONSTRAINT j_license_type_t_type_fk FOREIGN KEY (id_type) REFERENCES t_type(id)
);


-- t_cave definition

-- Drop table

-- DROP TABLE t_cave;

CREATE TABLE t_cave (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	min_depth int4 NULL,
	max_depth int4 NULL,
	"depth" int4 NULL,
	length int4 NULL,
	is_diving bool NOT NULL DEFAULT false,
	temperature float8 NULL,
	size_coef int2 NOT NULL DEFAULT 0,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	longitude numeric(24,20) NULL,
	latitude numeric(24,20) NULL,
	id_massif int4,
	is_deleted bool NOT NULL DEFAULT false,
	redirect_to int4 NULL,
	CONSTRAINT t_cave_pk PRIMARY KEY (id),
	CONSTRAINT t_cave_t_cave_fk FOREIGN KEY (redirect_to) REFERENCES t_cave(id),
	CONSTRAINT t_cave_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_cave_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_cave_t_massif0_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id)
);


-- t_entrance definition

-- Drop table

-- DROP TABLE t_entrance;

CREATE TABLE t_entrance (
	id serial NOT NULL,
	"type" bpchar(8) NOT NULL DEFAULT 'entrance'::bpchar,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	region varchar(100) NULL,
	county varchar(100) NULL,
	village varchar(100) NULL,
	city varchar(100) NULL,
	address varchar(200) NULL,
	year_discovery int2 NULL,
	external_url varchar(2000) NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	is_public bool NULL,
	is_sensitive bool NOT NULL DEFAULT false,
	contact varchar(1000) NULL,
	modalities varchar(100) NOT NULL,
	has_contributions bool NOT NULL DEFAULT false,
	latitude numeric(24,20) NOT NULL,
	longitude numeric(24,20) NOT NULL,
	altitude int2 NULL,
	is_of_interest bool NULL,
	id_cave int4 NULL,
	id_country bpchar(2) NOT NULL,
	id_geology bpchar(10) NOT NULL DEFAULT 'Q35758'::bpchar,
	is_deleted bool NOT NULL DEFAULT false,
	redirect_to int4 NULL,
	CONSTRAINT t_entrance_pk PRIMARY KEY (id),
	CONSTRAINT t_entrance_type_check CHECK ((type = ANY (ARRAY['entrance'::bpchar, 'loss'::bpchar, 'emerg'::bpchar, 'outcrop'::bpchar]))),
	CONSTRAINT t_entrance_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_entrance_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_entrance_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_entrance_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT t_entrance_t_entrance_fk FOREIGN KEY (redirect_to) REFERENCES t_entrance(id),
	CONSTRAINT t_entrance_t_geology_fk FOREIGN KEY (id_geology) REFERENCES t_geology(id)
);

-- t_location definition

-- Drop table

-- DROP TABLE t_location;

CREATE TABLE t_location (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	relevance int2 NOT NULL,
	body text NOT NULL,
	id_entrance int4 NOT NULL,
	id_language bpchar(3) NOT NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_location_pk PRIMARY KEY (id),
	CONSTRAINT t_location_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_location_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_location_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_location_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);

-- t_point definition

-- Drop table

-- DROP TABLE t_point;

CREATE TABLE t_point (
	id serial NOT NULL,
	"type" bpchar(8) NOT NULL DEFAULT 'a'::bpchar,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	year_discovery int2 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	rel_latitude numeric(24,20) NOT NULL,
	rel_longitude numeric(24,20) NOT NULL,
	rel_depth int2 NULL,
	id_entrance int4 NULL,
	id_geology bpchar(10) NOT NULL DEFAULT 'Q35758'::bpchar,
	CONSTRAINT t_point_pk PRIMARY KEY (id),
	CONSTRAINT t_point_type_check CHECK ((type = ANY (ARRAY['a'::bpchar, 'b'::bpchar, 'c'::bpchar]))),
	CONSTRAINT t_point_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_point_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_point_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_point_t_geology_fk FOREIGN KEY (id_geology) REFERENCES t_geology(id)
);


-- t_rigging definition

-- Drop table

-- DROP TABLE t_rigging;

CREATE TABLE t_rigging (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	relevance int2 NOT NULL,
	title varchar(300) NOT NULL,
	obstacles varchar(2000) NULL,
	ropes varchar(2000) NULL,
	anchors varchar(2000) NULL,
	observations varchar(2000) NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_point int4 NULL,
	id_language bpchar(3) NOT NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_rigging_pk PRIMARY KEY (id),
	CONSTRAINT t_rigging_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_rigging_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_rigging_t_entrance1_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_rigging_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_rigging_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_rigging_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);

-- h_cave definition

-- Drop table

-- DROP TABLE h_cave;

CREATE TABLE h_cave (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	min_depth int4 NULL,
	max_depth int4 NULL,
	"depth" int4 NULL,
	length int4 NULL,
	is_diving bool NOT NULL DEFAULT false,
	temperature float8 NULL,
	size_coef int2 NOT NULL DEFAULT 0,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	longitude numeric(24,20) NULL,
	latitude numeric(24,20) NULL,
	id_massif int4,
	CONSTRAINT h_cave_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_cave_t_cave FOREIGN KEY (id) REFERENCES t_cave(id),
	CONSTRAINT h_cave_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_cave_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_cave_t_massif0_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id)
);


-- h_entrance definition

-- Drop table

-- DROP TABLE h_entrance;

CREATE TABLE h_entrance (
	id serial NOT NULL,
	"type" bpchar(8) NOT NULL DEFAULT 'entrance'::bpchar,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	region varchar(100) NULL,
	county varchar(100) NULL,
	village varchar(100) NULL,
	city varchar(100) NULL,
	address varchar(200) NULL,
	year_discovery int2 NULL,
	external_url varchar(2000) NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	is_public bool NULL,
	is_sensitive bool NOT NULL DEFAULT false,
	contact varchar(1000) NULL,
	modalities varchar(100) NOT NULL,
	has_contributions bool NOT NULL DEFAULT false,
	latitude numeric(24,20) NOT NULL,
	longitude numeric(24,20) NOT NULL,
	altitude int2 NULL,
	is_of_interest bool NULL,
	id_cave int4 NULL,
	id_country bpchar(2) NOT NULL,
	id_geology bpchar(10) NOT NULL DEFAULT 'Q35758'::bpchar,
	CONSTRAINT h_entrance_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_entrance_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_entrance_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_entrance_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_entrance_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT h_entrance_t_entrance FOREIGN KEY (id) REFERENCES t_entrance(id),
	CONSTRAINT h_entrance_t_geology_fk FOREIGN KEY (id_geology) REFERENCES t_geology(id)
);


-- h_location definition

-- Drop table

-- DROP TABLE h_location;

CREATE TABLE h_location (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	relevance int2 NOT NULL,
	body text NOT NULL,
	id_entrance int4 NOT NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT h_location_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_location_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_location_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_location_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_location_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT h_location_t_location FOREIGN KEY (id) REFERENCES t_location(id)
);


-- h_rigging definition

-- Drop table

-- DROP TABLE h_rigging;

CREATE TABLE h_rigging (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	relevance int2 NOT NULL,
	title varchar(300) NOT NULL,
	obstacles varchar(2000) NULL,
	ropes varchar(2000) NULL,
	anchors varchar(2000) NULL,
	observations varchar(2000) NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_point int4 NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT h_rigging_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_rigging_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_rigging_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_rigging_t_entrance1_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT h_rigging_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_rigging_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT h_rigging_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id),
	CONSTRAINT h_rigging_t_rigging FOREIGN KEY (id) REFERENCES t_rigging(id)
);


-- j_entrance_caver definition

-- Drop table

-- DROP TABLE j_entrance_caver;

CREATE TABLE j_entrance_caver (
	id_entrance int4 NOT NULL,
	id_caver int4 NOT NULL,
	CONSTRAINT j_entrance_caver_pk PRIMARY KEY (id_entrance, id_caver),
	CONSTRAINT j_entrance_caver_t_caver0_fk FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_entrance_caver_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id)
);


-- j_grotto_cave_explorer definition

-- Drop table

-- DROP TABLE j_grotto_cave_explorer;

CREATE TABLE j_grotto_cave_explorer (
	id_cave int4 NOT NULL,
	id_grotto int4 NOT NULL,
	CONSTRAINT j_grotto_cave_explorer_pk PRIMARY KEY (id_cave, id_grotto),
	CONSTRAINT j_grotto_cave_explorer_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT j_grotto_cave_explorer_t_grotto0_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


-- j_grotto_cave_partner definition

-- Drop table

-- DROP TABLE j_grotto_cave_partner;

CREATE TABLE j_grotto_cave_partner (
	id_grotto int4 NOT NULL,
	id_cave int4 NOT NULL,
	CONSTRAINT j_grotto_cave_partner_pk PRIMARY KEY (id_grotto, id_cave),
	CONSTRAINT j_grotto_cave_partner_t_cave0_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT j_grotto_cave_partner_t_grotto_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


-- t_comment definition

-- Drop table

-- DROP TABLE t_comment;

CREATE TABLE t_comment (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	relevance int2 NOT NULL,
	e_t_underground interval(6) NULL,
	e_t_trail interval(6) NULL,
	aestheticism float8 NULL,
	caving float8 NULL,
	approach float8 NULL,
	title varchar(300) NOT NULL,
	body text NOT NULL,
	alert bool NOT NULL DEFAULT false,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_language bpchar(3) NOT NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_comment_pk PRIMARY KEY (id),
	CONSTRAINT t_comment_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_comment_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_comment_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_comment_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_comment_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_comment_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);

-- t_document definition

-- Drop table

-- DROP TABLE t_document;

CREATE TABLE t_document (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	id_validator int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_validation timestamp NULL,
	date_publication varchar(10) NULL,
	is_validated bool NOT NULL DEFAULT false,
	validation_comment varchar(300) NULL,
	pages varchar(100) NULL,
	identifier varchar(250) NULL,
	issue varchar(100) NULL,
	id_identifier_type bpchar(5) NULL,
	ref_bbs bpchar(10) NULL,
	id_entrance int4 NULL,
	id_massif int4 NULL,
	id_cave int4 NULL,
	id_author_caver int4 NULL,
	id_author_grotto int4 NULL,
	id_editor int4 NULL,
	id_library int4 NULL,
	id_type int2 NOT NULL,
	id_parent int4 NULL,
	id_license int2 NOT NULL DEFAULT 1,
	pages_bbs_old varchar(100) NULL,
	comments_bbs_old varchar(500) NULL,
	publication_other_bbs_old varchar(500) NULL,
	publication_fascicule_bbs_old varchar(300) NULL,
	author_comment varchar(300) NULL,
	date_reviewed timestamp NULL,
	is_deleted bool NOT NULL DEFAULT false,
	redirect_to int4 NULL,
	CONSTRAINT t_document_check CHECK (((id_type = ANY (ARRAY[16, 17])) OR (issue IS NULL))),
	CONSTRAINT t_document_pk PRIMARY KEY (id),
	CONSTRAINT t_document_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_document_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_caver3_fk FOREIGN KEY (id_validator) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_caver4_fk FOREIGN KEY (id_author_caver) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_document2_fk FOREIGN KEY (redirect_to) REFERENCES t_document(id),
	CONSTRAINT t_document_t_document_fk FOREIGN KEY (id_parent) REFERENCES t_document(id),
	CONSTRAINT t_document_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_document_t_grotto2_fk FOREIGN KEY (id_editor) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_grotto3_fk FOREIGN KEY (id_library) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_grotto_fk FOREIGN KEY (id_author_grotto) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_identifier_type_fk FOREIGN KEY (id_identifier_type) REFERENCES t_identifier_type(code),
	CONSTRAINT t_document_t_license_fk FOREIGN KEY (id_license) REFERENCES t_license(id),
	CONSTRAINT t_document_t_massif_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_document_t_type_fk FOREIGN KEY (id_type) REFERENCES t_type(id)
);

-- t_file definition

-- Drop table

-- DROP TABLE t_file;

CREATE TABLE t_file (
	id serial NOT NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	filename varchar(200) NOT NULL,
	id_file_format int4 NOT NULL,
	id_document int4 NOT NULL,
	path_old varchar(1000) NULL,
	CONSTRAINT t_file_pk PRIMARY KEY (id),
	CONSTRAINT t_file_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT t_file_t_file_format_fk FOREIGN KEY (id_file_format) REFERENCES t_file_format(id)
);


-- t_history definition

-- Drop table

-- DROP TABLE t_history;

CREATE TABLE t_history (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	relevance int2 NOT NULL,
	body text NOT NULL,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_point int4 NULL,
	id_language bpchar(3) NOT NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_history_pk PRIMARY KEY (id),
	CONSTRAINT t_history_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_history_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_history_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_history_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_history_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_history_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);

-- t_junction definition

-- Drop table

-- DROP TABLE t_junction;

CREATE TABLE t_junction (
	id_cave_main int4 NOT NULL,
	id_cave_add int4 NOT NULL,
	id_point int4 NOT NULL,
	CONSTRAINT t_junction_pk PRIMARY KEY (id_cave_main, id_cave_add, id_point),
	CONSTRAINT t_junction_t_cave2_fk FOREIGN KEY (id_cave_add) REFERENCES t_cave(id),
	CONSTRAINT t_junction_t_cave_fk FOREIGN KEY (id_cave_main) REFERENCES t_cave(id),
	CONSTRAINT t_junction_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);


-- t_name definition

-- Drop table

-- DROP TABLE t_name;

CREATE TABLE t_name (
	id serial NOT NULL,
	"name" varchar(100) NULL,
	is_main bool NOT NULL DEFAULT false,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	id_language bpchar(3) NOT NULL,
	id_entrance int4 NULL,
	id_cave int4 NULL,
	id_massif int4 NULL,
	id_point int4 NULL,
	id_grotto int4 NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_name_pk PRIMARY KEY (id),
	CONSTRAINT t_name_t_cave0_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_name_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_name_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_name_t_grotto0_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
	CONSTRAINT t_name_t_language_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_name_t_massif0_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_name_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);

-- h_comment definition

-- Drop table

-- DROP TABLE h_comment;

CREATE TABLE h_comment (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	relevance int2 NOT NULL,
	e_t_underground interval(6) NULL,
	e_t_trail interval(6) NULL,
	aestheticism float8 NULL,
	caving float8 NULL,
	approach float8 NULL,
	title varchar(300) NOT NULL,
	body text NOT NULL,
	alert bool NOT NULL DEFAULT false,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT h_comment_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_comment_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_comment_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_comment_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_comment_t_comment FOREIGN KEY (id) REFERENCES t_comment(id),
	CONSTRAINT h_comment_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_comment_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT h_comment_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);


-- h_document definition

-- Drop table

-- DROP TABLE h_document;

CREATE TABLE h_document (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	id_validator int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_validation timestamp NULL,
	date_publication varchar(10) NULL,
	is_validated bool NOT NULL DEFAULT false,
	validation_comment varchar(300) NULL,
	pages varchar(100) NULL,
	identifier varchar(250) NULL,
	issue varchar(100) NULL,
	id_identifier_type bpchar(5) NULL,
	ref_bbs bpchar(10) NULL,
	id_entrance int4 NULL,
	id_massif int4 NULL,
	id_cave int4 NULL,
	id_author_caver int4 NULL,
	id_author_grotto int4 NULL,
	id_editor int4 NULL,
	id_library int4 NULL,
	id_type int2 NOT NULL,
	id_parent int4 NULL,
	id_license int2 NOT NULL DEFAULT 1,
	pages_bbs_old varchar(100) NULL,
	comments_bbs_old varchar(500) NULL,
	publication_other_bbs_old varchar(500) NULL,
	publication_fascicule_bbs_old varchar(300) NULL,
	author_comment varchar(300) NULL,
	date_reviewed timestamp NOT NULL,
	CONSTRAINT h_document_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_document_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_document_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_document_t_caver3_fk FOREIGN KEY (id_validator) REFERENCES t_caver(id),
	CONSTRAINT h_document_t_caver4_fk FOREIGN KEY (id_author_caver) REFERENCES t_caver(id),
	CONSTRAINT h_document_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_document_t_document FOREIGN KEY (id) REFERENCES t_document(id),
	CONSTRAINT h_document_t_document_fk FOREIGN KEY (id_parent) REFERENCES t_document(id),
	CONSTRAINT h_document_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_document_t_grotto2_fk FOREIGN KEY (id_editor) REFERENCES t_grotto(id),
	CONSTRAINT h_document_t_grotto3_fk FOREIGN KEY (id_library) REFERENCES t_grotto(id),
	CONSTRAINT h_document_t_grotto_fk FOREIGN KEY (id_author_grotto) REFERENCES t_grotto(id),
	CONSTRAINT h_document_t_identifier_type_fk FOREIGN KEY (id_identifier_type) REFERENCES t_identifier_type(code),
	CONSTRAINT h_document_t_license_fk FOREIGN KEY (id_license) REFERENCES t_license(id),
	CONSTRAINT h_document_t_massif_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT h_document_t_type_fk FOREIGN KEY (id_type) REFERENCES t_type(id)
);


-- h_history definition

-- Drop table

-- DROP TABLE h_history;

CREATE TABLE h_history (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	relevance int2 NOT NULL,
	body text NOT NULL,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_point int4 NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT h_history_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_history_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_history_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_history_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_history_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_history_t_history FOREIGN KEY (id) REFERENCES t_history(id),
	CONSTRAINT h_history_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT h_history_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);


-- h_name definition

-- Drop table

-- DROP TABLE h_name;

CREATE TABLE h_name (
	id serial NOT NULL,
	"name" varchar(100) NULL,
	is_main bool NOT NULL DEFAULT false,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	id_language bpchar(3) NOT NULL,
	id_entrance int4 NULL,
	id_cave int4 NULL,
	id_massif int4 NULL,
	id_point int4 NULL,
	id_grotto int4 NULL,
	CONSTRAINT h_name_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_name_t_cave0_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_name_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_name_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_name_t_grotto0_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
	CONSTRAINT h_name_t_language_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT h_name_t_massif0_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT h_name_t_name FOREIGN KEY (id) REFERENCES t_name(id),
	CONSTRAINT h_name_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);


-- j_document_caver_author definition

-- Drop table

-- DROP TABLE j_document_caver_author;

CREATE TABLE j_document_caver_author (
	id_document int4 NOT NULL,
	id_caver int4 NOT NULL,
	CONSTRAINT j_document_caver_author_pk PRIMARY KEY (id_document, id_caver),
	CONSTRAINT j_document_caver_author_t_caver_fk FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_document_caver_author_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id)
);


-- j_document_grotto_author definition

-- Drop table

-- DROP TABLE j_document_grotto_author;

CREATE TABLE j_document_grotto_author (
	id_document int4 NOT NULL,
	id_grotto int4 NOT NULL,
	CONSTRAINT j_document_grotto_author_pk PRIMARY KEY (id_document, id_grotto),
	CONSTRAINT j_document_grotto_author_t_caver_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
	CONSTRAINT j_document_grotto_author_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id)
);


-- j_document_language definition

-- Drop table

-- DROP TABLE j_document_language;

CREATE TABLE j_document_language (
	id_document int4 NOT NULL,
	id_language bpchar(3) NOT NULL,
	is_main bool NOT NULL DEFAULT false,
	CONSTRAINT j_document_language_pk PRIMARY KEY (id_document, id_language),
	CONSTRAINT j_document_language_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_language_t_language_fk FOREIGN KEY (id_language) REFERENCES t_language(id)
);


-- j_document_region definition

-- Drop table

-- DROP TABLE j_document_region;

CREATE TABLE j_document_region (
	id_document int4 NOT NULL,
	id_region int4 NOT NULL,
	CONSTRAINT j_document_region_pk PRIMARY KEY (id_document, id_region),
	CONSTRAINT j_document_region_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_region_t_region_fk FOREIGN KEY (id_region) REFERENCES t_region(id)
);


-- j_document_subject definition

-- Drop table

-- DROP TABLE j_document_subject;

CREATE TABLE j_document_subject (
	id_document int4 NOT NULL,
	code_subject bpchar(5) NOT NULL,
	CONSTRAINT j_document_subject_pk PRIMARY KEY (id_document, code_subject),
	CONSTRAINT j_document_subject_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_subject_t_subject_fk FOREIGN KEY (code_subject) REFERENCES t_subject(code)
);


-- t_description definition

-- Drop table

-- DROP TABLE t_description;

CREATE TABLE t_description (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NULL,
	relevance int2 NOT NULL DEFAULT 0,
	title varchar(300) NOT NULL,
	body text NULL,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_massif int4 NULL,
	id_point int4 NULL,
	id_document int4 NULL,
	id_language bpchar(3) NOT NULL,
	is_deleted bool NOT NULL DEFAULT false,
	CONSTRAINT t_description_pk PRIMARY KEY (id),
	CONSTRAINT t_description_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_description_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_description_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_description_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT t_description_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_description_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_description_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_description_t_massif3_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_description_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);

-- h_description definition

-- Drop table

-- DROP TABLE h_description;

CREATE TABLE h_description (
	id serial NOT NULL,
	id_author int4 NOT NULL,
	id_reviewer int4 NULL,
	date_inscription timestamp NOT NULL DEFAULT now(),
	date_reviewed timestamp NOT NULL,
	relevance int2 NOT NULL DEFAULT 0,
	title varchar(300) NOT NULL,
	body text NULL,
	id_cave int4 NULL,
	id_entrance int4 NULL,
	id_exit int4 NULL,
	id_massif int4 NULL,
	id_point int4 NULL,
	id_document int4 NULL,
	id_language bpchar(3) NOT NULL,
	CONSTRAINT h_description_pk PRIMARY KEY (id, date_reviewed),
	CONSTRAINT h_description_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT h_description_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT h_description_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT h_description_t_description FOREIGN KEY (id) REFERENCES t_description(id),
	CONSTRAINT h_description_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT h_description_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT h_description_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT h_description_t_language0_fk FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT h_description_t_massif3_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT h_description_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id)
);
