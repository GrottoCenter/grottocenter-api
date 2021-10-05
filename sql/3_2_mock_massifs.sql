\c grottoce;
INSERT INTO public.t_massif (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        geog_polygon,
        is_deleted,
        redirect_to
    )
VALUES (
        1,
        1,
        NULL,
        '2008-08-04 13:48:48.000',
        NULL,
        NULL,
        true,
        NULL
    ),
    (
        4,
        2,
        3,
        '2018-08-05 10:45:13.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        8,
        2,
        NULL,
        '2008-08-05 14:17:28.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        16,
        6,
        NULL,
        '2008-08-06 22:56:39.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        17,
        6,
        NULL,
        '2008-08-07 19:49:37.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        20,
        6,
        NULL,
        '2008-08-07 20:10:12.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        21,
        6,
        5,
        '2008-08-07 20:16:20.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        83,
        5,
        NULL,
        '2009-02-22 16:51:19.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        112,
        5,
        NULL,
        '2009-07-01 15:00:17.000',
        NULL,
        NULL,
        false,
        NULL
    ),
    (
        0,
        0,
        NULL,
        '2020-12-22 00:13:37.237',
        NULL,
        NULL,
        false,
        NULL
    );
INSERT INTO public.t_name (
        id,
        "name",
        is_main,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        id_language,
        id_massif,
        is_deleted
    )
VALUES (
        1,
        'Rochers de Naye (massif des)',
        true,
        2,
        1,
        '2008-07-29 11:13:17.000',
        '2008-07-30 12:13:17.000',
        'fra',
        1,
        false
    ),
    (
        2,
        'Bois de Monnié (massif du)',
        true,
        1,
        2,
        '2018-07-29 14:13:17.000',
        '2019-08-30 12:02:18.000',
        'fra',
        4,
        false
    ),
    (
        3,
        'Mialet',
        true,
        3,
        5,
        '2017-07-29 14:13:17.000',
        '2018-09-30 12:02:18.000',
        'fra',
        8,
        false
    ),
    (
        4,
        'Fanges (forêt des)',
        true,
        1,
        6,
        '2016-07-29 14:13:17.000',
        '2017-09-30 12:02:18.000',
        'fra',
        16,
        false
    ),
    (
        5,
        'Fanges (forêt des)',
        true,
        2,
        1,
        '2015-07-29 14:13:17.000',
        '2016-09-30 12:02:18.000',
        'fra',
        17,
        false
    ),
    (
        6,
        'Fanges (forest)',
        false,
        2,
        1,
        '2015-07-29 14:13:17.000',
        '2016-09-30 12:02:18.000',
        'eng',
        17,
        false
    ),
    (
        7,
        'Criou (montagne du)',
        true,
        1,
        3,
        '2016-07-29 14:13:17.000',
        '2019-01-30 11:02:18.000',
        'fra',
        20,
        false
    ),
    (
        8,
        'Criou (moutain)',
        false,
        1,
        3,
        '2016-07-29 14:13:17.000',
        '2019-01-30 11:02:18.000',
        'eng',
        20,
        false
    ),
    (
        9,
        'Arabika',
        true,
        1,
        3,
        '2017-07-29 14:13:17.000',
        '2019-01-30 10:02:18.000',
        'fra',
        21,
        false
    ),
    (
        10,
        'Bannalp',
        true,
        5,
        4,
        '2017-07-29 03:13:17.000',
        '2018-01-30 10:02:18.000',
        'eng',
        83,
        false
    ),
    (
        11,
        'Iseye',
        true,
        1,
        4,
        '2017-07-29 03:13:17.000',
        '2019-01-30 10:02:18.000',
        'fra',
        112,
        false
    );