\c grottoce;

-- Create junction table for organization -> country associations
CREATE TABLE IF NOT EXISTS j_organization_country (
  id serial PRIMARY KEY,
  id_grotto int4 NOT NULL,
  id_country bpchar(2) NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  CONSTRAINT j_organization_country_unique UNIQUE (id_grotto, id_country),
  CONSTRAINT j_organization_country_t_grotto_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
  CONSTRAINT j_organization_country_t_country_fk FOREIGN KEY (id_country) REFERENCES t_country(iso),
  CONSTRAINT j_organization_country_t_caver_author_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT j_organization_country_t_caver_reviewer_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);
CREATE INDEX IF NOT EXISTS idx_j_organization_country_grotto ON j_organization_country(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_country_country ON j_organization_country(id_country);

-- Create junction table for organization -> region associations
CREATE TABLE IF NOT EXISTS j_organization_region (
  id serial PRIMARY KEY,
  id_grotto int4 NOT NULL,
  id_region varchar(10) NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  CONSTRAINT j_organization_region_unique UNIQUE (id_grotto, id_region),
  CONSTRAINT j_organization_region_t_grotto_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
  CONSTRAINT j_organization_region_t_iso3166_2_fk FOREIGN KEY (id_region) REFERENCES t_iso3166_2(iso),
  CONSTRAINT j_organization_region_t_caver_author_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT j_organization_region_t_caver_reviewer_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);
CREATE INDEX IF NOT EXISTS idx_j_organization_region_grotto ON j_organization_region(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_region_region ON j_organization_region(id_region);

-- Create junction table for organization -> massif associations
CREATE TABLE IF NOT EXISTS j_organization_massif (
  id serial PRIMARY KEY,
  id_grotto int4 NOT NULL,
  id_massif int4 NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  CONSTRAINT j_organization_massif_unique UNIQUE (id_grotto, id_massif),
  CONSTRAINT j_organization_massif_t_grotto_fk FOREIGN KEY (id_grotto) REFERENCES t_grotto(id),
  CONSTRAINT j_organization_massif_t_massif_fk FOREIGN KEY (id_massif) REFERENCES t_massif(id),
  CONSTRAINT j_organization_massif_t_caver_author_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT j_organization_massif_t_caver_reviewer_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);
CREATE INDEX IF NOT EXISTS idx_j_organization_massif_grotto ON j_organization_massif(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_massif_massif ON j_organization_massif(id_massif);
