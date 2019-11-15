-- This SQL request aims to change the column "is_official_partner" from "bit" to boolean
ALTER TABLE t_grotto CHANGE Is_official_partner Is_official_partner BOOLEAN NULL DEFAULT NULL; 
