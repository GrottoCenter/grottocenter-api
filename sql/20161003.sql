ALTER TABLE grottoce.j_cave_entry ENGINE=InnoDB;
ALTER TABLE grottoce.t_author ENGINE=InnoDB;
ALTER TABLE grottoce.t_cave ENGINE=InnoDB;
ALTER TABLE grottoce.t_caver ENGINE=InnoDB;
ALTER TABLE grottoce.t_entry ENGINE=InnoDB;
ALTER TABLE grottoce.t_type ENGINE=InnoDB;

ALTER TABLE grottoce.t_grotto ENGINE=InnoDB;
ALTER TABLE grottoce.t_topography ENGINE=InnoDB;
ALTER TABLE grottoce.t_file ENGINE=InnoDB;

-- t_author
ALTER TABLE `grottoce`.`t_author` 
DROP PRIMARY KEY,
ADD PRIMARY KEY (`Id`);

-- ALTER TABLE t_author
-- ADD CONSTRAINT fk_tauthor_id_author FOREIGN KEY (Id_author) REFERENCES t_caver(id);

-- ALTER TABLE t_author
-- ADD CONSTRAINT fk_tauthor_id_caver FOREIGN KEY (Id_caver) REFERENCES t_caver(id);

-- t_entry
ALTER TABLE `grottoce`.`t_entry` 
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
ALTER TABLE T_grotto
ADD COLUMN Is_official_partner BIT(1) NULL DEFAULT NULL;

-- update existing data
update T_Grotto set Is_official_partner=1 where id=349;
update T_Grotto set Is_official_partner=1 where id=327;
update T_Grotto set Is_official_partner=1 where id=398;
update T_Grotto set Is_official_partner=1 where id=604;
update T_Grotto set Is_official_partner=1 where id=505;
update T_Grotto set Is_official_partner=1 where id=514;
update T_Grotto set Is_official_partner=1 where id=605;
update T_Grotto set Is_official_partner=1 where id=592;
update T_Grotto set Is_official_partner=1 where id=600;
update T_Grotto set Is_official_partner=1 where id=599;
update T_Grotto set Is_official_partner=1 where id=431;
update T_Grotto set Is_official_partner=1 where id=601;
update T_Grotto set Is_official_partner=1 where id=428;
update T_Grotto set Is_official_partner=1 where id=2;
update T_Grotto set Is_official_partner=1 where id=602;

-- Is_of_interest
ALTER TABLE T_entry
ADD COLUMN Is_of_interest BIT(1) NULL DEFAULT NULL;

-- update existing data
update T_entry set Is_of_interest=1 where id=929;
update T_entry set Is_of_interest=1 where id=175;
update T_entry set Is_of_interest=1 where id=23575;
update T_entry set Is_of_interest=1 where id=11681;
update T_entry set Is_of_interest=1 where id=21693;
update T_entry set Is_of_interest=1 where id=11682;
update T_entry set Is_of_interest=1 where id=37080;
update T_entry set Is_of_interest=1 where id=1702;
update T_entry set Is_of_interest=1 where id=11683;
update T_entry set Is_of_interest=1 where id=11685;
update T_entry set Is_of_interest=1 where id=37468;
update T_entry set Is_of_interest=1 where id=11689;
update T_entry set Is_of_interest=1 where id=11686;
update T_entry set Is_of_interest=1 where id=11687;
update T_entry set Is_of_interest=1 where id=9739;
update T_entry set Is_of_interest=1 where id=24203;
update T_entry set Is_of_interest=1 where id=5434;
update T_entry set Is_of_interest=1 where id=9549;
update T_entry set Is_of_interest=1 where id=33116;
update T_entry set Is_of_interest=1 where id=9738;
update T_entry set Is_of_interest=1 where id=11402;
update T_entry set Is_of_interest=1 where id=10023;
update T_entry set Is_of_interest=1 where id=37705;
update T_entry set Is_of_interest=1 where id=9460;
update T_entry set Is_of_interest=1 where id=8280;
update T_entry set Is_of_interest=1 where id=8686;
update T_entry set Is_of_interest=1 where id=6224;
update T_entry set Is_of_interest=1 where id=2968;
update T_entry set Is_of_interest=1 where id=9503;
update T_entry set Is_of_interest=1 where id=8200;
update T_entry set Is_of_interest=1 where id=9237;
update T_entry set Is_of_interest=1 where id=9103;
update T_entry set Is_of_interest=1 where id=34234;
update T_entry set Is_of_interest=1 where id=25360;
update T_entry set Is_of_interest=1 where id=25339;
update T_entry set Is_of_interest=1 where id=5693;
update T_entry set Is_of_interest=1 where id=5694;
update T_entry set Is_of_interest=1 where id=10333;
update T_entry set Is_of_interest=1 where id=25381;
update T_entry set Is_of_interest=1 where id=10331;
update T_entry set Is_of_interest=1 where id=37929;
update T_entry set Is_of_interest=1 where id=37934;
update T_entry set Is_of_interest=1 where id=37749;
update T_entry set Is_of_interest=1 where id=37807;
update T_entry set Is_of_interest=1 where id=64808;