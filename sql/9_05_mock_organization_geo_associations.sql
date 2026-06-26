\c grottoce;

-- Fixtures for Organization Geographic Associations
INSERT INTO j_organization_country (id_grotto, id_country, id_author) VALUES
(1, 'FR', 1),
(2, 'FR', 1),
(4, 'BE', 5);

INSERT INTO j_organization_region (id_grotto, id_region, id_author) VALUES
(1, 'FR-IDF', 1),
(2, 'FR-ARA', 1),
(4, 'BE-WAL', 5);

INSERT INTO j_organization_massif (id_grotto, id_massif, id_author) VALUES
(1, 1, 1),
(2, 4, 1);
