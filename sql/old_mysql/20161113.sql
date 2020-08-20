CREATE TABLE IF NOT EXISTS `j_topo_entry` (
  `id_topography` smallint(5) unsigned NOT NULL,
  `id_entry` mediumint(5) unsigned NOT NULL,
  PRIMARY KEY (`id_topography`, `id_entry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO j_topo_entry (`id_topography`, `id_entry`)
SELECT t.id_topography, t.id_entry FROM j_topo_cave t WHERE t.id_entry <> 0 and t.id_entry IS NOT NULL;

-- TODO : what primary key ?
ALTER TABLE j_topo_cave
DROP PRIMARY KEY,
DROP COLUMN id_entry;

SET SQL_SAFE_UPDATES = 0;
DELETE FROM j_topo_cave where id_cave=0 or id_cave IS NULL;
SET SQL_SAFE_UPDATES = 1;
