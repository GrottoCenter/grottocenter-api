\c grottoce;

CREATE TABLE IF NOT EXISTS j_caver_entrance_explorer (
    id_caver int4 NOT NULL,
    id_entrance int4 NOT NULL,
    CONSTRAINT j_caver_entrance_explorer_pk PRIMARY KEY (id_caver, id_entrance),
    CONSTRAINT j_caver_entrance_explorer_t_caver_fk FOREIGN KEY (id_caver) REFERENCES public.t_caver(id),
    CONSTRAINT j_caver_entrance_explorer_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES public.t_entrance(id)
);

CREATE INDEX IF NOT EXISTS j_caver_entrance_explorer_id_caver_idx ON j_caver_entrance_explorer (id_caver);
CREATE INDEX IF NOT EXISTS j_caver_entrance_explorer_id_entrance_idx ON j_caver_entrance_explorer (id_entrance);
