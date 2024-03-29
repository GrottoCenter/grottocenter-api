\c grottoce;
INSERT INTO public.t_cave (
        id,
        id_author,
        id_reviewer,
        min_depth,
        max_depth,
        "depth",
        length,
        is_diving,
        temperature,
        size_coef,
        date_inscription,
        date_reviewed,
        longitude,
        latitude,
        is_deleted,
        redirect_to
    )
VALUES (
        5,
        4,
        3,
        NULL,
        NULL,
        120,
        5000,
        false,
        5,
        8,
        '2008-07-28 17:02:54.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        6,
        4,
        NULL,
        NULL,
        NULL,
        53,
        2623,
        true,
        NULL,
        8,
        '2008-07-28 17:04:59.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        7,
        6,
        NULL,
        NULL,
        NULL,
        118,
        250,
        false,
        10.0,
        6,
        '2008-07-28 18:23:02.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        13,
        2,
        NULL,
        NULL,
        NULL,
        440,
        12295,
        true,
        12.0,
        10,
        '2008-07-29 11:26:31.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        14,
        2,
        NULL,
        NULL,
        NULL,
        680,
        18000,
        true,
        9.0,
        10,
        '2008-07-29 11:32:44.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        15,
        2,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        NULL,
        0,
        '2008-07-29 11:40:13.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        17,
        2,
        NULL,
        NULL,
        NULL,
        354,
        16530,
        true,
        14.0,
        10,
        '2008-07-29 15:28:11.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        19,
        2,
        NULL,
        NULL,
        NULL,
        117,
        450,
        false,
        NULL,
        6,
        '2008-07-29 15:50:42.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75070,
        4,
        NULL,
        NULL,
        NULL,
        1625,
        24691,
        false,
        4.0,
        10,
        '2008-07-28 15:07:17.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75071,
        4,
        NULL,
        NULL,
        NULL,
        870,
        53806,
        true,
        8.0,
        10,
        '2008-07-28 17:01:16.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75072,
        2,
        NULL,
        NULL,
        NULL,
        807,
        25045,
        false,
        7.0,
        10,
        '2008-07-29 11:13:17.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75073,
        2,
        NULL,
        NULL,
        NULL,
        733,
        8745,
        true,
        7.0,
        10,
        '2008-07-29 11:19:15.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75074,
        2,
        NULL,
        NULL,
        NULL,
        1408,
        80200,
        false,
        7.0,
        10,
        '2008-07-29 12:40:09.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75075,
        2,
        NULL,
        NULL,
        NULL,
        670,
        49300,
        true,
        NULL,
        10,
        '2008-07-29 17:19:23.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75084,
        4,
        NULL,
        NULL,
        NULL,
        149,
        28200,
        true,
        NULL,
        9,
        '2008-08-04 20:52:01.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75101,
        6,
        NULL,
        NULL,
        NULL,
        156,
        3220,
        true,
        NULL,
        8,
        '2008-10-11 12:22:34.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75142,
        5,
        NULL,
        NULL,
        NULL,
        372,
        8404,
        false,
        3.0,
        10,
        '2009-07-01 15:00:17.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75277,
        6,
        NULL,
        NULL,
        NULL,
        307,
        10000,
        true,
        NULL,
        10,
        '2011-05-26 18:25:49.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        75363,
        4,
        NULL,
        NULL,
        NULL,
        921,
        10000,
        true,
        NULL,
        10,
        '2014-12-23 02:59:20.000',
        NULL,
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        36774, 
        2, 
        NULL, 
        NULL, 
        NULL, 
        20, 
        20, 
        false, 
        NULL, 
        5, 
        '2014-07-11 19:55:52.000', 
        NULL,
        '6.58717096450891400000',
        '46.30014341123712000000',
        false,
        NULL
    );

--
-- Cave names
--
INSERT INTO public.t_name (
        id,
        "name",
        is_main,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        id_language,
        id_cave,
        is_deleted
    )
VALUES (
        6666,
        'La cavité 6',
        true,
        2,
        NULL,
        '2020-07-29 11:20:17.000',
        NULL,
        'fra',
        6,
        false
    ), (
        5555,
        'La cavité 5',
        true,
        2,
        NULL,
        '2020-07-29 11:13:17.000',
        NULL,
        'fra',
        5,
        false
    ), 
    (
        3469,
        'Arres Planères (réseau des)',
        true,
        2,
        NULL,
        '2008-07-29 11:13:17.000',
        NULL,
        'fra',
        75072,
        false
    ),
    (
        4681,
        'Banges - Prépoulain (réseau de)',
        true,
        4,
        NULL,
        '2008-07-28 17:01:16.000',
        NULL,
        'fra',
        75071,
        false
    ),
    (
        15154,
        'Combe aux Puaires (réseau de la)',
        true,
        5,
        NULL,
        '2009-07-01 15:00:17.000',
        NULL,
        'fra',
        75142,
        false
    ),
    (
        15942,
        'Couey Lotge (gouffre du)',
        true,
        2,
        NULL,
        '2008-07-29 11:19:15.000',
        NULL,
        'fra',
        75073,
        false
    ),
    (
        21773,
        'Francheville (réseau de)',
        true,
        4,
        NULL,
        '2008-08-04 20:52:01.000',
        NULL,
        'fra',
        75084,
        false
    ),
    (
        22505,
        'Garrel (réseau du)',
        true,
        6,
        NULL,
        '2011-05-26 18:25:49.000',
        NULL,
        'fra',
        75277,
        false
    ),
    (
        32449,
        'Jean-Bernard (réseau du gouffre)',
        true,
        4,
        NULL,
        '2008-07-28 15:07:17.000',
        NULL,
        'fra',
        75070,
        false
    ),
    (
        44737,
        'Pierre-Saint-Martin (réseau de la)',
        true,
        2,
        NULL,
        '2008-07-29 12:40:09.000',
        NULL,
        'fra',
        75074,
        false
    ),
    (
        53382,
        'Sorgues (réseau de la)',
        true,
        6,
        NULL,
        '2008-10-11 12:22:34.000',
        NULL,
        'fra',
        75101,
        false
    ),
    (
        53470,
        'Souffleur d''Albion (réseau du)',
        true,
        4,
        NULL,
        '2014-12-23 02:59:20.000',
        NULL,
        'fra',
        75363,
        false
    ),
    (
        59393,
        'Trou Qui Souffle (réseau du)',
        true,
        2,
        NULL,
        '2008-07-29 17:19:23.000',
        NULL,
        'fra',
        75075,
        false
    );