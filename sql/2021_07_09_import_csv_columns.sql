ALTER TABLE t_type
ADD COLUMN url varchar(200) NULL;

UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Collection' WHERE id = 1;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Dataset' WHERE id = 2;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Event' WHERE id = 3;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Image' WHERE id = 4;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/InteractiveResource' WHERE id = 5;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/MovingImage' WHERE id = 6;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/PhysicalObject' WHERE id = 7;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Service' WHERE id = 8;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Software' WHERE id = 9;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Sound' WHERE id = 10;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/StillImage' WHERE id = 11;
UPDATE t_type SET url = 'http://purl.org/dc/dcmitype/Text' WHERE id = 12;
UPDATE t_type SET url = 'https://ontology.uis-speleo.org/ontology/#topography' WHERE id = 13;
UPDATE t_type SET url = 'https://ontology.uis-speleo.org/ontology/#topographicData' WHERE id = 14;
UPDATE t_type SET url = 'http://id.loc.gov/vocabulary/marcgt/boo' WHERE id = 16;
UPDATE t_type SET url = 'http://id.loc.gov/vocabulary/marcgt/iss' WHERE id = 17;
UPDATE t_type SET url = 'http://id.loc.gov/vocabulary/marcgt/art' WHERE id = 18;
UPDATE t_type SET url = 'http://id.loc.gov/vocabulary/marcgt/map' WHERE id = 19;

ALTER TABLE t_name
ALTER COLUMN name TYPE varchar(200);

ALTER TABLE t_document
ADD COLUMN id_db_import int4 NULL,
ADD COLUMN name_db_import varchar(200) NULL;

ALTER TABLE t_entrance
ADD COLUMN id_db_import int4 NULL,
ADD COLUMN name_db_import varchar(200) NULL;

