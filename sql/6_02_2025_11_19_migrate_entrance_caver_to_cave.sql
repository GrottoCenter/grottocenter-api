\c grottoce;
-- Migrate data from j_entrance_caver to j_caver_cave_explorer
-- This migration converts entrance-caver relationships to cave-caver relationships

INSERT INTO j_caver_cave_explorer (id_caver, id_cave)
SELECT DISTINCT jec.id_caver, e.id_cave
FROM j_entrance_caver jec
JOIN t_entrance e ON jec.id_entrance = e.id
WHERE e.id_cave IS NOT NULL
ON CONFLICT (id_caver, id_cave) DO NOTHING;
