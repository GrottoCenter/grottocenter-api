\c grottoce;

ALTER TABLE t_type
ADD COLUMN url varchar(200) NULL;

ALTER TABLE t_name
ALTER COLUMN name TYPE varchar(200);

ALTER TABLE t_document
ADD COLUMN id_db_import int4 NULL,
ADD COLUMN name_db_import varchar(200) NULL;

ALTER TABLE t_entrance
ADD COLUMN id_db_import int4 NULL,
ADD COLUMN name_db_import varchar(200) NULL;
