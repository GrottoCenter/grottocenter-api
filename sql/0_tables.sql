-----------------------------------------------------------
-- Create structure in Postgre 
-- Version v3.06 - 20200901 - V. Verdon
------------------------------------------------------------
-- use before postgre_injection.sql


------------------------------------------------------------
-- Table: t_country
------------------------------------------------------------
CREATE TABLE t_country(
	iso           CHAR (2) NOT NULL,
	iso3          CHAR(3) NOT NULL,
	numeric       INTEGER NOT NULL,
	latitude      DECIMAL (24,20),
	longitude     DECIMAL (24,20),
	native_name   VARCHAR (50),
	en_name       VARCHAR (50) NOT NULL ,
	fr_name       VARCHAR (50) NOT NULL ,
	es_name       VARCHAR (50) NOT NULL ,
	de_name       VARCHAR (50) NOT NULL ,
	bg_name       VARCHAR (50) NOT NULL ,
	it_name       VARCHAR (50) NOT NULL ,
	ca_name       VARCHAR (50) NOT NULL ,
	nl_name       VARCHAR (50) NOT NULL ,
	rs_name       VARCHAR (50) NOT NULL
	CONSTRAINT t_country_PK PRIMARY KEY (Iso)
);


------------------------------------------------------------
-- Table: t_language
------------------------------------------------------------
CREATE TABLE t_language(
	id         CHAR (3)  NOT NULL ,
	part2B     CHAR (3)   ,
	part2T     CHAR (3)   ,
	part1      CHAR (2)   ,
	scope      CHAR (1)  NOT NULL ,
	type       CHAR (1)  NOT NULL ,
	ref_name   VARCHAR (150) NOT NULL ,
	comment    VARCHAR (150)   ,
    is_prefered   boolean not null default false,
	CONSTRAINT t_language_PK PRIMARY KEY (id)
);


------------------------------------------------------------
-- Table: j_country_language
------------------------------------------------------------
CREATE TABLE j_country_language(
	id_country          CHAR(2)  NOT NULL ,
	id_language         CHAR (3)  NOT NULL ,
	is_official         BOOL  NOT NULL  ,
	is_main 			BOOL NOT NULL DEFAULT FALSE,
	CONSTRAINT j_country_language_PK PRIMARY KEY (id_country,id_language)
	,CONSTRAINT j_country_language0_FK FOREIGN KEY (id_country) REFERENCES t_country(Iso)
	,CONSTRAINT j_country_language1_FK FOREIGN KEY (id_language) REFERENCES t_language(id)
);


------------------------------------------------------------
-- Table: t_type
------------------------------------------------------------
CREATE TABLE t_type(
	id        INT2  NOT NULL,
	name      VARCHAR (30) NOT NULL,
	comment   VARCHAR (500),
	id_parent INT2,
	CONSTRAINT t_type_PK PRIMARY KEY (id),
	CONSTRAINT t_type_FK FOREIGN KEY (id_parent) REFERENCES t_type(id)
);

------------------------------------------------------------
-- Table: t_subject
------------------------------------------------------------
CREATE TABLE t_subject(
	code         CHAR(5)  NOT NULL,
	subject      VARCHAR (300) NOT NULL,
	code_parent  CHAR(5),
	CONSTRAINT t_subject_PK PRIMARY KEY (code),
	CONSTRAINT t_subject_FK FOREIGN KEY (code_parent) REFERENCES t_subject(code)
);


------------------------------------------------------------
-- Table: t_file_format
------------------------------------------------------------
CREATE TABLE t_file_format(
	id serial2 not null,
	extension      CHAR (12),
	comment        VARCHAR (250),
	mime_type      VARCHAR (100),
	softwares   VARCHAR (300),
	CONSTRAINT t_file_format_PK PRIMARY KEY (id)
);


------------------------------------------------------------
-- Table: t_geology
------------------------------------------------------------
CREATE TABLE t_geology(
	id        CHAR(10) NOT NULL ,
	label     VARCHAR (500) NOT NULL ,
	id_parent CHAR(10) NOT NULL ,
	CONSTRAINT t_geology_PK PRIMARY KEY (id),
	CONSTRAINT t_geology_FK FOREIGN KEY (id) REFERENCES t_geology(id)
);


