CREATE TABLE t_option (
	id serial NOT NULL,
	name varchar(200) NOT NULL,
	CONSTRAINT t_option_pk PRIMARY KEY (id)
);

ALTER TABLE t_document
	ADD COLUMN id_authorization_document int4 NULL,
	ADD COLUMN id_option int4 NULL,
	ADD CONSTRAINT t_document_t_option_fk FOREIGN KEY (id_option) REFERENCES t_option (id),
	ADD CONSTRAINT t_document_t_document_fk3 FOREIGN KEY (id_authorization_document) REFERENCES t_document (id);

INSERT INTO t_option (id, "name") VALUES 
(default, 'Author created this document'),
(default, 'License in files'),
(default, 'Authorization present in GrottoCenter');

ALTER TABLE t_file
	RENAME COLUMN path_old TO path;
	
ALTER TABLE t_file	
	ADD COLUMN is_validated bool NOT NULL;
