\c grottoce;

ALTER TABLE t_rigging
	ADD COLUMN id_cave int4 NULL,
	ADD CONSTRAINT t_rigging_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);

ALTER TABLE h_rigging
	ADD COLUMN id_cave int4 NULL,
	ADD CONSTRAINT h_rigging_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