------------------------------------------------------------
-- Table: t_license
------------------------------------------------------------
CREATE TABLE t_license(
	id		SERIAL2 NOT NULL,
	name	VARCHAR (30) NOT NULL,
	text	text,
	CONSTRAINT t_license_PK PRIMARY KEY (id)
);

------------------------------------------------------------
-- Table: j_license_type
------------------------------------------------------------
CREATE TABLE j_license_type(
	id_license		INT2 NOT NULL,
	id_type			INT2 NOT NULL,
	CONSTRAINT j_license_type_PK PRIMARY KEY (id_license,id_type),
	CONSTRAINT j_license_type_t_license_FK FOREIGN KEY (id_license) REFERENCES t_license(id),
	CONSTRAINT j_license_type_t_type_FK FOREIGN KEY (id_type) REFERENCES t_type(id)
);

------------------------------------------------------------
-- Table: t_identifier_type
------------------------------------------------------------
CREATE TABLE t_identifier_type(
	code		CHAR(5) NOT NULL,
	text		VARCHAR (250) NOT NULL,
	regexp		VARCHAR (250) NOT NULL,
	CONSTRAINT t_identifier_type_PK PRIMARY KEY (code)
);


------------------------------------------------------------
-- Table: t_region
------------------------------------------------------------
CREATE TABLE t_region(
	id 				serial NOT NULL,
	code 			varchar(20) not null,
	is_deprecated	BOOLEAN NOT NULL DEFAULT false,
	name varchar(300),
	id_country CHAR(2) NOT NULL,
	CONSTRAINT t_region_PK PRIMARY KEY (id),
	CONSTRAINT t_region_t_country_FK FOREIGN KEY (id_country) REFERENCES t_country(iso)
);


------------------------------------------------------------
-- Table: t_caver
------------------------------------------------------------
CREATE TABLE t_caver(
	id                     serial  NOT NULL ,
	login                  VARCHAR (20) unique ,
	password               VARCHAR (64)  ,	
	activated              bool not null default false ,
	activation_code        VARCHAR (64),
	banned                 bool not null default false  ,
	connection_counter     INT  NOT NULL default 0,
	relevance              INT2  NOT NULL default 0,
	name                   VARCHAR (36)  ,
	surname                VARCHAR (32)  ,
	nickname               VARCHAR (68) NOT NULL ,
	mail                   VARCHAR (50) NOT NULL ,	
	mail_is_valid          bool not null default true ,
	date_inscription       timestamp not null default now() ,
	date_last_connection   timestamp   ,
	alert_for_news         bool not null default false ,
	show_links             bool not null default false  ,
	detail_level           INT,
	default_zoom           INT,
	id_language            CHAR (3)  NOT NULL,
	CONSTRAINT t_caver_PK PRIMARY KEY (id),
	CONSTRAINT t_caver_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id)
);
--index pour accélérer la recherche suivant le login
CREATE INDEX t_caver_idx ON t_caver (Login);


------------------------------------------------------------
-- Table: t_group
------------------------------------------------------------
CREATE TABLE t_group(
	id         serial2  NOT NULL ,
	name       VARCHAR (200) NOT NULL ,
	comments   VARCHAR (1000)  ,
	CONSTRAINT t_group_PK PRIMARY KEY (id)
);


------------------------------------------------------------
-- Table: t_right
------------------------------------------------------------
CREATE TABLE t_right(
	id         serial2  NOT NULL ,
	name       VARCHAR (200) NOT NULL ,
	comments   VARCHAR (1000)   ,
	CONSTRAINT t_right_PK PRIMARY KEY (id)
);


