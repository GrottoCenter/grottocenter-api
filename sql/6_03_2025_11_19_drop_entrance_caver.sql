\c grottoce;
-- Drop j_entrance_caver table as it's replaced by j_caver_cave_explorer
-- This should be run AFTER the data migration (2_2025_03_20_2_migrate_entrance_caver_to_cave.sql)

DROP TABLE IF EXISTS j_entrance_caver;
