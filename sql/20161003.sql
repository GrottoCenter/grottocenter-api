ALTER TABLE j_cave_entry ENGINE=InnoDB;
ALTER TABLE t_author ENGINE=InnoDB;
ALTER TABLE t_cave ENGINE=InnoDB;
ALTER TABLE t_caver ENGINE=InnoDB;
ALTER TABLE t_entry ENGINE=InnoDB;
ALTER TABLE t_type ENGINE=InnoDB;

ALTER TABLE t_grotto ENGINE=InnoDB;
ALTER TABLE t_topography ENGINE=InnoDB;
ALTER TABLE t_file ENGINE=InnoDB;

-- t_author
ALTER TABLE `t_author`
DROP PRIMARY KEY,
ADD PRIMARY KEY (`Id`);

-- ALTER TABLE t_author
-- ADD CONSTRAINT fk_tauthor_id_author FOREIGN KEY (Id_author) REFERENCES t_caver(id);

-- ALTER TABLE t_author
-- ADD CONSTRAINT fk_tauthor_id_caver FOREIGN KEY (Id_caver) REFERENCES t_caver(id);

-- t_entry
ALTER TABLE `t_entry`
DROP PRIMARY KEY,
ADD PRIMARY KEY (`Id`);

-- ALTER TABLE t_entry
-- ADD CONSTRAINT fk_tentry_id_type FOREIGN KEY (Id_type) REFERENCES t_type(id);

-- restent idem
-- j_cave_entry
-- t_cave
-- t_caver
-- t_type

-- Is_official_partner
ALTER TABLE t_grotto
ADD COLUMN Is_official_partner BIT(1) NULL DEFAULT NULL;

-- update existing data
update t_grotto set Is_official_partner=1 where id=349;
update t_grotto set Is_official_partner=1 where id=327;
update t_grotto set Is_official_partner=1 where id=398;
update t_grotto set Is_official_partner=1 where id=604;
update t_grotto set Is_official_partner=1 where id=505;
update t_grotto set Is_official_partner=1 where id=514;
update t_grotto set Is_official_partner=1 where id=605;
update t_grotto set Is_official_partner=1 where id=592;
update t_grotto set Is_official_partner=1 where id=600;
update t_grotto set Is_official_partner=1 where id=599;
update t_grotto set Is_official_partner=1 where id=431;
update t_grotto set Is_official_partner=1 where id=601;
update t_grotto set Is_official_partner=1 where id=428;
update t_grotto set Is_official_partner=1 where id=2;
update t_grotto set Is_official_partner=1 where id=602;

-- Is_of_interest
ALTER TABLE t_entry
ADD COLUMN Is_of_interest BIT(1) NULL DEFAULT NULL;

-- update existing data
update t_entry set Is_of_interest=1 where id=929;
update t_entry set Is_of_interest=1 where id=175;
update t_entry set Is_of_interest=1 where id=23575;
update t_entry set Is_of_interest=1 where id=11681;
update t_entry set Is_of_interest=1 where id=21693;
update t_entry set Is_of_interest=1 where id=11682;
update t_entry set Is_of_interest=1 where id=37080;
update t_entry set Is_of_interest=1 where id=1702;
update t_entry set Is_of_interest=1 where id=11683;
update t_entry set Is_of_interest=1 where id=11685;
update t_entry set Is_of_interest=1 where id=37468;
update t_entry set Is_of_interest=1 where id=11689;
update t_entry set Is_of_interest=1 where id=11686;
update t_entry set Is_of_interest=1 where id=11687;
update t_entry set Is_of_interest=1 where id=9739;
update t_entry set Is_of_interest=1 where id=24203;
update t_entry set Is_of_interest=1 where id=5434;
update t_entry set Is_of_interest=1 where id=9549;
update t_entry set Is_of_interest=1 where id=33116;
update t_entry set Is_of_interest=1 where id=9738;
update t_entry set Is_of_interest=1 where id=11402;
update t_entry set Is_of_interest=1 where id=10023;
update t_entry set Is_of_interest=1 where id=37705;
update t_entry set Is_of_interest=1 where id=9460;
update t_entry set Is_of_interest=1 where id=8280;
update t_entry set Is_of_interest=1 where id=8686;
update t_entry set Is_of_interest=1 where id=6224;
update t_entry set Is_of_interest=1 where id=2968;
update t_entry set Is_of_interest=1 where id=9503;
update t_entry set Is_of_interest=1 where id=8200;
update t_entry set Is_of_interest=1 where id=9237;
update t_entry set Is_of_interest=1 where id=9103;
update t_entry set Is_of_interest=1 where id=34234;
update t_entry set Is_of_interest=1 where id=25360;
update t_entry set Is_of_interest=1 where id=25339;
update t_entry set Is_of_interest=1 where id=5693;
update t_entry set Is_of_interest=1 where id=5694;
update t_entry set Is_of_interest=1 where id=10333;
update t_entry set Is_of_interest=1 where id=25381;
update t_entry set Is_of_interest=1 where id=10331;
update t_entry set Is_of_interest=1 where id=37929;
update t_entry set Is_of_interest=1 where id=37934;
update t_entry set Is_of_interest=1 where id=37749;
update t_entry set Is_of_interest=1 where id=37807;
update t_entry set Is_of_interest=1 where id=64808;