------------------------------------------------------------
-- Table: t_grotto
------------------------------------------------------------
CREATE TABLE t_grotto(
	id                          serial  NOT NULL ,
	id_author                   INT  NOT NULL ,
	id_reviewer                 INT   ,
	village                     VARCHAR (100)  ,
	county                      VARCHAR (100)  ,
	region                      VARCHAR (100)  ,
	city                        VARCHAR (100)  ,
	postal_code                 VARCHAR (5)  ,
	address                     VARCHAR (200)  ,
	mail                     	VARCHAR (50)  ,
	year_birth                  int2  ,
	date_inscription            timestamp  not null default now() ,
	date_reviewed               timestamp   ,
	latitude                    DECIMAL (24,20)   ,
	longitude                   DECIMAL (24,20)   ,
	custom_message              VARCHAR (2000)   ,
	is_official_partner         BOOL  not null default false ,
	url                         VARCHAR (200)  ,
	id_country                  CHAR (2) NOT NULL ,
	CONSTRAINT t_grotto_PK PRIMARY KEY (id),
	CONSTRAINT t_grotto_t_country_FK FOREIGN KEY (id_country) REFERENCES t_country(iso),
	CONSTRAINT t_grotto_t_caver4_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_grotto_t_caver5_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_massif
------------------------------------------------------------
CREATE TABLE t_massif(
	id                 serial  NOT NULL ,
	id_author          INT  NOT NULL ,
	id_reviewer        INT   ,
	date_inscription   timestamp  not null default now() ,
	date_reviewed      timestamp   ,
	geometry_kml       VARCHAR (2000)    ,
	CONSTRAINT t_massif_PK PRIMARY KEY (id),
	CONSTRAINT t_massif_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_massif_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_cave
------------------------------------------------------------
CREATE TABLE t_cave(
	id                 serial  NOT NULL ,
	id_author          INT  NOT NULL ,
	id_reviewer        INT   ,
	min_depth          int   ,
	max_depth          int   ,
	depth              int   ,
	length             int   ,
	is_diving          bool not null default false ,
	temperature        FLOAT   ,
	date_inscription   timestamp  not null default now() ,
	date_reviewed      timestamp   ,
	longitude          DECIMAL (24,20) ,
	latitude           DECIMAL (24,20) ,
	id_massif          INT  NOT NULL ,
	CONSTRAINT t_cave_PK PRIMARY KEY (id),
	CONSTRAINT t_cave_t_massif0_FK FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_cave_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_cave_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_entrance
------------------------------------------------------------
CREATE TABLE t_entrance(
	id                  serial  NOT NULL ,
	type                CHAR (8)  NOT NULL check(Type in ('entrance','loss','emerg','outcrop')) default 'entrance',
	id_author           INT  NOT NULL ,
	id_reviewer         INT   ,
	region              VARCHAR (100)  ,
	county              VARCHAR (100)  ,
	village             VARCHAR (100)  ,
	city                VARCHAR (100)  ,
	address             VARCHAR (200)  ,
	year_discovery      INT2   ,
	external_url        VARCHAR (2000)   ,
	date_inscription    timestamp  not null default now() ,
	date_reviewed       timestamp   ,
	is_public           bool ,
	is_sensitive        bool not null default false ,
	contact             VARCHAR (1000)  ,
	modalities          VARCHAR (100) NOT NULL ,
	has_contributions   bool not null default false ,
	latitude            DECIMAL (24,20)  NOT NULL ,
	longitude           DECIMAL (24,20)  NOT NULL ,
	altitude            INT2   ,
	is_of_interest      BOOL   ,
	id_cave           	INT   ,
	id_country          CHAR (2) NOT NULL  ,
	id_geology          CHAR(10) NOT NULL default 'Q35758',
	CONSTRAINT t_entrance_PK PRIMARY KEY (id),
	CONSTRAINT t_entrance_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_entrance_t_country_FK FOREIGN KEY (id_country) REFERENCES t_country(Iso),
	CONSTRAINT t_entrance_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_entrance_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_entrance_t_geology_FK FOREIGN KEY (id_geology) REFERENCES t_geology(id)
);


------------------------------------------------------------
-- Table: t_point
------------------------------------------------------------
CREATE TABLE t_point(
	id                  serial  NOT NULL ,
	type                CHAR (8)  NOT NULL check(Type in ('a','b','c')) default 'a',
	id_author           INT  NOT NULL ,
	id_reviewer         INT   ,
	year_discovery      INT2   ,
	date_inscription    timestamp  not null default now() ,
	date_reviewed       timestamp   ,
	rel_latitude            DECIMAL (24,20)  NOT NULL ,
	rel_longitude           DECIMAL (24,20)  NOT NULL ,
	rel_depth            INT2   ,
	id_entrance           	INT   ,
	id_geology          CHAR(10) NOT NULL default 'Q35758',
	CONSTRAINT t_point_PK PRIMARY KEY (id),
	CONSTRAINT t_point_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_point_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_point_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_point_t_geology_FK FOREIGN KEY (id_geology) REFERENCES t_geology(id)
);


------------------------------------------------------------
-- Table: t_junction
------------------------------------------------------------
CREATE TABLE t_junction(
	id_cave_main	INT NOT NULL,
	id_cave_add		INT NOT NULL,
	id_point		INT NOT NULL,
	CONSTRAINT t_junction_PK PRIMARY KEY (id_cave_main,id_cave_add,id_point),
	CONSTRAINT t_junction_t_cave_FK FOREIGN KEY (id_cave_main) REFERENCES t_cave(id),
	CONSTRAINT t_junction_t_cave2_FK FOREIGN KEY (id_cave_add) REFERENCES t_cave(id),	
	CONSTRAINT t_junction_t_point_FK FOREIGN KEY (id_point) REFERENCES t_point(id)
);


------------------------------------------------------------
-- Table: t_document
------------------------------------------------------------
CREATE TABLE t_document(
	id                 SERIAL NOT NULL,
	id_author          INT NOT NULL,
	id_reviewer        INT,
	id_validator       INT,
	date_inscription   timestamp  not null default now(),
	date_validation    timestamp,
	date_publication   date,
    is_validated       boolean not null default false,
    validation_comment varchar(300),    
	pages        	   VARCHAR(100),
	identifier		   VARCHAR (250),
    id_identifier_type CHAR(5),
	ref_bbs			   CHAR(10),
	id_entrance		   INT,
	id_massif		   INT,
	id_cave            INT,
	id_author_caver    INT,
	id_author_grotto   INT,
	id_editor		   INT,
	id_library		   INT,
	id_type			   INT2 NOT NULL,
	id_parent		   INT,
	id_license		   INT2 NOT NULL DEFAULT 1,
	CONSTRAINT t_document_PK PRIMARY KEY (id),
	CONSTRAINT t_document_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_document_t_massif_FK FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_document_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_document_t_caver4_FK FOREIGN KEY (id_author_caver) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_grotto_FK FOREIGN KEY (id_author_grotto) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_grotto2_FK FOREIGN KEY (id_editor) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_grotto3_FK FOREIGN KEY (id_library) REFERENCES t_grotto(id),
	CONSTRAINT t_document_t_type_FK FOREIGN KEY (id_type) REFERENCES t_type(id),
	CONSTRAINT t_document_t_document_FK FOREIGN KEY (id_parent) REFERENCES t_document(id),
	CONSTRAINT t_document_t_identifier_type_FK FOREIGN KEY (id_identifier_type) REFERENCES t_identifier_type(code),
	CONSTRAINT t_document_t_license_FK FOREIGN KEY (id_license) REFERENCES t_license(id),
	CONSTRAINT t_document_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
	CONSTRAINT t_document_t_caver3_FK FOREIGN KEY (id_validator) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: j_document_subject
------------------------------------------------------------
CREATE TABLE j_document_subject(
	id_document		INT NOT NULL,
	code_subject	CHAR(5) NOT NULL,
	CONSTRAINT j_document_subject_PK PRIMARY KEY (id_document,code_subject),
	CONSTRAINT j_document_subject_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_subject_t_subject_FK FOREIGN KEY (code_subject) REFERENCES t_subject(code)
);


------------------------------------------------------------
-- Table: j_document_language
------------------------------------------------------------
CREATE TABLE j_document_language(
	id_document		INT NOT NULL,
	id_language		CHAR(3) NOT NULL,
	is_main			BOOLEAN NOT NULL DEFAULT FALSE,
	CONSTRAINT j_document_language_PK PRIMARY KEY (id_document,id_language),
	CONSTRAINT j_document_language_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_language_t_language_FK FOREIGN KEY (id_language) REFERENCES t_language(id)
);


------------------------------------------------------------
-- Table: j_document_region
------------------------------------------------------------
CREATE TABLE j_document_region(
	id_document		INT NOT NULL,
	id_region		INT NOT NULL,
	CONSTRAINT j_document_region_PK PRIMARY KEY (id_document,id_region),
	CONSTRAINT j_document_region_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_region_t_region_FK FOREIGN KEY (id_region) REFERENCES t_region(id)
);


------------------------------------------------------------
-- Table: j_document_caver_author
------------------------------------------------------------
CREATE TABLE j_document_caver_author(
	id_document		INT NOT NULL,
	id_caver		INT NOT NULL,
	CONSTRAINT j_document_caver_author_PK PRIMARY KEY (id_document,id_caver),
	CONSTRAINT j_document_caver_author_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_caver_author_t_caver_FK FOREIGN KEY (id_caver) REFERENCES t_caver(id)
);


-----------------------------------------------------------
-- Table: j_document_grotto_author
------------------------------------------------------------
CREATE TABLE j_document_grotto_author(
	id_document		INT NOT NULL,
	id_grotto		INT NOT NULL,
	CONSTRAINT j_document_grotto_author_PK PRIMARY KEY (id_document,id_grotto),
	CONSTRAINT j_document_grotto_author_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT j_document_grotto_author_t_caver_FK FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


------------------------------------------------------------
-- Table: t_history
------------------------------------------------------------
CREATE TABLE t_history(
	id                 serial  NOT NULL ,
	id_author          INT  NOT NULL ,
	id_reviewer        INT   ,
	date_inscription   timestamp not null default now()  ,
	date_reviewed      timestamp   ,
	relevance          INT2  NOT NULL ,
	body               text  NOT NULL ,
	id_cave          INT,
	id_entrance		 INT,
	id_point       INT,
	id_language      CHAR (3)  NOT NULL ,
	CONSTRAINT t_history_PK PRIMARY KEY (id),
	CONSTRAINT t_history_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_history_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_history_t_point_FK FOREIGN KEY (id_point) REFERENCES t_point(id),
	CONSTRAINT t_history_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_history_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_history_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_location
------------------------------------------------------------
CREATE TABLE t_location(
	id                 serial  NOT NULL ,
	id_author          INT  NOT NULL ,
	id_reviewer        INT   ,
	date_inscription   timestamp not null default now()  ,
	date_reviewed      timestamp   ,
	relevance          INT2  NOT NULL ,
	body               text  NOT NULL ,
	id_entrance         INT  NOT NULL ,
	id_language      CHAR (3)  NOT NULL  ,
	CONSTRAINT t_location_PK PRIMARY KEY (id),
	CONSTRAINT t_location_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_location_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_location_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_location_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_name
------------------------------------------------------------
CREATE TABLE t_name(
	id                 SERIAL NOT NULL ,
	Name               VARCHAR (100)  ,
	is_main            BOOL  NOT NULL DEFAULT FALSE,
	id_author          int NOT NULL ,
	id_reviewer        int  ,
	date_inscription   timestamp  NOT NULL default now() ,
	date_reviewed      timestamp   ,
	id_language        CHAR(3) NOT NULL,
	id_entrance        INT,
	id_cave            INT,
	id_massif		   INT,
	id_point		   INT,
	id_grotto          INT,
	CONSTRAINT t_name_PK PRIMARY KEY (id),
	CONSTRAINT t_name_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_name_t_language_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_name_t_cave0_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_name_t_point_FK FOREIGN KEY (id_point) REFERENCES t_point(id),
	CONSTRAINT t_name_t_massif0_FK FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_name_t_grotto0_FK FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
	CONSTRAINT t_name_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_comment
------------------------------------------------------------
CREATE TABLE t_comment(
	id                   serial  NOT NULL ,
	id_author            INT  NOT NULL ,
	id_reviewer          INT   ,
	date_inscription     timestamp  not null default now() ,
	date_reviewed        timestamp   ,
	relevance            INT2  NOT NULL ,
	e_t_underground      interval   ,
	e_t_trail            interval   ,
	aestheticism         float  ,
	caving               FLOAT   ,
	approach             FLOAT   ,
	title                VARCHAR (300) NOT NULL ,
	body                 text  NOT NULL ,
	alert                bool not null default false ,
	id_cave              INT   ,
	id_entrance          INT   ,
	id_exit              INT,
	id_language          CHAR (3)  NOT NULL,
	CONSTRAINT t_comment_PK PRIMARY KEY (id),
	CONSTRAINT t_comment_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_comment_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_comment_t_entrance1_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_comment_t_entrance2_FK FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_comment_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_comment_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_description
------------------------------------------------------------
CREATE TABLE t_description(
	id                   serial  NOT NULL,
	id_author            INT  NOT NULL,
	id_reviewer          INT,
	date_inscription     timestamp  not null default now(),
	date_reviewed        timestamp,
	relevance            INT2  NOT NULL default 0,
	title                VARCHAR (300) NOT NULL,
	body                 text  ,
	id_cave              INT,
	id_entrance          INT,
	id_exit              INT,
	id_massif            INT,
	id_point             INT,
	id_document			 INT,
	id_language          CHAR (3)  NOT NULL ,
	CONSTRAINT t_description_PK PRIMARY KEY (id),
	CONSTRAINT t_description_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT t_description_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_description_t_entrance1_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_description_t_entrance2_FK FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_description_t_massif3_FK FOREIGN KEY (id_massif) REFERENCES t_massif(id),
	CONSTRAINT t_description_t_point_FK FOREIGN KEY (id_point) REFERENCES t_point(id),
	CONSTRAINT t_description_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id),
	CONSTRAINT t_description_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_description_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_rigging
------------------------------------------------------------
CREATE TABLE t_rigging(
	id                   serial  NOT NULL ,
	id_author            INT  NOT NULL ,
	id_reviewer          INT   ,
	date_inscription     timestamp not null default now()  ,
	date_reviewed        timestamp   ,
	relevance            INT2  NOT NULL ,
	title                VARCHAR (300) NOT NULL ,
	obstacles            VARCHAR (2000)   ,
	ropes                VARCHAR (2000)   ,
	anchors              VARCHAR (2000)   ,
	observations         VARCHAR (2000)   ,
	id_entrance          INT   ,
	id_exit              INT   ,
	id_point             INT   ,
	id_language        CHAR (3)  NOT NULL ,
	CONSTRAINT t_rigging_PK PRIMARY KEY (id),
	CONSTRAINT t_rigging_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT t_rigging_t_entrance1_FK FOREIGN KEY (id_exit) REFERENCES t_entrance(id),
	CONSTRAINT t_rigging_t_point_FK FOREIGN KEY (id_point) REFERENCES t_point(id),
	CONSTRAINT t_rigging_t_language0_FK FOREIGN KEY (id_language) REFERENCES t_language(id),
	CONSTRAINT t_rigging_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_rigging_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: t_file
------------------------------------------------------------
CREATE TABLE t_file(
	id                   SERIAL NOT NULL ,
	date_inscription     timestamp  not null default now()  ,
	date_reviewed        timestamp   ,
	filename             varchar(200) NOT NULL,
	id_file_format       INT  NOT NULL ,
	id_document          INT  NOT NULL ,
	CONSTRAINT t_file_PK PRIMARY KEY (id),
	CONSTRAINT t_file_t_file_format_FK FOREIGN KEY (id_file_format) REFERENCES t_file_format(id),
	CONSTRAINT t_file_t_document_FK FOREIGN KEY (id_document) REFERENCES t_document(id)
);


------------------------------------------------------------
-- Table: j_grotto_caver
------------------------------------------------------------
CREATE TABLE j_grotto_caver(
	id_caver		INT  NOT NULL ,
	id_grotto		INT  NOT NULL  ,
	CONSTRAINT j_grotto_caver_PK PRIMARY KEY (id_caver,id_grotto),
	CONSTRAINT j_grotto_caver_t_caver_FK FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_grotto_caver_t_grotto0_FK FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


------------------------------------------------------------
-- Table: j_grotto_cave_explorer
------------------------------------------------------------
CREATE TABLE j_grotto_cave_explorer(
	id_cave		INT  NOT NULL ,
	id_grotto   INT  NOT NULL  ,
	CONSTRAINT j_grotto_cave_explorer_PK PRIMARY KEY (id_cave,id_grotto),
	CONSTRAINT j_grotto_cave_explorer_t_cave_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id),
	CONSTRAINT j_grotto_cave_explorer_t_grotto0_FK FOREIGN KEY (id_grotto) REFERENCES t_grotto(id)
);


------------------------------------------------------------
-- Table: j_group_right
------------------------------------------------------------
CREATE TABLE j_group_right(
	id_group   	INT2  NOT NULL ,
	id_right   	INT2  NOT NULL  ,
	CONSTRAINT j_group_right_PK PRIMARY KEY (id_group,id_right),
	CONSTRAINT j_group_right_t_group_FK FOREIGN KEY (id_group) REFERENCES t_group(id),
	CONSTRAINT j_group_right_t_right0_FK FOREIGN KEY (id_right) REFERENCES t_right(id)
);


------------------------------------------------------------
-- Table: j_caver_group
------------------------------------------------------------
CREATE TABLE j_caver_group(
	id_caver	INT  NOT NULL ,
	id_group	INT2  NOT NULL  ,
	CONSTRAINT j_caver_group_PK PRIMARY KEY (id_caver,id_group),
	CONSTRAINT j_caver_group_t_caver_FK FOREIGN KEY (id_caver) REFERENCES t_caver(id),
	CONSTRAINT j_caver_group_t_group0_FK FOREIGN KEY (id_group) REFERENCES t_group(id)
);


------------------------------------------------------------
-- Table: t_crs
------------------------------------------------------------
CREATE TABLE t_crs(
	id                 SERIAL2 NOT NULL ,
	id_author          INT NOT NULL ,
	id_reviewer        INT   ,
	date_inscription   timestamp  not null default now(),
	date_reviewed      timestamp   ,
	definition         VARCHAR (1000) NOT NULL ,
	bounds             VARCHAR (100)  ,
	url                VARCHAR (200)  ,
	enabled            bool not null default false ,
	code               VARCHAR (50) unique NOT NULL  ,
	CONSTRAINT t_crs_PK PRIMARY KEY (id),
	CONSTRAINT t_crs_t_caver_FK FOREIGN KEY (id_author) REFERENCES t_caver(id),
	CONSTRAINT t_crs_t_caver2_FK FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: j_country_crs
------------------------------------------------------------
CREATE TABLE j_country_crs(
	id_crs    	INT2  NOT NULL ,
	id_country	CHAR(2) NOT NULL  ,
	CONSTRAINT j_country_crs_PK PRIMARY KEY (id_crs,id_country),
	CONSTRAINT j_country_crs_t_crs_FK FOREIGN KEY (id_crs) REFERENCES t_crs(id),
	CONSTRAINT j_country_crs_t_country0_FK FOREIGN KEY (id_country) REFERENCES t_country(Iso)
);


------------------------------------------------------------
-- Table: j_entrance_caver
------------------------------------------------------------
CREATE TABLE j_entrance_caver(
	id_entrance		INT NOT NULL ,
	id_caver		INT NOT NULL  ,
	CONSTRAINT j_entrance_caver_PK PRIMARY KEY (id_entrance,id_caver),
	CONSTRAINT j_entrance_caver_t_entrance_FK FOREIGN KEY (id_entrance) REFERENCES t_entrance(id),
	CONSTRAINT j_entrance_caver_t_caver0_FK FOREIGN KEY (id_caver) REFERENCES t_caver(id)
);


------------------------------------------------------------
-- Table: j_grotto_cave_partner
------------------------------------------------------------
CREATE TABLE j_grotto_cave_partner(
	id_grotto 		INT NOT NULL ,
	id_cave			INT NOT NULL  ,
	CONSTRAINT j_grotto_cave_partner_PK PRIMARY KEY (id_grotto,id_cave),
	CONSTRAINT j_grotto_cave_partner_t_grotto_FK FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
	CONSTRAINT j_grotto_cave_partner_t_cave0_FK FOREIGN KEY (id_cave) REFERENCES t_cave(id)
);


------------------------------------------------------------
-- Table: t_coloration
------------------------------------------------------------

------------------------------------------------------------
-- Table: j_coloration_entrance
------------------------------------------------------------

------------------------------------------------------------
-- Table: j_coloration_point
------------------------------------------------------------

