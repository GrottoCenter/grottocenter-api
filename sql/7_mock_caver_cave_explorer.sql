\c grottoce;

-- Mock data for j_caver_cave_explorer
-- Converted from j_entrance_caver based on entrance->cave relationships

INSERT INTO public.j_caver_cave_explorer (id_caver, id_cave)
VALUES
    (1, 75070),  -- entrance 1 -> cave 75070
    (1, 7),      -- entrance 7 -> cave 7
    (1, 13),     -- entrance 13 -> cave 13
    (1, 14),     -- entrance 14 -> cave 14
    (2, 75084),  -- entrance 3 -> cave 75084
    (2, 75277),  -- entrance 9 -> cave 75277
    (2, 75072),  -- entrance 10 -> cave 75072
    (2, 75073),  -- entrance 11 -> cave 75073
    (2, 75363),  -- entrance 12 -> cave 75363
    (2, 13),     -- entrance 13 -> cave 13
    (2, 14),     -- entrance 14 -> cave 14
    (2, 15),     -- entrance 15 -> cave 15
    (2, 75074),  -- entrance 16 -> cave 75074
    (4, 75070),  -- entrance 1 -> cave 75070
    (4, 75142),  -- entrance 2 -> cave 75142
    (5, 75070),  -- entrance 1 -> cave 75070
    (5, 75142),  -- entrance 2 -> cave 75142
    (5, 75071),  -- entrance 4 -> cave 75071
    (5, 5),      -- entrance 5 -> cave 5
    (5, 6),      -- entrance 6 -> cave 6
    (5, 75363),  -- entrance 12 -> cave 75363
    (5, 13),     -- entrance 13 -> cave 13
    (5, 15),     -- entrance 15 -> cave 15
    (6, 75070),  -- entrance 1 -> cave 75070
    (6, 5),      -- entrance 5 -> cave 5
    (6, 7)       -- entrance 7 -> cave 7
ON CONFLICT (id_caver, id_cave) DO NOTHING;
