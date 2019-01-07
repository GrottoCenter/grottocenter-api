ALTER TABLE t_entry add column Id_cave smallint(5) unsigned;

UPDATE t_entry E, j_cave_entry JCE set E.Id_cave=JCE.Id_cave where E.Id=JCE.Id_entry;

DROP TABLE j_cave_entry;
