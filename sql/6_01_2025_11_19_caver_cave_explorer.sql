\c grottoce;
-- Create j_caver_cave_explorer junction table
-- This table links cavers to caves they have explored (similar to j_grotto_cave_explorer)

CREATE TABLE IF NOT EXISTS j_caver_cave_explorer (
	id_caver int4 NOT NULL,
	id_cave int4 NOT NULL,
	CONSTRAINT j_caver_cave_explorer_pk PRIMARY KEY (id_caver, id_cave),
	CONSTRAINT j_caver_cave_explorer_t_caver_fk FOREIGN KEY (id_caver) REFERENCES public.t_caver(id),
	CONSTRAINT j_caver_cave_explorer_t_cave_fk FOREIGN KEY (id_cave) REFERENCES public.t_cave(id)
);

CREATE INDEX IF NOT EXISTS j_caver_cave_explorer_id_caver_idx ON j_caver_cave_explorer (id_caver);
CREATE INDEX IF NOT EXISTS j_caver_cave_explorer_id_cave_idx ON j_caver_cave_explorer (id_cave);
