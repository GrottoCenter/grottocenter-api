\c grottoce;

-- Link documents to organization 1
INSERT INTO j_document_grotto_author (id_document, id_grotto) VALUES
	(21565, 1),
	(25018, 1),
	(25019, 1),
	(25020, 1),
	(25021, 1),
	(25022, 1),
	(25024, 1),
	(25025, 1),
	(25026, 1),
	(25027, 1),
	(25028, 1),
	(25029, 1),
	(25030, 1),
	(40784, 1),
	(40785, 1);

-- Link all authored documents to their authors in the junction table
INSERT INTO j_document_caver_author (id_document, id_caver)
SELECT id, id_author FROM t_document WHERE is_deleted = false;

-- Link some documents to caves
UPDATE t_document SET id_cave = 5 WHERE id IN (5555, 6666) AND is_deleted = false;
UPDATE t_document SET id_cave = 6 WHERE id IN (1409, 2542) AND is_deleted = false;

-- Link some documents to entrances  
UPDATE t_document SET id_entrance = 1 WHERE id IN (2998, 6065) AND is_deleted = false;
UPDATE t_document SET id_entrance = 2 WHERE id IN (6096, 10406) AND is_deleted = false;

-- Link some documents to massifs through junction table
INSERT INTO j_document_massif (id_document, id_massif) VALUES
	(12639, 112),
	(109, 112),
	(5801, 112);