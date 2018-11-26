--
-- Remove personnal data from grottocenter V2 database Dump
-- for developer usage only.
--
SET SQL_SAFE_UPDATES=0;
UPDATE t_author
SET Name=CONCAT("Name", Id),
Contact="contact@grottocenter.org";

DROP TABLE IF EXISTS T_caverSAVE;

UPDATE t_caver
SET
Ip="111.111.11.111",
Name=CONCAT("Name", Id),
Surname=CONCAT("Surname", Id),
Login=CONCAT("Login", Id),
Nickname=CONCAT("Nickname", Id),
Password=CONCAT("Password", Id),
City="Paris",
Address=CONCAT("Address", Id),
Date_birth="1980-12-25",
Contact="contact@grottocenter.org",
Latitude=45.66666,
Longitude=4.88888,
Default_latitude=45.66666,
Default_longitude=4.88888,
Custom_message=CONCAT("My message ", Id),
Facebook="Name Surname",
Picture_file_name="picture.jpg";
SET SQL_SAFE_UPDATES=1;
