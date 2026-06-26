\c grottoce;

-- Migrate all caver-cave explorer relationships to caver-entrance.
-- For each caver-cave link, one row is created per entrance of that cave.
-- For multi-entrance caves (networks), the caver is linked to every entrance.
-- Users can remove incorrect relationships via the DELETE endpoint.

INSERT INTO j_caver_entrance_explorer (id_caver, id_entrance)
SELECT jcce.id_caver, te.id
FROM j_caver_cave_explorer jcce
JOIN t_entrance te ON te.id_cave = jcce.id_cave
ON CONFLICT (id_caver, id_entrance) DO NOTHING;
