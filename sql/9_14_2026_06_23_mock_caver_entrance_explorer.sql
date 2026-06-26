\c grottoce;

-- Mock data for j_caver_entrance_explorer
-- Derived from j_caver_cave_explorer by expanding to all entrances per cave

INSERT INTO public.j_caver_entrance_explorer (id_caver, id_entrance)
VALUES
    (1, 1),      -- cave 75070, entrance 1
    (1, 7),      -- cave 7, entrance 7
    (1, 13),     -- cave 13, entrance 13
    (1, 14),     -- cave 14, entrance 14
    (2, 3),      -- cave 75084, entrance 3
    (2, 9),      -- cave 75277, entrance 9
    (2, 10),     -- cave 75072, entrance 10
    (2, 11),     -- cave 75073, entrance 11
    (2, 12),     -- cave 75363, entrance 12
    (2, 13),     -- cave 13, entrance 13
    (2, 14),     -- cave 14, entrance 14
    (2, 15),     -- cave 15, entrance 15
    (2, 16),     -- cave 75074, entrance 16
    (4, 1),      -- cave 75070, entrance 1
    (4, 2),      -- cave 75142, entrance 2
    (5, 1),      -- cave 75070, entrance 1
    (5, 2),      -- cave 75142, entrance 2
    (5, 4),      -- cave 75071, entrance 4
    (5, 5),      -- cave 5, entrance 5
    (5, 6),      -- cave 6, entrance 6
    (5, 12),     -- cave 75363, entrance 12
    (5, 13),     -- cave 13, entrance 13
    (5, 15),     -- cave 15, entrance 15
    (6, 1),      -- cave 75070, entrance 1
    (6, 5),      -- cave 5, entrance 5
    (6, 7)       -- cave 7, entrance 7
ON CONFLICT (id_caver, id_entrance) DO NOTHING;
