CREATE TABLE j_topo_entry AS SELECT t.id_topography, t.id_entry FROM j_topo_cave t WHERE t.id_entry <> 0 and t.id_entry IS NOT NULL;

-- TODO : what primary key ?
ALTER TABLE j_topo_cave
DROP PRIMARY KEY,
DROP COLUMN id_entry;

SET SQL_SAFE_UPDATES = 0;
DELETE FROM j_topo_cave where id_cave=0 or id_cave IS NULL;
SET SQL_SAFE_UPDATES = 1;

-- ALTER TABLE j_topo_cave ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE j_topo_entry ENGINE=InnoDB DEFAULT CHARSET=utf8;
