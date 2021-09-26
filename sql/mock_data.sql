
\c grottoce;

INSERT INTO public.t_group (id,"name","comments") VALUES
	 (1,'Administrator','Technical responsible of the application.'),
	 (2,'Moderator','Content reviewers.'),
	 (3,'User','Default users group'),
	 (4,'Visitor','Non connected people'),
	 (5,'Leader','Contributors can refer to those people for any questions.');

INSERT INTO public.t_right (id,"name","comments") VALUES
    (1, 'Application - view any', NULL),
    (2, 'Application - edit any', NULL),
    (3, 'Application - delete any', NULL),
    (4, 'Document - view any', NULL),
    (5, 'Document - edit any', NULL),
    (6, 'Document - delete any', NULL),
    (7, 'Cave - view any', NULL),
    (8, 'Cave - edit any', NULL),
    (9, 'Cave - delete any', NULL),
    (10, 'Caver - view any', NULL),
    (11, 'Caver - edit any', NULL),
    (12, 'Caver - delete any', NULL),
	(13, 'Entrance - view complete', NULL),
    (19, 'Entrance - view any', NULL),
    (20, 'Entrance - edit any', NULL),
    (21, 'Entrance - delete any', NULL),
    (22, 'Organization - view any', NULL),
    (23, 'Organization - edit any', NULL),
    (24, 'Organization - delete any', NULL),
    (25, 'Group - view any', NULL),
    (26, 'Group - edit any', NULL),
    (27, 'Group - delete any', NULL),
    (34, 'Massif - view any', NULL),
    (35, 'Massif - edit any', NULL),
    (36, 'Massif - delete any', NULL),
    (40, 'Right - view any', NULL),
    (41, 'Right - edit any', NULL),
    (42, 'Right - delete any', NULL),
    (50, 'Caver - edit own', NULL),
    (51, 'Caver - delete own', NULL),
    (75, 'File - view any', NULL),
    (76, 'File - edit any', NULL),
    (77, 'File - delete any', NULL),
    (78, 'File - create', NULL),
    (79, 'Document - create', NULL),
    (80, 'Cave - create', NULL),
    (81, 'Caver - create', NULL),
    (82, 'Entrance - create', NULL),
    (83, 'Organization - create', NULL),
    (84, 'Group - create', NULL),
    (85, 'Massif - create', NULL),
    (86, 'Right - create', NULL),
    (87, 'Entrance - view limited', NULL),
    (88, 'Application - merge duplicates', NULL),
	(89, 'Entrance - link resource', NULL),
	(90, 'Entrance - unlink resource', NULL),
	(91, 'Cave - link resource', NULL),
	(92, 'Cave - unlink resource', NULL),
	(93, 'Description - edit any', NULL),
	(95, 'Name - edit any', NULL),
	(97, 'Description - create', NULL),
	(98, 'Location - edit any', NULL),
	(99, 'Location - create', NULL),
  	(100, 'Application - no request limit', NULL),
	(101, 'Document - edit not validated', NULL);

INSERT INTO public.j_group_right (id_group,id_right) VALUES
    (1, 2),
    (1, 3),
    (1, 11),
    (1, 12),
	(1, 13),
    (1, 25),
    (1, 26),
    (1, 27),
    (1, 40),
    (1, 41),
    (1, 42),
    (3, 80),
    (3, 82),
    (2, 21),
    (2, 1),
    (2, 25),
    (2, 40),
    (3, 4),
    (3, 5),
    (3, 6),
    (3, 7),
    (3, 8),
    (3, 10),
    (3, 19),
    (3, 20),
    (3, 22),
    (3, 23),
    (3, 24),
    (3, 34),
    (3, 35),
    (3, 36),
    (3, 50),
    (3, 51),
    (4, 4),
    (4, 10),
    (2, 9),
	(3, 89),
	(2, 90),
	(3, 91),
	(2, 92),
	(3, 93),
	(3, 95),
	(3, 97),
	(3, 98),
	(3, 99),
	(2, 100);

INSERT INTO public.t_identifier_type (code,"text",regexp) VALUES
 ('doi  ','digital object identifier','^.+$'),
 ('isbn ','international standard book number','^(97[89]-)?[0-9]{1,5}-[0-9]+-[0-9]+-[0-9]$'),
 ('issn ','international standard serial number','^[0-9]{4}-[0-9]{3}[0-9x]$'),
 ('url  ','uniform resource locator','^[a-z]{2,5}://.+\..+$');

INSERT INTO public.t_country (iso,iso3,"numeric",latitude,longitude,native_name,en_name,fr_name,es_name,de_name,bg_name,it_name,ca_name,nl_name,rs_name) VALUES
   ('00','000',250,46.22763800000000000000,2.21374900000000000000,'unknown','unknown','unknown','unknown','unknown','unknown','unknown','unknown','unknown','unknown'),
	 ('FR','FRA',250,46.22763800000000000000,2.21374900000000000000,'France','France','France','Francia','Frankreich','Франция','Francia','França','Frankrijk','France'),
   ('IT','ITA',380,41.87194000000000000000,12.56738000000000000000,'Italia','Italy','Italie','Italia','Italien','Италия','Italia','Itàlia','Italië','Italy'),
   ('US','USA',840,37.09024000000000000000,-95.71289100000000000000,'United States','United States','Etats-Unis','Estados Unidos','Vereinigte Staaten von Amerika','Съединените Американски Щати (САЩ)','Stati Uniti d''America','Estats Units d''Amèrica','Verenigde Staten van Amerika','United States');

INSERT INTO public.t_language (id,part2b,part2t,part1,"scope","type",ref_name,"comment",is_prefered) VALUES
	 ('000','000','000','00','I','L','-Undefined-','',false),
   ('fra','fre','fra','fr','I','L','French','',true),
	 ('ces','cze','ces','cs','I','L','Czech','',false),
	 ('epo','epo','epo','eo','I','C','Esperanto','',false);

INSERT INTO public.t_license (id,"name","text",is_copyrighted,url) VALUES (1,'CC-BY-SA',NULL,true,'https://creativecommons.org/licenses/by-sa/3.0/');

INSERT INTO public.t_geology (id,"label",id_parent) VALUES ('Q82480    ','sedimentary rock','Q35758    ');

INSERT INTO public.t_caver (id,login,"password",activated,activation_code,banned,connection_counter,relevance,"name",surname,nickname,mail,mail_is_valid,date_inscription,date_last_connection,alert_for_news,show_links,detail_level,default_zoom,id_language) VALUES
	 (0,'deleted','welcome1',false,'0',false,0,1,'deleted','deleted','deleted','deleted@mail.no',true,'2020-12-21 22:23:20.000',NULL,false,false,30,NULL,'fra'),
	 (1,'user1','welcome1',true,'0',false,716,35,'user','name','My Name','user1@mail.no',true,'2008-07-28 13:56:41.000','2019-02-06 00:30:06.000',true,false,15,8,'fra'),
	 (2,'user2','welcome1',true,'0',false,53,2,'user','name','My Name','user2@mail.no',true,'2008-07-28 14:41:41.000','2013-03-26 11:50:09.000',true,true,30,13,'fra'),
	 (3,'user3','welcome1',true,'0',false,5,1,'user','name','My Name','user3@mail.no',true,'2008-07-28 14:47:13.000','2011-03-02 13:43:59.000',false,false,30,8,'fra'),
	 (4,'user4','welcome1',true,'0',false,55,30,'user','name','My Name','user4@mail.no',true,'2008-07-28 15:02:08.000','2017-09-16 18:10:06.000',false,false,100,7,'fra'),
	 (5,'user5','welcome1',true,'0',false,56,1457,'user','name','My Name','user5@mail.no',true,'2008-07-28 15:55:34.000','2011-05-24 14:32:24.000',true,true,10,15,'fra'),
	 (6,'user6','welcome1',true,'0',false,404,406,'user',NULL,'My Name','user6@mail.no',true,'2008-07-28 16:18:16.000','2019-12-14 12:19:01.000',true,false,30,7,'fra');

INSERT INTO public.j_caver_group (id_caver,id_group) VALUES
	 (2,2),
	 (2,3),
	 (3,3),
	 (4,2),
	 (4,3),
	 (5,3),
	 (6,3),
	 (1,1),
	 (1,3),
	 (1,5),
	 (1,2);

INSERT INTO public.t_massif (id,id_author,id_reviewer,date_inscription,date_reviewed,geog_polygon,is_deleted,redirect_to) VALUES
	 (1,1,NULL,'2008-08-04 13:48:48.000',NULL,NULL,false,NULL),
	 (4,2,NULL,'2008-08-05 10:45:13.000',NULL,NULL,false,NULL),
	 (8,2,NULL,'2008-08-05 14:17:28.000',NULL,NULL,false,NULL),
	 (16,6,NULL,'2008-08-06 22:56:39.000',NULL,NULL,false,NULL),
	 (17,6,NULL,'2008-08-07 19:49:37.000',NULL,NULL,false,NULL),
	 (20,6,NULL,'2008-08-07 20:10:12.000',NULL,NULL,false,NULL),
	 (21,6,NULL,'2008-08-07 20:16:20.000',NULL,NULL,false,NULL),
	 (83,5,NULL,'2009-02-22 16:51:19.000',NULL,NULL,false,NULL),
	 (112,5,NULL,'2009-07-01 15:00:17.000',NULL,NULL,false,NULL),
	 (0,0,NULL,'2020-12-22 00:13:37.237',NULL,NULL,false,NULL);

INSERT INTO public.t_cave (id,id_author,id_reviewer,min_depth,max_depth,"depth",length,is_diving,temperature,size_coef,date_inscription,date_reviewed,longitude,latitude,id_massif,is_deleted,redirect_to) VALUES
	 (5,4,NULL,NULL,NULL,120,5000,false,NULL,8,'2008-07-28 17:02:54.000',NULL,NULL,NULL,17,false,NULL),
	 (6,4,NULL,NULL,NULL,53,2623,true,NULL,8,'2008-07-28 17:04:59.000',NULL,NULL,NULL,21,false,NULL),
	 (7,6,NULL,NULL,NULL,118,250,false,10.0,6,'2008-07-28 18:23:02.000',NULL,NULL,NULL,17,false,NULL),
	 (13,2,NULL,NULL,NULL,440,12295,true,12.0,10,'2008-07-29 11:26:31.000',NULL,NULL,NULL,1,false,NULL),
	 (14,2,NULL,NULL,NULL,680,18000,true,9.0,10,'2008-07-29 11:32:44.000',NULL,NULL,NULL,1,false,NULL),
	 (15,2,NULL,NULL,NULL,NULL,NULL,false,NULL,0,'2008-07-29 11:40:13.000',NULL,NULL,NULL,1,false,NULL),
	 (17,2,NULL,NULL,NULL,354,16530,true,14.0,10,'2008-07-29 15:28:11.000',NULL,NULL,NULL,8,false,NULL),
	 (19,2,NULL,NULL,NULL,117,450,false,NULL,6,'2008-07-29 15:50:42.000',NULL,NULL,NULL,NULL,false,NULL),
	 (75070,4,NULL,NULL,NULL,1625,24691,false,4.0,10,'2008-07-28 15:07:17.000',NULL,NULL,NULL,NULL,false,NULL),
	 (75071,4,NULL,NULL,NULL,870,53806,true,8.0,10,'2008-07-28 17:01:16.000',NULL,NULL,NULL,83,false,NULL),
	 (75072,2,NULL,NULL,NULL,807,25045,false,7.0,10,'2008-07-29 11:13:17.000',NULL,NULL,NULL,4,false,NULL),
	 (75073,2,NULL,NULL,NULL,733,8745,true,7.0,10,'2008-07-29 11:19:15.000',NULL,NULL,NULL,4,false,NULL),
	 (75074,2,NULL,NULL,NULL,1408,80200,false,7.0,10,'2008-07-29 12:40:09.000',NULL,NULL,NULL,4,false,NULL),
	 (75075,2,NULL,NULL,NULL,670,49300,true,NULL,10,'2008-07-29 17:19:23.000',NULL,NULL,NULL,1,false,NULL),
	 (75084,4,NULL,NULL,NULL,149,28200,true,NULL,9,'2008-08-04 20:52:01.000',NULL,NULL,NULL,NULL,false,NULL),
	 (75101,6,NULL,NULL,NULL,156,3220,true,NULL,8,'2008-10-11 12:22:34.000',NULL,NULL,NULL,16,false,NULL),
	 (75142,5,NULL,NULL,NULL,372,8404,false,3.0,10,'2009-07-01 15:00:17.000',NULL,NULL,NULL,112,false,NULL),
	 (75277,6,NULL,NULL,NULL,307,10000,true,NULL,10,'2011-05-26 18:25:49.000',NULL,NULL,NULL,8,false,NULL),
	 (75363,4,NULL,NULL,NULL,921,10000,true,NULL,10,'2014-12-23 02:59:20.000',NULL,NULL,NULL,20,false,NULL);

INSERT INTO public.t_name (id,"name",is_main,id_author,id_reviewer,date_inscription,date_reviewed,id_language,id_entrance,id_cave,id_massif,id_point,id_grotto,is_deleted) VALUES
 (3469,'Arres Planères (réseau des)',true,2,NULL,'2008-07-29 11:13:17.000',NULL,'fra',NULL,75072,NULL,NULL,NULL,false),
 (4681,'Banges - Prépoulain (réseau de)',true,4,NULL,'2008-07-28 17:01:16.000',NULL,'fra',NULL,75071,NULL,NULL,NULL,false),
 (15154,'Combe aux Puaires (réseau de la)',true,5,NULL,'2009-07-01 15:00:17.000',NULL,'fra',NULL,75142,NULL,NULL,NULL,false),
 (15942,'Couey Lotge (gouffre du)',true,2,NULL,'2008-07-29 11:19:15.000',NULL,'fra',NULL,75073,NULL,NULL,NULL,false),
 (21773,'Francheville (réseau de)',true,4,NULL,'2008-08-04 20:52:01.000',NULL,'fra',NULL,75084,NULL,NULL,NULL,false),
 (22505,'Garrel (réseau du)',true,6,NULL,'2011-05-26 18:25:49.000',NULL,'fra',NULL,75277,NULL,NULL,NULL,false),
 (32449,'Jean-Bernard (réseau du gouffre)',true,4,NULL,'2008-07-28 15:07:17.000',NULL,'fra',NULL,75070,NULL,NULL,NULL,false),
 (44737,'Pierre-Saint-Martin (réseau de la)',true,2,NULL,'2008-07-29 12:40:09.000',NULL,'fra',NULL,75074,NULL,NULL,NULL,false),
 (53382,'Sorgues (réseau de la)',true,6,NULL,'2008-10-11 12:22:34.000',NULL,'fra',NULL,75101,NULL,NULL,NULL,false),
 (53470,'Souffleur d''Albion (réseau du)',true,4,NULL,'2014-12-23 02:59:20.000',NULL,'fra',NULL,75363,NULL,NULL,NULL,false),
 (59393,'Trou Qui Souffle (réseau du)',true,2,NULL,'2008-07-29 17:19:23.000',NULL,'fra',NULL,75075,NULL,NULL,NULL,false);

INSERT INTO public.t_entrance (id,"type",id_author,id_reviewer,region,county,village,city,address,year_discovery,external_url,date_inscription,date_reviewed,is_public,is_sensitive,contact,modalities,has_contributions,latitude,longitude,altitude,is_of_interest,id_cave,id_country,id_geology,is_deleted,redirect_to) VALUES
	 (1,'entrance',4,NULL,'Haute-Savoie (74), Auvergne-Rhône-Alpes (ARA)','Haute-Savoie',NULL,'Samoëns',NULL,1963,NULL,'2008-07-28 15:08:37.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,46.10222000000000000000,6.77962000000000000000,1836,false,75070,'FR','Q82480    ',false,NULL),
	 (2,'entrance',4,NULL,'Haute-Savoie (74), Auvergne-Rhône-Alpes (ARA)','Haute-Savoie',NULL,'Samoëns',NULL,1981,NULL,'2008-07-28 15:10:21.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,46.11504999999990000000,6.79815000000002000000,2142,true,75142,'FR','Q82480    ',false,NULL),
	 (3,'entrance',2,NULL,'Côte-d''Or (21), Bourgogne-Franche-Comté (BFC)','Côte-d''Or',NULL,'Francheville',NULL,1969,NULL,'2008-07-28 16:40:40.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,47.45418134591100000000,4.89663541316990000000,430,false,75084,'FR','Q82480    ',false,NULL),
	 (4,'entrance',4,NULL,'Savoie (73), Auvergne-Rhône-Alpes (ARA)','Savoie',NULL,'Arith',NULL,NULL,NULL,'2008-07-28 17:01:14.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,45.72423294448300000000,6.09397888183590000000,NULL,false,75071,'FR','Q82480    ',false,NULL),
	 (5,'entrance',4,NULL,'Ain (01), Auvergne-Rhône-Alpes (ARA)','Ain',NULL,'Dortan',NULL,NULL,NULL,'2008-07-28 17:02:54.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,46.32022242913800000000,5.64109325408940000000,NULL,false,5,'FR','Q82480    ',false,NULL),
	 (6,'entrance',4,NULL,'Ardèche (07), Auvergne-Rhône-Alpes (ARA)','Ardèche',NULL,'Labeaume',NULL,1945,NULL,'2008-07-28 17:04:59.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,44.48101399497800000000,4.32779788970950000000,148,false,6,'FR','Q82480    ',false,NULL),
	 (7,'entrance',6,NULL,'Ain (01), Auvergne-Rhône-Alpes (ARA)','Ain',NULL,'Bohas-Meyriat-Rignat',NULL,1898,NULL,'2008-07-28 18:23:02.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,46.12148000000000000000,5.40805000000000000000,420,false,7,'FR','Q82480    ',false,NULL),
	 (9,'entrance',2,NULL,'Hérault (34), Occitanie (OCC)','Hérault',NULL,'Saint-Jean-de-Buèges',NULL,1952,NULL,'2008-07-29 11:07:52.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,43.83387671464515000000,3.61647604474183030000,167,false,75277,'FR','Q82480    ',false,NULL),
	 (10,'entrance',2,NULL,'Pyrénées-Atlantiques (64), Nouvelle-Aquitaine (NAQ)','Pyrénées-Atlantiques',NULL,'Arette',NULL,1957,NULL,'2008-07-29 11:13:16.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,42.97488796550200000000,-0.76423645019530990000,1652,false,75072,'FR','Q82480    ',false,NULL),
	 (11,'entrance',2,NULL,'Pyrénées-Atlantiques (64), Nouvelle-Aquitaine (NAQ)','Pyrénées-Atlantiques',NULL,'Arette',NULL,1957,NULL,'2008-07-29 11:19:15.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,42.98378897196500000000,-0.74541807174682990000,1478,false,75073,'FR','Q82480    ',false,NULL),
	 (12,'entrance',2,NULL,'Vaucluse (84), Provence-Alpes-Côte d''Azur (PAC)','Vaucluse',NULL,'Saint-Christol',NULL,NULL,NULL,'2008-07-29 11:23:02.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,44.02645811304538600000,5.49397945404052700000,848,false,75363,'FR','Q82480    ',false,NULL),
	 (13,'entrance',2,NULL,'Isère (38), Auvergne-Rhône-Alpes (ARA)','Isère',NULL,'Sassenage',NULL,1884,NULL,'2008-07-29 11:26:31.000',NULL,false,true,'Cavité aménagée pour le tourisme. Demander l''autorisation d''accès au gérant de la grotte','NO,NO,NO,NO',true,45.20871034945300000000,5.65130710601810000000,298,false,13,'FR','Q82480    ',false,NULL),
	 (14,'entrance',2,NULL,'Isère (38), Auvergne-Rhône-Alpes (ARA)','Isère',NULL,'Choranche',NULL,1947,NULL,'2008-07-29 11:32:44.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,45.07664211845900000000,5.39510250091550000000,580,false,14,'FR','Q82480    ',false,NULL),
	 (15,'entrance',2,NULL,'Drôme (26), Auvergne-Rhône-Alpes (ARA)','Drôme',NULL,'Saint-Martin-en-Vercors',NULL,NULL,NULL,'2008-07-29 11:40:13.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,45.02094451030300000000,5.47479629516600100000,NULL,false,15,'FR','Q82480    ',false,NULL),
	 (16,'entrance',2,NULL,'Pyrénées-Atlantiques (64), Nouvelle-Aquitaine (NAQ)','Pyrénées-Atlantiques',NULL,'Sainte-Engrâce',NULL,1953,NULL,'2008-07-29 12:40:09.000',NULL,false,true,'ARSIP','YES,NO,NO,NO',true,42.98336514373300000000,-0.79809665679932010000,1050,false,75074,'FR','Q82480    ',false,NULL),
	 (17,'entrance',2,NULL,'Hérault (34), Occitanie (OCC)','Hérault',NULL,'Saint-Maurice-Navacelles',NULL,1983,NULL,'2008-07-29 15:28:11.000',NULL,false,true,'Accès interdit en période de chasse - accès restreint le reste de l''année (cf. section "localisation")','NO,NO,NO,NO',true,43.81886000000000000000,3.55974000000000000000,610,false,17,'FR','Q82480    ',false,NULL),
	 (18,'entrance',2,NULL,'Aveyron (12), Occitanie (OCC)','Aveyron',NULL,'Cornus',NULL,1885,NULL,'2008-07-29 15:35:43.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,43.85882283079300000000,3.22023868560790000000,730,false,75101,'FR','Q82480    ',false,NULL),
	 (19,'entrance',2,NULL,'Doubs (25), Bourgogne-Franche-Comté (BFC)','Doubs',NULL,'Sainte-Anne',NULL,NULL,NULL,'2008-07-29 15:50:42.000',NULL,true,false,NULL,'NO,NO,NO,NO',false,46.94241049125399000000,5.97476005554200100000,655,false,19,'FR','Q82480    ',false,NULL),
	 (20,'entrance',2,NULL,'Isère (38), Auvergne-Rhône-Alpes (ARA)','Isère',NULL,'Autrans-Méaudre-en-Vercors',NULL,1937,NULL,'2008-07-29 17:19:22.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,45.15053874765400000000,5.51691770553589900000,1070,false,75075,'FR','Q82480    ',false,NULL),
	 (21,'entrance',1,NULL,'Isère (38), Auvergne-Rhône-Alpes (ARA)','Isère',NULL,'Autrans-Méaudre-en-Vercors',NULL,NULL,NULL,'2008-07-29 18:17:13.000',NULL,true,false,NULL,'NO,NO,NO,NO',true,45.15292970328600000000,5.52007198333740100000,1064,false,75075,'FR','Q82480    ',false,NULL);

INSERT INTO public.t_name (id,"name",is_main,id_author,id_reviewer,date_inscription,date_reviewed,id_language,id_entrance,id_cave,id_massif,id_point,id_grotto,is_deleted) VALUES
	 (2965,'Antona (Gouffre d'')',true,6,NULL,'2008-07-28 18:23:02.000',NULL,'fra',7,NULL,NULL,NULL,NULL,false),
	 (5194,'Baume Sainte-Anne (Gouffre de la)',true,2,NULL,'2008-07-29 15:50:42.000',NULL,'fra',19,NULL,NULL,NULL,NULL,false),
	 (15152,'Combe aux Prêtres (Gouffre de la)',true,2,NULL,'2008-07-28 16:40:40.000',NULL,'fra',3,NULL,NULL,NULL,NULL,false),
	 (15943,'Couey Lotge (Gouffre du) [DS30] [Gouffre du Couey Lodge]',true,2,NULL,'2008-07-29 11:19:15.000',NULL,'fra',11,NULL,NULL,NULL,NULL,false),
	 (16368,'CP16',true,4,NULL,'2008-07-28 15:10:21.000',NULL,'fra',2,NULL,NULL,NULL,NULL,false),
	 (17059,'Cuves de Sassenage (Les)',true,2,NULL,'2008-07-29 11:26:31.000',NULL,'fra',13,NULL,NULL,NULL,NULL,false),
	 (22503,'Garrel (Grotte-exsurgence du) [Trop-plein Foux de Saint Jean] [Trop-plein Foux des Sicards]',true,2,NULL,'2008-07-29 11:07:52.000',NULL,'fra',9,NULL,NULL,NULL,NULL,false),
	 (23912,'Gournier (Grotte de)',true,2,NULL,'2008-07-29 11:32:44.000',NULL,'fra',14,NULL,NULL,NULL,NULL,false),
	 (32448,'Jean-Bernard (Gouffre) [V4] [V04] ',true,4,NULL,'2008-07-28 15:08:37.000',NULL,'fra',1,NULL,NULL,NULL,NULL,false),
	 (35342,'Leicasse (Aven de la)',true,2,NULL,'2008-07-29 15:28:11.000',NULL,'fra',17,NULL,NULL,NULL,NULL,false),
	 (36005,'Lonné-Peyret (Gouffre) [GL102]',true,2,NULL,'2008-07-29 11:13:16.000',NULL,'fra',10,NULL,NULL,NULL,NULL,false),
	 (37669,'Mas Raynal (Abîme du)',true,2,NULL,'2008-07-29 15:35:43.000',NULL,'fra',18,NULL,NULL,NULL,NULL,false),
	 (43711,'Pêcher (Baume du)',true,4,NULL,'2008-07-28 17:04:59.000',NULL,'fra',6,NULL,NULL,NULL,NULL,false),
	 (45957,'Pot du Loup n°2 (Scialet du)',true,2,NULL,'2008-07-29 11:40:13.000',NULL,'fra',15,NULL,NULL,NULL,NULL,false),
	 (46586,'Prérouge (Grotte de) [n°027] [n°27]',true,4,NULL,'2008-07-28 17:01:14.000',NULL,'fra',4,NULL,NULL,NULL,NULL,false),
	 (50536,'Saints de Glace (Les)',true,1,NULL,'2008-07-29 18:17:13.000',NULL,'fra',21,NULL,NULL,NULL,NULL,false),
	 (53468,'Souffleur (Trou) [Trou Souffleur d''Albion]',true,2,NULL,'2008-07-29 11:23:02.000',NULL,'fra',12,NULL,NULL,NULL,NULL,false),
	 (59392,'Trou Qui Souffle (Le) [TQS]',true,2,NULL,'2008-07-29 17:19:22.000',NULL,'fra',20,NULL,NULL,NULL,NULL,false),
	 (61051,'Verna (Tunnel EDF de la)',true,2,NULL,'2008-07-29 12:40:09.000',NULL,'fra',16,NULL,NULL,NULL,NULL,false),
	 (61339,'Vincent (Gouffre)',true,4,NULL,'2008-07-28 17:02:54.000',NULL,'fra',5,NULL,NULL,NULL,NULL,false);

INSERT INTO public.t_location (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,title,body,id_entrance,id_language,is_deleted) VALUES
	 (305,5,NULL,'2009-09-02 16:53:33.000',NULL,4,'Accès piste','Piste normalement fermée par une barrière.',5,'fra',false),
	 (1,6,NULL,'2008-07-28 19:35:20.000',NULL,3,'Accès','A partir de Neuville/Ain, prendre la D42 en direction de Meyriat et Hautecourt. Environ 1 km apres Fromente prendre à droite sur la D59 en direction de Hautecourt.  Après la deuxième intersection D81 (Bohas-Meyrat) - D59 (Hautecourt) continuer sur la droite et se garer 200m plus loin en bordure gauche. Sur notre droite prendre un chemin en terre (le premier depuis le croisement). Pour éviter tout problème avec le propriétaire, il est préférable de se garer avant de prendre le chemin en terre.\nAu bout de 200 m cette piste finit de longer les champs et tourne a gauche pour pénétrer dans le bois. La prendre. Apres encore 200 m un chemin part a droite vers une clairiere/coupe de bois. Juste apres la piste se transforme tout droit en chemin plus etroit : prendre alors la piste a droite, puis au bout de 200 m prendre la piste de gauche. 40m après prendre à gauche vers la clairiere. 25m plus loin le gouffre s''ouvre sur votre gauche en bord de clairiere. Il est entouré d''un grillage et un panneau en indique l''entrée.\nAttention, la forêt est un vrai labyrinthe de buis.',7,'fra',false),
	 (2,6,NULL,'2008-07-29 18:32:18.000',NULL,1,'Coordonnées','Coordonnées Lambert II Centre (km) : X= 943,37 Y= 132,12 Z=1840 (entrée V4)[ref]"Gouffre Jean-Bernard", sur le site du GS Vulcain : https://www.groupe-speleo-vulcain.com/explorations/explorations-a-samoens/gouffre-jean-bernard/[/ref].\nATTENTION : Ces coordonnées Lambert II Centre ne sont pas tout à fait équivalentes aux coordonnées WGS84 décimales, pourtant également fournies par un document du GS Vulcain[ref]Synthèse topographique 2010 : https://www.groupe-speleo-vulcain.com/wp-content/uploads/2011/03/JB-Coupe1991.pdf[/ref].\n\nA partir de Samoëns, aller se garer sur le parking qui permet d''accéder au Lac des Chambres et au refuge du Folly.\nMonter au refuge ; il faut compter 1h30 de marche (600 mètres de dénivelé). \nA partir du refuge, prendre la direction du lac des Chambres. \nUn peu avant le lac, prendre sur la gauche. \nL''entrée V4 est un petit porche. \nCompter 1h30 de marche entre le refuge et l''entrée.',1,'fra',false),
	 (7,1,NULL,'2008-08-02 21:34:30.000',NULL,0,'Consignes locales','Pour toute info sur cette cavité vous pouvez contactez le club spéléo CLPA : contact.clpa-chez-laposte.net \nLa cavité est d''accès libre. \nPrière de respecter les équipements en place et signaler au CLPA les matériels défectueux constatés. \n\nL''entrée décrite par la présente fiche concerne le trop-plein temporaire pénétrable situé en tête de talweg et exhalant un trés fort courant d''air.\nCe trop-plein est situé au-dessus de la source pérenne importante appelée "Foux de Saint Jean" ou "Foux des Sicards".\n\nLes coordonnées suivantes ont été également signalées pour l''émergence pérenne de la "Foux de Saint-Jean" alias "Foux des Sicards3 : \nLatitude    : 43.8341 degrés N.\nLongitude : 3.61652 degrés E.',9,'fra',false),
	 (8,4,NULL,'2008-08-04 16:58:07.000',NULL,2,NULL,'A partir de Francheville prendre le D103 en direction de Vernot. \n1,5 Km après la sortie du village, se garer à gauche dans une ancienne carrière. \nL’entrée du gouffre se trouve dans le front de taille de la carrière.[ref]Les spéléos à Francheville : http://www.mairie-francheville21.fr/index.php?option=com_content&view=article&id=61:les-speleos-a-francheville&catid=18&Itemid=120[/ref]\n\nIl est possible de dormir dans un ancien lavoir à proximité. ou au gite de "la clairière" à 20 minutes à pied de Francheville\n\nTopographie et source : http://cds21.org/cavites_cotedor/topo/cap.htm',3,'fra',false),
	 (157,6,NULL,'2009-03-29 14:22:00.000',NULL,2,'Accès','Les coordonnées GPS de Grottocenter ont été validées le 1er novembre 2014.\n\nDu hameau du Coulet, emprunter la piste qui conduit au ruines du Mas de Larret. \nAu bout de 600 mètres, tourner à gauche. \nAu bout de 1,5 km de piste en état moyen (voiture surélevée conseillée), se garer sur un replat à droite de la piste (coordonnées du parking N43.81996 E003.55991). \nDe là, un petit sentier mène à l''entrée de l''aven distant d''environ 150 mètres.\nL''entrée est maçonnée et la porte n''existe plus.\n\nExplorations interdites en périodes de chasse.\n\nPendant la période "tolérée" le propriétaire (Mr Buresi) demande à ce qu''un seul véhicule soit garé à proximité du trou (cf. supra). \nLes autres doivent être garés au bord de la route juste à la sortie du Coulet (aire de parking herbeuse à droite).',17,'fra',false),
	 (228,5,NULL,'2009-08-18 21:13:15.000',NULL,4,'Sentier','Le sentier qui descend à la gortte se situe dans l''épongle de la route. Il faut descendre d''une 20aine de mètres.',6,'fra',false),
	 (216,3,NULL,'2009-08-16 11:56:27.000',NULL,4,'Accès','A la sortie du village, au bord de la route qui mène à Lagarde d’Apt, l’ancienne entrée dangereuse de l’aven est surmontée d’une grande chèvre métallique. \nLa nouvelle entrée a été forée en 2015 et est situé à une dizaine de mètres de la chèvre sous une bouche d''égout.\n\nNe pas se garer proche des habitations mais plutot directement sur la pelouse sur le terrain de l''entrée du Souffleur.',12,'fra',false),
	 (295,5,NULL,'2009-08-28 19:36:30.000',NULL,4,'Note accès','Grotte touristique, fléchèe dans le village.',13,'fra',false),
	 (323,3,NULL,'2009-10-01 14:14:05.000',NULL,3,NULL,'Depuis la grotte touristique (grottes de Choranche), continuer le chemin en pied de falaise.\nSuivre le ruisseau en remontant, jusqu''au porche.',14,'fra',false),
	 (384,1,NULL,'2009-12-30 21:31:52.000',NULL,3,'Accès alternatif','Accés alternatif "par le haut", nettement plus long mais plus praticable.\nL''accés classique par "le bas" est praticable en dec 2010. \n\nDu coulet prendre la piste à l''est (GR) suivre le GR sur 1km et laisser à main gauche le départ du chemin d''accés par le bas. \nRapidement il y a un nouvel embranchement, suivre toujours le GR = aller à gauche cette fois. le chemin monte puis marque une épingle (2,7 km depuis le coulet). \nPrendre le chemin en face dans l''épingle et quitter le GR. \nCe chemin est barré par une clôture juste aprés ; ne pas oublier de refermer derrière soi. \nLa piste suit longuement une clôture à flanc de colline, sous le Serre des Pins, arrive à un replat et redescend plus nettement après un virage à gauche. \nLa piste change alors de versant en contournant un puech et descend toujours. \nAprès une épingle à cheveux à droite, le parking de l''aven se situe sur un replat entre deux puech (point coté 625 sur l''IGN)\nAccés à l''entrée de la grotte en descendant dans le petit talweg.\n\nATTENTION\nLa boucle "accés haut" - "accés bas" est parfaitement visible sur la vue satellite. \nLes chemins sont sur la carte IGN 1/25000.',17,'fra',false),
	 (480,4,NULL,'2010-02-19 17:07:25.000',NULL,4,'Accès','De la D911, quelques kilomètres au nord du pont de Lescheraines, il suffit de prendre la petite route qui descend vers le Chéran et vers l''entrée de la grotte. \nIl est possible de garer 4 à 5 voitures avant le pont, sur la droite.',4,'fra',false),
	 (834,2,NULL,'2013-08-19 21:15:51.000',NULL,3,'Accès','De Millau, prendre l''autoroute A75 vers Montpellier. \nA 30 kilomètres prendre la sortie 48 direction Cornus, Alzon ; puis au rond point prendre la direction des Infruts, La Pezade. \nTraverser la Pezade puis prendre la D 140 à droite vers Mas Raynal. \nOn laisse ce village sur la droite puis on continue la route sur 1 kilomètre et on emprunte alors un chemin à gauche (panneau indicateur : Abîme du Mas Raynal). \nLe chemin mène à moins de 100 mètres de la grande entrée (40 m x 20 m) située sur la gauche du parking.',18,'fra',false),
	 (2360,1,NULL,'2014-08-02 21:25:44.000',NULL,3,'Note et accès','Le digramme "CP" fait référence à la zone de la Combe aux Puaires.\n\nLe CP16 est situé à une trentaine de mètres à l’est du CP14, en contrebas de la falaise du CP15. \nLe gouffre s’ouvre à la faveur de la grande faille qui traverse l’ensemble des lapiaz de la Tête à l''Homme.',2,'fra',false),
	 (2699,4,NULL,'2015-04-09 16:23:08.000',NULL,4,'Accès','Au bord de la route sur la gauche en montant derrière une barrière bleu.',20,'fra',false),
	 (5207,5,NULL,'2019-09-07 17:17:09.000',NULL,0,NULL,'Avant d''arriver à la station de ski, prendre à droite la route de l''espagne, passer devant l''ancien chalet des douanes et continuer vers le col de la PSM. \nOn aperçevra sur la droite une bergerie à 50 mètres de la route, au niveau du départ du télésiège des contrebandiers. \nOn pourra garer les véhicules en bordure de route (demander aux bergers).\n\nPrendre ensuite le sentier qui passe devant la bergerie et se diriger vers la dépression herbeuse de Caque. \nPrendre un petit sentier (peu marqué) sur la droite pendant 50 mètres (ne pas aller jusqu''au sommet du lapiaz) puis se diriger vers la gauche, dans le lapiaz, sur 100 mètres. \nUn sentier discret mène au GL 102[ref]* Fiche cavité du CDS 64 : http://cds64.org/WordPress3/wp-content/uploads/2017/07/GL_102.pdf[/ref].',10,'fra',false);

INSERT INTO public.t_history (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,body,id_cave,id_entrance,id_point,id_language,is_deleted) VALUES
	 (81,6,NULL,'2009-04-03 21:01:40.000',NULL,4,'L''entrée originelle de la Leicasse a été découverte le 2 janvier 1983, par Gilles BARRAU (GERSAM) lors d''une séance de prospection avec deux collègues.\n\nLe trou souffleur initial gros comme le poing et le méandre qui suivait ont nécessité 6 séances de désobstruction percutante.\nLe 6 février 1983 le puits du Robot (P109, fractionné en trois parties est descendu en première par Gilles BARRAU, Jean CHERY puis Guilhem MAISTRE) est atteint et la galerie des Meulières est explorée.\n\nS''ensuivent  trois séances de désobstruction vers -160.\n\nDans la nuit du 12 au 13 mars 1983 les spéléos du GERSAM explorent les galeries de la Nuit Blanche jusqu''à la salle Edmond Milhau.\nCourant 1983 et 1984 l''essentiel du réseau est exploré.\nEn septembre 1984 le GERSAM explore le réseau du Grand Fond\nPar la suite les explos se sont poursuivies plus ou moins régulièrement jusque dans les années 90.\n\nHistorique complet disponible dans la monographie du réseau.',NULL,17,NULL,'fra',false),
	 (101,3,NULL,'2009-08-16 12:08:27.000',NULL,1,'La topographie initiale est relevée par le GSBM en 1986. \nEn 2002, une autre équipe, du GSBM et quelques amis spéléos, découvrent une suite du gouffre et atteignent la profondeur de 750 mètres.\nEn janvier 2005 Frédéric Poggia, aidé d''une multitude de sherpas, plonge le siphon aval et atteint la profondeur de 795 mètres[ref]Spéléo N° 52[/ref].\n\nA partir de 1995, l''exploration de l''amont du méandre de l''Ankou est entreprise. Elle aboutit en 2013 par le percement de la seconde entrée, nommée aven Aubert en l''hommage du généreux propriétaire du terrain, disparu prématurément. Prolongé ainsi par le haut, le réseau atteint ainsi en 2013 une profondeur de 843 mètres et un développement de 5152 mètres[ref]SAUSSE Olivier, "Ouverture de l’aven Aubert : nouvelle entrée du trou Souffleur (Saint-Christol-d’Albion, Vaucluse)", Spelunca n°130, pages 19 à 30 : http://www.gsbm.fr/publications/france/2013_Spelunca_130_Sausse.pdf[/ref].\n\nLe 21 décembre 2014, la jonction avec l''aven des Neiges porte la profondeur à 921 mètres et le développement à plus de 10 kilomètres[ref]Spéléo Magazine n°89, mars 2015[/ref] [ref]CATON Pascal, "Découverte de l’aven des Neiges: nouvelle entrée du trou Souffleur (Saint-Christol-d’Albion, Vaucluse)", Spelunca n°137, 2015, pages 13 à 15 : http://www.gsbm.fr/publications/france/2015_Spelunca_137_Caton.pdf[/ref].',NULL,12,NULL,'fra',false),
	 (327,2,NULL,'2013-08-19 21:23:49.000',NULL,2,'En 1973, après plusieurs plongées de reconnaissance, les plongeurs du CLPA  (Daniel Bosc, Jean-louis et Yves Gilles, Pascal Parot) organisent un camp post-siphon (08-16/09/73) dans l''amont, augmentant la connaissance de la cavité de 300m et levant une topographie précise. Une incursion dans l''aval l''année suivante (07/10/1974) permet à la même équipe de parcourir 500m de rivière supplémentaires.\nLe 25/11/1978, Patrick PENEZ et Fred VERGIER poursuivent l''exploration du réseau aval en franchissant le rapide qui avait arrêté leurs prédécesseurs : 350m de première, arrêt sur diaclase impénétrable dans la rivière.',NULL,18,NULL,'fra',false),
	 (325,1,NULL,'2013-07-20 19:38:46.000',NULL,4,'Cavité découverte en 1975 et non en 1957',NULL,11,NULL,'fra',false),
	 (326,2,NULL,'2013-08-19 21:22:35.000',NULL,0,'Tiré du site "http://www.plongeesout.com/"\n\nAprès une visite de reconnaissance (13/09/1885), L.ARMAND, E.FOULQUIER, G.GAUPILLAT et E.A.MARTEL atteignent la rivière le 07/07/1889 à la suite d''une descente mouvementée ponctuée de chutes de pierres.\nEn 1923, M.CREMIEU franchit une voûte basse et progresse jusqu''au siphon aval. Il faudra attendre 1933 pour que des spéléologues découvrent du "neuf" avec l''exploration d''une salle en amont (L.BALSAN), puis 1934 pour la première descente par les "puits parallèles".\nLes premières plongées remontent au 21-22/03/1970 où le GEPS, mené par Jean-Louis VERNETTE, et le SCM avec l''assistance du SCBAM franchit les siphons amont et aval, découvrant au total plus de 1000m de galeries vierges avec les conduits et salles post-siphon.',NULL,18,NULL,'fra',false),
	 (2651,5,NULL,'2016-11-17 19:39:39.000',NULL,-5,'Le gouffre a été ainsi baptisé par les spéléos du club Vulcain en souvenirs des spéléos Jean Dupont et Bernard Raffy, disparus pendant une exploration de la goule de Foussoubie en 1963.\nLe gouffre Jean-Bernard fut pendant quelque temps la cavité la plus profonde connue du monde au passage à la cote -1 455 m en 1981, avant d''être dépassé par le gouffre Mirolda. \nEn 2010 il reste le deuxième gouffre le plus profond de France, et le sixième mondial[ref]Article de l''encyclopédie collaborative Wikipédia, en français "Gouffre Jean-Bernard" : https://fr.wikipedia.org/wiki/Gouffre_Jean-Bernard[/ref].\n\nCoupe en 1991 : http://www.groupe-speleo-vulcain.com/wp-content/uploads/2011/03/JB-Coupe1991.pdf\n\nPlan en 2011 : http://www.groupe-speleo-vulcain.com/wp-content/uploads/2011/03/JB-plan2010-2.pdf\nAtlas en 2011: http://www.groupe-speleo-vulcain.com/wp-content/uploads/2011/03/Atlas-JB-Binded1000.pdf',NULL,1,NULL,'fra',false),
	 (6423,5,NULL,'2019-02-14 13:36:30.000',NULL,0,'En 1951 et 1952, le SCM entreprend le déblaiement du trop-plein de la source de Saint-Jean alias source des Sicards (cf. présente fiche GC n°9) ; mais le SCM est arrêté par l''interdiction du propriétaire. \n\nCette désobstruction est reprise en 1969 par le CLPA à la suite de la coloration de la grotte de l''Ours et de la recherche du vrai propriétaire de la source. Le propriétaire présumé n''étant pas celui interdisant l''accès des lieux. Coloration dont le temps de réapparition rapide (10m /h) plaidait en faveur d''un réseau important exondé.\nUn siphon, plongé par les frères Gilles, P. Parrot, D. Bosc de 1971 à 1973, donne accès à un réseau important. \n\nPour éviter toute polémique au sujet de la source et de sa fréquentation et explorer la galerie qui fait suite a la salle du 8 juin découverte par les plongeurs du club l''ouverture d''une entrée artificielle est effectuée avec l''accord du propriétaire de la parcelle concernée.La première salle est repérée en surface (expérience électromagnétique), et le 8 juin 1974, après bien des efforts de désobstruction, cette entrée artificielle est ouverte (702,89-171,28-193m). \nElle est située à 15 mètres au nord de la route, 30 mètres après la maison isolée jouxtant un ancien virage corrigé. Cette entrée est condamnée et ne doit pas être utilisée. Une nouvelle entrée artificielle a été réalisée : L''entrée des "Feuilles Mortes".\n\nOn trouvera dans Caumont (1979) une première approche de l''étude de la cavité et l''historique détaillé de l''exploration du Garrel jusqu''à 1979. \n\nEn 1982, escalade sur 150 mètres d''une cheminée de 15x15 (Cheminée du Phallus). \nNouveaux travaux de topographie du CLPA à partir de 1984. \n\nEn 1990 une nouvelle entrée dite des Feuilles Mortes (702,76-171,31 - 235 m) est ouverte après report de topographie en surface et repérage aux fumigènes (cf. fiche GC n°24784 : https://www.grottocenter.org/html/file_Fr.php?type=change&category=entry&id=24784#)[ref]Groupe d''Etudes et de Recherches Spéléologiques et Archéologiques de Montpellier (GERSAM), "L''inventaire du Larzac et de la Séranne", chapitre "53 - Commune de Saint-Jean-de-Buèges" : http://jfbrun.eu/gersam/stjeanbu.htm[/ref].',NULL,9,NULL,'fra',false);

INSERT INTO public.t_comment (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,e_t_underground,e_t_trail,aestheticism,caving,approach,title,body,alert,id_cave,id_entrance,id_exit,id_language,is_deleted) VALUES
	 (1,6,NULL,'2008-07-29 14:07:09.000',NULL,2,'06:00:00'::interval,'00:20:00'::interval,5.0,5.0,4.0,'Sortie du dimanche 20 janvier 2008','Une chouette sortie à la journée pour se perfectionner à l''équipement ou travailler sa progression sur corde (on ne la quitte jamais). Le plus difficile étant de ne pas se perdre dans les bois et le passage de la lucarne. \n',false,NULL,7,NULL,'fra',false),
	 (2,6,NULL,'2008-07-29 18:27:00.000',NULL,2,'05:00:00'::interval,'01:30:00'::interval,7.0,7.0,3.0,'Sortie du samedi 12 juillet 2008 - cascade Jean Dupont','Une très jolie sortie, techniquement facile avec des puits plein de volume (puits des Savoyard et puits Alain).\nMalheureusement, nous n''avons pu aller jusqu''à la cascade Jean Dupont en raison du trop grand volume d''eau.\nTemps d''approche 1h30 en été à partir du refuge du Folly.',false,NULL,1,NULL,'fra',false),
	 (6,4,NULL,'2008-08-04 17:07:26.000',NULL,2,NULL,NULL,NULL,NULL,NULL,'Possibilité de traversée depuis 2006','En 2006, une nouvelle entrée "Rochotte" a été découverte. \nDescendre la route sur env. 500m puis prendre à gauche un chemin forestier qu''il faut remonter sur env. 300m. \nL''entrée, entourée d''un grillage, s''ouvre sur la droite. Possibilité de faire une traversée avec 2 équipes.\nEnchaînement de deux puits (chatière entre les 2), le second arrivant un peu avant la cascade.',false,NULL,3,NULL,'fra',false),
	 (28,1,NULL,'2008-08-18 10:43:34.000',NULL,4,'16:30:00'::interval,'00:15:00'::interval,10.0,4.0,8.0,'Restriction saisonnière d''accès','Accès interdit en période de chasse.',false,NULL,17,NULL,'fra',false),
	 (50,6,NULL,'2008-09-19 19:06:29.000',NULL,2,'09:00:00'::interval,NULL,NULL,NULL,NULL,'CR Saint de Glace, Méaudre (38) du 07/09/2008','Participants : Estelle Forbach, Frédéric Delègue, avec pour initiés : Alexandra, Renaud, Sonia, Anouk, Loïc, Cédric.\n\nVoici un petit groupe d''invétérés,\nPartant sous un beau temps presque avéré,\nA l''assaut des abîmes du Vercors,\nPour aller y faire quelques efforts.\n\nCette sortie prévue de longue date,\nIl ne fallait pas qu''ils la ratent,\nEt c''est avec un rendez-vous de bonne heure,\nQu''ils partirent, dans la joie et la bonne humeur.\n\nLes initiés curieusement accoutrés,\nOnt progressivement vu leurs curiosités s''aiguiser,\nJusqu''à ce qu''enfin le moment soit venu,\nDe s''engouffrer dans des profondeurs inconnues.\n\nC''est alors qu''ils purent découvrir,\nCe terrain donc ils garderaient des souvenirs,\nFait de méandres, puits et conduites forcées,\nOù dans la boue, on peut se rouler.\n\nAlex se souvenant de Jujurieux,\nSe souvint qu''elle en était sortie pleine de bleus,\nMais grâce à de miraculeuses genouillères,\nElle ressortit de là, bien moins amère.\n\nFaisant confiance au descendeur,\nIl fallut combattre leurs peurs :\nPour une première descente en rappel,\nIl ne fallait pas qu''ils chancèlent.\n\nL''ambiance était plutôt aquatique,\nEt les bleus de travail n''étant pas très pratiques,\nChaque attente en haut d''un puits,\nFit que rapidement, l''air sembla rafraîchi.\n\nMais c''était évident, une fois en bas,\nLes chercher, on ne viendrait pas :\nIl fallait sur les cordes remonter,\nAvec ce que l''on appellait, croll et poignée.\n\nLa remontée sembla pour beaucoup très physique,\nEt il fallut faire un effort sur son psychique,\nPuis, pendant que certains servaient de marche pied,\nRenaud aussi, aidait les autres à remonter.\n\nLe retour tardif chez chacun,\nFut pour bon nombre, suivi d''un bon bain :\nLoin des activités citadines,\nCe ne fut pas une sortie anodine...\nTPST : 9 h',false,NULL,21,NULL,'fra',false),
	 (67,6,NULL,'2008-10-13 15:39:49.000',NULL,3,'14:00:00'::interval,'00:10:00'::interval,5.0,4.0,9.0,'Travaux en cours (2008)','Travaux d''exploration toujours en cours.\nPour toutes informations, contactez le CLPA',false,NULL,9,NULL,'fra',false),
	 (224,5,NULL,'2009-08-18 21:11:54.000',NULL,4,'00:00:00'::interval,'00:00:00'::interval,8.0,3.0,8.0,'','Attention au CO2 dans les inter-siphons.',false,NULL,6,NULL,'fra',false),
	 (215,5,NULL,'2009-08-18 17:46:31.000',NULL,2,NULL,NULL,8.0,4.0,10.0,'Appréciation globale et conseils de prudence','Cavité magnifique, bivouac ****. \nL''accès au réseau terminal se fait par des escalades extrêmement glaiseuses, il faut faire attention aux cordes.\nPrévoir d''amener dans son équipement un coinceur ou "goutte d''eau" pour pouvoir équiper certains passages en hors crue.\nIl est déconseillé d''aller à - 600 en cas de fortes pluies ou période assez humide ; le P114 "arrose".',false,NULL,12,NULL,'fra',false),
	 (324,5,NULL,'2009-09-02 16:53:11.000',NULL,-4,NULL,NULL,7.0,7.0,9.0,'','',false,NULL,5,NULL,'fra',false),
	 (312,5,NULL,'2009-08-28 19:36:03.000',NULL,4,'00:00:00'::interval,'00:00:00'::interval,8.0,7.0,9.0,'','Très jolie cavité, assez complexe.\n\nDemander l''autorisation au gérant de la grotte.',false,NULL,13,NULL,'fra',false),
	 (338,5,NULL,'2009-09-22 04:51:27.000',NULL,4,NULL,NULL,6.0,8.0,10.0,'','Cavité d''initiation à la verticale et à l''équipement esthétique.',false,NULL,15,NULL,'fra',false),
	 (376,5,NULL,'2009-11-14 06:51:15.000',NULL,3,NULL,NULL,7.0,7.0,10.0,'Cavité d''initiation jusqu''à la salle Hydrokarst','Cavité praticable en crue jusqu''à la salle Hydrokarst (équipement hors crue possible), tout en sachant que certains ressauts arroseront et le spéléo sera mouillé malgré tout.\nPour ce qui est du hors crue, il faut quand même faire attention.\nLa salle Hydrokarst peut se mettre en charge lors de très grosses crues, et le méandre jonctionnant la salle Hydrokarst et le bas du Toboggan peut alors siphonner.\n\n\nJusqu''à la salle Hydrokarst, c''est effectivement une chouette balade ; initiation possible avec des novices qui ont un minimum de condition physique...\n',false,NULL,21,NULL,'fra',false),
	 (391,1,NULL,'2009-12-16 09:56:47.000',NULL,4,'09:30:00'::interval,'00:15:00'::interval,6.0,5.0,10.0,'Traversée Saints de Glace -> Trou Qui Souffle','La traversée est intéressante sur les deux parties verticales : entrée par SdG, les puits et la salle HydroKarst + sortie par les grands puits du TQS. En outre, la partie étroite et boueuse à mi-parcours peut en décourager certains... Cette sortie vaut vraiment le coup mais attention à bien avoir la topo avec sois, voire même la boussole car il y a des endroits assez labyrinthiques !',false,NULL,21,NULL,'fra',false),
	 (398,2,NULL,'2009-12-30 22:27:52.000',NULL,3,'08:00:00'::interval,'00:10:00'::interval,9.0,4.0,8.0,'Appréciation et remarques en 2009','Contacter le propriétaire pour avoir l''autorisation d’accès.\nToujours aussi bien ! \nLe shunt décrit rend l’accès à la galerie du Tac o Tac très "rapide".\niI y a un autre shunt qui mène à l''extrémité de la galerie de la nuit blanche plus sympa car on fait alors toute la galerie avec sa section en tube et la cavité parait plus importante. ',false,NULL,17,NULL,'fra',false),
	 (849,4,NULL,'2010-02-19 22:35:45.000',NULL,2,'05:00:00'::interval,'00:01:00'::interval,6.0,5.0,10.0,'Temps d''approche et de visite - Avertissement','ATTENTION : Il convient d''être très attentif aux conditions climatiques avant de s''engager dans la cavité.',false,NULL,4,NULL,'fra',false),
	 (890,1,NULL,'2010-06-07 13:39:03.000',NULL,4,NULL,'10:00:00'::interval,9.0,7.0,10.0,'Etat de l''équipement en 2010','La cavité a été rééquipée en 2009-2010 : \n- du fossile jusqu''à la cascade de 12 mètres (C12), par des échelons et des broches (prendre une corde pour le rappel de la C12 (30 m minimum), et pour d''autres ressauts si besoin.\n- la partie fossile entre le P40 et le siphon 1 : cordes neuves sur broches.\n\nIl n''y a plus de fil clair, sauf 2 entre le siphon 1 et le siphon 2.\n',false,NULL,14,NULL,'fra',false),
	 (984,4,NULL,'2012-03-21 17:45:26.000',NULL,4,'09:00:00'::interval,'00:10:00'::interval,7.0,4.0,9.0,'Témoignage de visite (2012)','Paumatoire mais superbe!\nAller - retour jusqu''au siphon des pas perdus avec un détour par la (grande) salle des pas perdus.',false,NULL,9,NULL,'fra',false),
	 (1002,4,NULL,'2012-07-30 18:53:37.000',NULL,4,'06:00:00'::interval,'00:01:00'::interval,9.0,8.0,10.0,'Sortie aller-retour par l''entrée de la carrière jusqu''à la galerie des marmites - Temps passé (voir icônes) et appréciation','Superbe !',false,NULL,3,NULL,'fra',false),
	 (1054,1,NULL,'2013-05-02 23:51:25.000',NULL,4,'04:30:00'::interval,'00:20:00'::interval,7.0,7.0,7.0,'Fiche d''équipement','Dans la fiche d''équipement j''ai enlevé les 4 sangles : inutiles.',false,NULL,7,NULL,'fra',false),
	 (2309,5,NULL,'2014-08-02 21:26:34.000',NULL,4,NULL,NULL,NULL,NULL,NULL,'CP16 : accès au réseau de la Combe aux Puaires','Le CP16 représente un accès particulièrement facile et rapide au réseau de la Combe aux Puaires. \n\nLe CP16 présente cependant encore un défaut important : malgré la découverte d’un nouvel itinéraire dans le puits d’entrée, il ne faut guère espérer une ouverture avant fin août ou début septembre. \nLa période d’exploration est forcément courte.',false,NULL,2,NULL,'fra',false);
INSERT INTO public.t_comment (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,e_t_underground,e_t_trail,aestheticism,caving,approach,title,body,alert,id_cave,id_entrance,id_exit,id_language,is_deleted) VALUES
	 (2624,4,NULL,'2014-11-02 20:28:43.000',NULL,3,'09:00:00'::interval,'00:05:00'::interval,8.0,5.0,6.0,'Ma première visite de la Leicasse','Plusieurs shunts, du volume. Superbe!\nEn période de chasse bien contacter le propriétaire (voir avec le CDS34) avant de vous rendre sur place pour vérifier qu''une battue n''est pas organisée!\n',false,NULL,17,NULL,'fra',false),
	 (2671,4,NULL,'2015-04-16 01:16:02.000',NULL,4,'10:00:00'::interval,'00:10:00'::interval,9.0,7.0,8.0,'Temps de visite jusqu''en haut du P40, en 2015 : 10 heures','Sortie d''une dizaine d''heures avec le SCM jusqu''en haut du P40. \nIl y avait beaucoup d''eau (plus de 40 à l''échelle de l''entrée) et les cascades étaient grandioses !',false,NULL,14,NULL,'fra',false),
	 (2667,4,NULL,'2015-04-09 16:28:44.000',NULL,4,'06:00:00'::interval,'00:15:00'::interval,8.0,6.0,10.0,'Traversée TQS -> Saints de Glace','Très belle travsersée faite avec la CoJ un lendemain de pluie avec pas mal d''eau dans TQS et dans Saints de Glace. Superbe!!\nOn a fait un petit détour vers le siphon depuis la salle Hydrokarst avant de remonter le méandre des Saints de glace.\nTout était équipé pour la CoJ mais nous avons déséquipé le méandre Francois et les Saints de Glace à la remontée.',false,NULL,20,NULL,'fra',false),
	 (2884,4,NULL,'2016-03-16 19:31:12.000',NULL,4,'20:00:00'::interval,'00:01:00'::interval,8.0,4.0,10.0,'Expérience personnelle','Sortie club avec le SCM jusqu''à la rivière en équipant et déséquipant (9 kits). \nOn s''est trompé dans le méandre de l''Ankou en prenant le bas du méandre (1h30 de perdu !) Il faut bien rester en haut du méandre ! \nLes grands puits terminaux et la rivière sont superbe !',false,NULL,12,NULL,'fra',false),
	 (2885,5,NULL,'2016-03-17 01:55:19.000',NULL,3,NULL,NULL,NULL,NULL,NULL,'Conseil pour le méandre de l''Ankou','Comme indiqué dans le témoignage précédent, il faut rester (presque) en haut du méandre de l''Ankou pour éviter de se retrouver dans un cul-de-sac.\nPour se guider, on pourra tenter de suivre, outre les traces de passage parfois trompeuses, d''anciens micro-perçages destinés à faciliter un éventuel élargissement du méandre en cas de secours difficile...',false,NULL,12,NULL,'fra',false),
	 (2973,5,NULL,'2016-08-10 11:48:49.000',NULL,4,NULL,NULL,NULL,NULL,NULL,'Année de découverte','Joël, si tu as des sources fiables, n''hésite pas à corriger directement le champ "année de découverte".',false,NULL,11,NULL,'fra',false),
	 (3041,5,NULL,'2016-11-17 20:21:08.000',NULL,0,'17:00:00'::interval,'01:00:00'::interval,NULL,NULL,NULL,'De la cascade Jean Dupont au bivouac -900 m','Course réalisable uniquement en hiver ; attention au redoux possible et aux risques d''avalanche.\nTemps d''approche à partir du refuge quand on connait les passages clefs. ; il est facile de se perdre avec la neige, surtout si le brouillard est de la partie...\nCourse magnifique, grandiose. \nCela reste une course d''envergure, même si elle est techniquement assez facile. \nNe pas oublier que nous sommes constamment dans les embruns et le souffles des cascades. \nAttention, la course est longue, le TPST affiché est dans le cas ou la cavité est en grande partie équipée ; sinon, compter plusieurs sorties pour équiper la cavité jusqu''au fond.\nContacter le GS Vulcain pour plus d''infos quant au conditions, et au matériel disponible sur place.\nToujours en cours d''exploration...',false,NULL,1,NULL,'fra',false),
	 (3052,1,NULL,'2017-01-27 17:28:38.000',NULL,-1,'12:00:00'::interval,'03:00:00'::interval,10.0,5.0,10.0,'Lieu vers albums photos','Photos de 1984 prise par Laurent\nhttps://goo.gl/photos/G42QVk25GrtECUTk9',false,NULL,17,NULL,'fra',false),
	 (3104,5,NULL,'2017-04-18 18:41:15.000',NULL,0,NULL,NULL,NULL,NULL,NULL,'Les travaux prévus en juillet 2017 sont reportés en octobre 2017','Communiqué du CDS 21\n \nInitialement prévu du 5 au 12 juillet 2017, les travaux à la Combe aux Prêtres ont été reportés en octobre 2017[ref]http://speleo-cote-dor.cds21.org/2017/07/25/travaux-a-la-combe-aux-pretres/[/ref].\n\nDans le cadre de l’équipement et de la sécurité des sites de pratique, le CDS21 a décidé de réaliser des travaux durant la période du 12 au 17 octobre 2017 sur l’entrée historique de la Combe aux Prêtres. De ce fait la cavité ne sera pas accessible par cette entrée.\n\nCes travaux consistent au démontage du toit en lave au dessus du premier puits d’accès. A la place il y aura un toit et un encadrement solide en maçonnerie garantissant une parfaite protection des pratiquants.\n\nL’entrée par le Gouffre de la Rochotte reste bien évidemment accessible. Un panneau indiquant les prochains travaux sera installé à l’entrée de la Combe.\n\nMerci dans prendre note et de diffuser\n\nEt merci de votre compréhension…\n\nLe CDS 21',false,NULL,3,NULL,'fra',false),
	 (3249,2,NULL,'2018-11-23 14:23:00.000',NULL,3,NULL,NULL,NULL,NULL,NULL,'ETAT DES EXPLORATIONS EN 2018-2020','La cavité est toujours en exploration par le CLPA en 2018 et 2020\nPrière de respecter les équipements mis en place dont certains sont régulièrement volés. Ne pas poser de flêchages et autres marques fluorescentes !.\nLe CLPA, inventeur de la cavité, contribue à l''entretien de ces équipements dans la mesure de ses moyens.   \n\nUne monographie complète de la cavité est en cours. Elle est pratiquement terminée Elle sera publiée courant 2020. ',false,NULL,9,NULL,'fra',false),
	 (3391,3,NULL,'2019-07-01 10:52:57.000',NULL,1,'10:00:00'::interval,'00:20:00'::interval,7.0,5.0,8.0,'Une belle visite de près de 10h00 - Juin 2019','Une très belle visite jusque après la C12.\nNous nous sommes arrêté là, car la vire en fixe de la C12 est plus que pourrie ! Rongée à moitié contre une plaquette ! Pas sécuritaire du tout. \nPrévoyez votre propre corde pour passer et accéder à la grande barrière non loin de là. \nLa plupart des vires sont HS (arrachée). Certainement le débit important d''eau par période. \n\nVidéo de la sortie : https://www.youtube.com/watch?v=AGq0dB81Zzk ',false,NULL,14,NULL,'fra',false),
	 (3427,5,NULL,'2019-09-07 17:42:51.000',NULL,4,NULL,NULL,NULL,NULL,NULL,'Recommandations du CDS 64','1 - ATTENTION AUX CRUES\n\nEn cas de forte crue, les deux derniers puits (P54 et P47) sont très arrosés et deviennent difficiles voir impossibles à remonter. \nDe même, la progression dans la rivière peut se révéler très dangereuse notamment le changement de rive avant la cascade de 8 m, la vasque juste avant l''embarcadère et les rapides. \nPour ces raisons, les périodes de fortes pluies et/ou de fonte des neiges sont à éviter.\n\n\n\n2 - PRÉCAUTIONS DE PROGRESSION\n\nPour la partie aquatique (depuis l''Embarcadère), deux choix s''offrent à vous /\n- néoprène complète \nou \n- pontonnière + canot + 25 mètres de drisse de rappel.\n\nLa progression horizontale n''est pas toujours évidente ; pensez à vous munir d''une corde de 15 à 20 mètres pour vous assurer dans certains passages ou pour remplacer une corde fixe abîmée.\n\n',false,NULL,10,NULL,'fra',false);

INSERT INTO public.t_type (id,"name","comment",is_available,id_parent) VALUES
	 (4,'Image','A visual representation other than text',true,NULL),
	 (12,'Doc','Doc',false,NULL),
	 (18,'Article','An article from a source',true,12);

INSERT INTO public.t_file_format (id,"extension","comment",mime_type,softwares) VALUES
	 (871,'jpg         ',NULL,'image/jpeg',NULL);

INSERT INTO public.t_document (id,id_author,id_reviewer,id_validator,date_inscription,date_validation,date_publication,is_validated,validation_comment,pages,identifier,issue,id_identifier_type,ref_bbs,id_entrance,id_massif,id_cave,id_author_caver,id_author_grotto,id_editor,id_library,id_type,id_parent,id_license,pages_bbs_old,comments_bbs_old,publication_other_bbs_old,publication_fascicule_bbs_old,author_comment,date_reviewed,is_deleted,redirect_to) VALUES
	 (6068,5,NULL,0,'2017-04-19 11:38:39.000','2020-12-22 00:14:06.621','2013-01-01',true,NULL,NULL,NULL,NULL,NULL,NULL,21,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (1409,4,NULL,0,'2010-06-20 21:07:28.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (2542,4,NULL,0,'2012-10-19 22:41:58.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,20,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (2998,1,NULL,0,'2014-08-02 21:27:03.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (6065,5,NULL,0,'2017-04-18 01:43:38.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (6096,5,NULL,0,'2017-07-28 11:09:34.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (10406,4,NULL,0,'2019-02-14 02:25:00.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (12639,5,NULL,0,'2019-10-04 00:48:05.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (109,1,NULL,0,'2009-04-03 21:14:47.000','2020-12-22 00:14:06.621','1984-01-01',true,NULL,'6-7,',NULL,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (5801,5,NULL,0,'2017-01-22 01:28:53.000','2020-12-22 00:14:06.621','1973-01-01',true,NULL,'19-34,',NULL,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (191,5,NULL,0,'2009-08-18 17:42:00.000','2020-12-22 00:14:06.621','1970-01-01',true,NULL,'35-168,',NULL,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (16746,4,NULL,0,'2018-06-23 16:38:47.000','2020-12-22 00:14:06.621',NULL,true,NULL,NULL,NULL,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (161,6,NULL,0,'2009-06-05 20:00:13.000','2020-12-22 00:14:06.621','2009-01-01',true,NULL,'19-251,',NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (1378,6,NULL,0,'2010-06-07 13:40:15.000','2020-12-22 00:14:06.621','1981-01-01',true,NULL,'28,',NULL,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (2591,2,NULL,0,'2013-08-19 21:26:43.000','2020-12-22 00:14:06.621','1977-01-01',true,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL),
	 (12106,5,NULL,0,'2019-09-07 17:08:42.000','2020-12-22 00:14:06.621','1985-01-01',true,NULL,'2-6,',NULL,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,18,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,false,NULL);

INSERT INTO public.t_description (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,title,body,id_cave,id_entrance,id_exit,id_massif,id_point,id_document,id_language,is_deleted) VALUES
    (21,4,NULL,'2014-11-02 20:10:18.000',NULL,-3,'Le Labyrinthe','(...)',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (1,4,NULL,'2008-07-29 17:45:32.000',NULL,-6,'Topographie et informations importantes','Informations importantes: http://www.groupe-speleo-vulcain.com/explorations/explorations-a-samoens/gouffre-jean-bernard\n\nVoici la topo du réseau du Jean-Bernard, issue du site web du Groupe Spéléo Vulcain http://groupe.vulcain.free.fr :\n\nPlan en 2017 : https://www.groupe-speleo-vulcain.com/wp-content/uploads/2018/06/jb-Xav-2017-plan1000.pdf\nCoupe en 2017 : https://www.groupe-speleo-vulcain.com/wp-content/uploads/2018/06/jb-2017-coupe.pdf\n',NULL,1,NULL,NULL,NULL,NULL,'fra',false),
    (2,5,NULL,'2016-11-17 19:34:16.000',NULL,3,' Du V4 à la cascade Jean Dupont (équipement et balisage en place)','Les premiers -100m se font dans une conduite forcé ponctuée de quelques ressauts équipés jusqu''au puit des Savoyard (-25 m). \nJuste après le puits, descendre dans les éboulis. \nOn enchaine les Puits Alain (2 -15 m). \nOn suit un méandre jusqu''à un affluent du Jean-Bernard. \n3 ressauts dans l''affluent permettent d''atteindre la cascade Jean Dupont.',NULL,1,NULL,NULL,NULL,NULL,'fra',false),
    (3,1,NULL,'2014-08-02 21:26:12.000',NULL,1,'Description générale','L’entrée du CP16 est bouchée par un énorme névé quasiment en permanence. \nElle apparaît alors comme un simple abri sous roche protégeant un névé résiduel.\nEn réalité, le bouchon de neige et de glace protège un large puits de 25 mètres de profondeur qui amène dans une belle salle au sol recouvert de neige. \nSur la droite, un méandre surmonté d’une petite conduit forcée amène au sommet d’un beau puits de 14 mètres très propre. \nLe fond est irrémédiablement colmaté par un éboulis.\n\nLa suite se situe en réalité dans la salle d’entrée.\nUne escalade de 7 mètres permet de prendre pied dans un méandre descendant.\nUne dizaine de mètres étroits amènent au sommet d’un puits de 6 mètres.\nLe méandre continue un peu plus large, mais entrecoupé de concrétion jusqu’au sommet d’un puits de 5 mètres. \nLa galerie se sépare en deux puits qui se rejoignent peu après.\n \nLa cavité se développe alors sur une grande faille et les puits prennent du volume.\nPlusieurs paliers permettent d’atteindre le sommet d’un superbe puits circulaire de 48 mètres de profondeur.\nPlusieurs ressauts de tailles plus modestes peuvent ensuite se désescalader jusqu’à la cote -151 m où l’on butte sur un méandre impénétrable parcouru par un léger courant d’air.\n\nLa suite se situe en réalité à une dizaine de mètre du fond du P48 où un pendule permet de prendre pied sur une margelle qui donne accès à un nouveau méandre descendant de 1 mètre de large environ et parcouru par un violent courant d’air.\n\nCette lucarne donne accès à une courte galerie, avec deux ressauts, qui mène à un petit carrefour : \n\nDes boyaux étroits et malcommodes, dans l’axe de la galerie, amènent au sommet d’un vaste puits, la base du puits du Rasoir.\nDe fait il vaut mieux prendre un boyau horizontal en paroi droite qui débouche en lucarne dans le même puits du Rasoir.',NULL,2,NULL,NULL,NULL,NULL,'fra',false),
    (20,4,NULL,'2014-11-02 20:05:22.000',NULL,-1,'Le Grand Fond','De la base du P35, tourner à gauche dans la galerie de la Nuit Blanche et traverser un P23 en vire. \nIl est conseillé de descendre ce dernier pour aller visiter un méandre spectaculairement beau qui conduit après quelques ressauts à deux siphons dont le point bas est à -248.\n\nRevenu dans la galerie, on progresse de 80 mètres jusqu''au "Mur de la Honte" qui défend l''accès à un laminoir de 90 mètres suivi d''une série de ressauts sur 45 mètres, délicats à désescalader. \n\nOn poursuit dans un réseau de conduits surbaissés labyrinthiques, suivi d''une belle galerie en conduite forcée entrecoupée de trois puits de 13, 5 et 8 m jusqu''à -270. \n250 mètres de galeries basses entrecoupées de petits puits de 6, 7, 8, 5, 11 et 19 m conduisent à un siphon à la côte -331.\n(...)',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (4,4,NULL,'2008-08-04 19:42:37.000',NULL,-2,'Description générale','L''entrée se situe dans la paroi est de la carrière. \nUne succession de puits et de fissures plus ou moins étroits donne, après 52 mètres de descente, sur la rivière souterraine que l''on parcourt sur 200 mètres. \nEnsuite, une chatière longue d''une vingtaine de mètres et étroite permet d''accéder à la deuxième partie du réseau.\n\nCette dernière est constituée de galeries spacieuses, parfois très hautes, entrecoupées de grandes salles, et recoupant la rivière souterraine à plusieurs reprises.\nAu delà des grandes salles encombrées d''éboulis (jusqu''à 45 mètres de hauteur), la dernière partie constituée de diaclases étroites parcourues par la rivière se termine sur une voûte mouillante.\nLe développement total dépasse 20 kilomètres[ref]Les spéléos à Francheville : http://www.mairie-francheville21.fr/index.php?option=com_content&view=article&id=61:les-speleos-a-francheville&catid=18&Itemid=120[/ref].\n\nCavité en partie aquatique mais ne nécessite pas de néoprène, éventuellement une pontonnière. \nUn pont de singe permet de franchir un petit lac.\n\nEn 2006, une nouvelle entrée "Rochotte" a été désobstruée, ouvrant la possibilité de faire une traversée avec 2 équipes (cf Rochotte).\nPour cela, descendre la route sur environ 500 mètres puis prendre à gauche un chemin forestier qu''il faut remonter sur environ 300 mètres.\nL''entrée, entourée d''un grillage, s''ouvre sur la droite. \nPossibilité de faire une traversée avec 2 équipes.\nEnchaînement de deux puits (chatière entre les 2), le 2e arrivant un peu avant la cascade[ref]CDS 21 > Combe aux Prêtres : http://cds21.org/cavites_cotedor/topo/cap.htm[/ref]. ',NULL,3,NULL,NULL,NULL,NULL,'fra',false),
    (5,4,NULL,'2010-02-19 22:34:00.000',NULL,-5,'Avertissement important et descriptif général','ATTENTION : Il convient d''être très attentif aux conditions climatiques avant de s''engager dans la cavité.\n\nGalerie du sable - Chapelle : \n\nSuivre la galerie d''entrée jusqu''à un ressaut que l''on descend à l''aide d''une corde. \nAu pied se trouve un plan d''eau.\nPrendre la galerie qui remonte à droite. \nLaisser une galerie qui redescend vers le plan d''eau et rejoindre un carrefour (A). \nPrendre à gauche et franchir 2 passages bas faisant baignoire (le second est équipé d''un tuyau qui permet de vider l''eau vers l''avant de la progression).\nPrendre à droite, passer sur le bord  d''un puits : la galerie devient davantage concrétionnée. \nOn descend un ressaut pour atteindre une diaclase que l''on remonte pour rejoindre les marmites. \nIl est possible de mettre une corde pour assurer le passage (C25 4S). \nAu delà on arrive dans une grande galerie. \nA droite la galerie du sable remonte jusqu''à un puits d''une dizaine de mètres. \nIl faut le contourner par la droite. \nA gauche on atteint rapidement la Chapelle.\n\nLac vert : \n\nAu carrefour (A), il convient de continuer à remonter la galerie qui devient plus étroite.\nA un carrefour suivant, continuer par la galerie toujours étroite qui permet de continuer la progression dans la même direction.  \nOn entend l''eau couler quand l''espace s''élargit. \nArrivé dans une petite salle il faut trouver sous ses pieds la faille qui permet de rejoindre le lac vert. \nLe longer par le côté droit et s''engager dans une faille resserrée que l''on peut suivre jusqu''à une étroiture. \nOn peut choisir, quand une cheminée de quelques mètres s''ouvre dans le plafond, de la remonter et de suivre un itinéraire parallèle plus large et plus propre.. \nFait suite une diaclase qui descend à droite, équipée d''une corde à nœuds. \nUn boyau resserré permet de rejoindre la galerie d''entrée.\n',NULL,4,NULL,NULL,NULL,NULL,'fra',false),
    (6,6,NULL,'2008-07-28 20:06:02.000',NULL,3,'Objectif Fond','L''entrée est un joli P34 d''env. 3m de diamètre qui s''équipe à partir de l''arbre. Sa base est encombrée de branchages.\nOn continue sur une escalade de 9m équipée en fixe. La suite est une succession de puits. On ne quitte plus la corde. A la base du P28, le principal obstacle de la cavité (en particulier pour les débutants à l''équipement) la lucarne. Il s''ensuit une agréable coulée stalagmitique suivi du P20 et du P23. Un méandre étroit se termine sur une étroiture.\nUne cavité idéal pour apprendre à équiper.',NULL,7,NULL,NULL,NULL,NULL,'fra',false),
    (7,6,NULL,'2008-10-13 15:41:56.000',NULL,3,'DANGER DÛ A LA COMPLEXITE DU RESEAU','Réseau "paumatoire". \nNe pas s''y aventurer sans quelqu''un qui connaît ou une bonne topo, sinon "bonjour la galère"...',NULL,9,NULL,NULL,NULL,NULL,'fra',false),
    (8,5,NULL,'2018-11-23 14:17:25.000',NULL,4,'DANGER DES CRUES CEVENOLES (avertissement du CLPA)','ATTENTION DANGER\nNe pas s''introduire dans la cavité en période de précipitations intenses, notamment lors d''un "épisode cévenol". \nMise en charge possible rapide et passage du "Lac" impossible. \n',NULL,9,NULL,NULL,NULL,NULL,'fra',false),
    (9,5,NULL,'2019-09-07 17:57:32.000',NULL,3,'LES PUITS DU GL 102','Le premier puits est étroit, à sa base ; penduler vers le nord pour accéder au bon côté de la fissure.\n\nEnsuite, aucun problème d''itinéraire, les puits se succèdent jusqu''à - 370 m.\n\nA la base du dernier puits, un éboulis conduit dans une vaste galerie à la côte -390 m.',NULL,10,NULL,NULL,NULL,NULL,'fra',false),
    (10,5,NULL,'2019-09-07 17:58:47.000',NULL,4,'DE LA BASE DES PUITS À L''EMBARCADÈRE','Prendre sur la droite à la base des puits, passer un premier chaos (à gauche) pour arriver dans une salle d''un peu plus de 150 mètres.\n\nAu fond de cette salle se trouve une cascade qu''on descendra en rive droite. \n\nUne fois traversé le Chaos des Titans, on retrouve la rivière, c''est l''Embarcadère.\n',NULL,10,NULL,NULL,NULL,NULL,'fra',false),
    (11,5,NULL,'2019-09-07 18:02:13.000',NULL,3,'DE L''EMBARCADÈRE À LA SALLE STYX','Une fois le matériel de progression aquatique enfilé, on le gardera jusqu''au fond. \nOn rentrera dans l''actif sur 200 mètres, puis on sortira de l''eau peu avant le sommet d''un ressaut de 8 mètres qui conduit à une série de vasques. \n\nAprés un grand bassin, on va suivre l''actif sur 500 mètres dans une succession de rapides.\n\nJuste après un bassin de 10 mètres de long qui barre toute la galerie, on trouvera un passage bas, suivi de quelques mètres de galerie qui nous fera déboucher dans le Grand Chaos. \nLong de 300 mètres, son passage clé se trouve au bout de 100 mètres de chaos.\nIl faut descendre sur la droite, progresser entre les blocs et remonter de l''autre cōté, sans essayer de rejoindre la rivière que l''on entend plus bas.\n\nLa deuxième partie du Grand Chaos est plus évidente. \nA la fin, on redescend dans la rivière qu''on suivra pendant une centaine de mètres jusqu''à sa disparition sous une voûte basse ; la suite est sur la gauche. \n\nDans cette galerie, on restera en haut de l''éboulis, 150 mètres plus loin, on peut retrouver l''actif.\nDès lors la progression jusqu''à la Salle Styx ne pose plus de problème.',NULL,10,NULL,NULL,NULL,NULL,'fra',false),
    (12,1,NULL,'2010-04-07 13:40:34.000',NULL,3,'Description sommaire','La cavité est décrite de manière détaillée dans de nombreux ouvrages (cf. section "Bibliographie" ci-dessous).\n\nVoir aussi quelques conseils de prudence dans la section "Commentaires" ci-dessous.',NULL,12,NULL,NULL,NULL,NULL,'fra',false),
    (13,3,NULL,'2009-10-01 14:12:25.000',NULL,-6,'Description ','Superbe entrée au travers des buis. \nUn lac de 40 mètres constitue, avec la vire qui lui succède, la seule vrai difficulté de ce périple d''initiation. \nFranchir ce plan d''eau de 6 mètres de profondeur en rive droite (c''est à dire à gauche en entrant), pour arriver sur un débarcadère stalagmitique spacieux. \nGrimper 5 mètres à l''aplomb de ce dernier, pour équiper la vire (scellements en place). \nOn prend pied dans une vaste galerie, avec une arrivée d''eau sur le coté, origine de la coulée de calcite que l''on a dû contourner par le haut (alias "La Méduse"). \nOn va progresser dans une galerie remontante, mais soumise à des fluctuations altimétriques du style montagnes russes. \nAprès un premier point bas qui siphonne en crue, la galerie prend ses dimensions effectives qu''elle conservera une bonne partie de son existence. \nUn phare puissant est recommandé, qui permet de découvrir les merveilles de cette galerie, tant en concrétionnement, qu''en formes, en coloris ou en départs. \nNous croisons des cheminées, accès au réseau des Deux Jean et au réseau Inattendu.\nA 800 mètres de l''entrée, on arrive dans la salle des Fontaines, superbe salle concrétionnée, à l''actif très original, puisqu''ayant créé une fontaine symétrique, bordée d''immenses gours. \nUne remontée entre blocs coté gauche permet d''atteindre l''affluent du point 900. \nC''est dans ce secteur, au centre de la galerie qu''il faut trouver le premier accès à la rivière. \nCela peut faire un premier but de ballade (cote +55 environ). compter 1h30 avec un groupe de non spéléo bons marcheurs\nle premier accès bien marqué est expo équipé d''une cordelette pour une corde, ressortir de l''accès, prendre à gauche et passer entre les blocs pour descendre sans avoir besoin de matériel \n\nsuite vers le second accès (salle à manger): Continuer la galerie fossile, et via une vire coté gauche, on passe un portail de concrétions : la "Cascade Rouge". \nSuivent quelques dizaines de mètres de parcours fastidieux, avant de déboucher en balcon à la Salle à Manger, vaste entonnoir dont le fond constitue le deuxième accès à la rivière.\nil faut compter 2 heures pour cette partie avec un groupe de bons marcheurs non spéléo de 8 personnes.\nLa rivière jusqu''à la cascade de 12 mètres (C12) ne présente aucune difficulté et peut se faire sans équipements ; les rares passages athlétiques sont équipés avec des barreaux métalliques, les baudriers sont facultatifs mais bien utiles surtout pour remonter une petite cascade de 4m équipée "via". on notera tout le long du parcours de nombreux fossiles dont des sortes de moules de 20cm de long\nOn arrive en fin à une partie en cul de sac avec une main courrante qui mène à la C12, s''arrêter là (on passe dans la partie nécessitant du matériel de spéléologie (baudrier complet)). il y a un très beau fossile en passant à la nage dans l''actif sur la gauche 3m après la mise à l''eau à environ 1m20 au dessus du niveau de l''eau',NULL,14,NULL,NULL,NULL,NULL,'fra',false),
    (14,1,NULL,'2009-10-22 12:04:04.000',NULL,1,'La rivière souterraine le 17-10-2009','Ce descriptif fait abstraction du lac d''entrée et de la grosse galerie (cf. description précédente) pour décrire la rivière.\nL''entrée vers la rivière se fait dans une dépression marquée 2 au carbure (déchaulages et odeurs d''urine).\nLa progression dans la rivière se fait bien grâce à l''équipement avec des super barreaux de via ferrata.\nNous arrivons à une grosse remontée de cascade et, bonne surprise, encore des barreaux et une belle corde en place.\nOn suit toujours la rivière avec ses petits ressauts puis on arrive à une sorte de cul de sac. \nIl faut remonter vers une cascade plus haut.\nC''est le seul passage étroit sur la gauche ; on monte dans un chaos de blocs jusqu''à une belle corde. \nRemontée sur 30 mètres en via corda très fractionnée. \nOn retrouve une grosse cascade (on est content que le débit soit faible). \nEnsuite changement d''ambiance dans une galerie en as de pique un peu boueuse. \nEn sortie, sur la gauche, une grande salle (demi tour). \nNous continuons de remonter sur un équipement plus approximatif.\nRessaut sur échelle spéléo, petits puits sur petites cordes, amarrages fabrication maison. \nOn retrouve vite l''eau et de belles cascades. Redescente d''un P10 et remontée d''un P10 avec sortie sur main courante assez sportive !\nOn passe par des parties très aquatiques pour remonter une cascade (d''un coup je trouve le débit très suffisant).\nLe passage se resserre pour arriver au siphon ; sur le dessus ça continue mais apparemment c''est boueux.\nLe retour ressemble vraiment à un canyon, il y a même un saut de 3 mètres dans une vasque et des descentes dans cascades.\n\nBravo au groupe qui a entrepris de ré-équiper ce magnifique canyon souterrain.\nLa dernière partie pour arriver au siphon est en cours (les broches sont déjà en place) aussi bien ce sera nickel pour l''été 2010.\nCette sortie entièrement équipée nous a permis d''aller jusqu''au siphon à 7 spéléos pour 11 heures sous terre.',NULL,14,NULL,NULL,NULL,NULL,'fra',false),
    (15,6,NULL,'2009-04-03 21:34:40.000',NULL,1,'De la nouvelle entrée à la galerie des Meulières.','Un petit parcours entrecoupé de petits puits pas très larges conduit au sommet du P109.  \nAttention de ne pas descendre totalement le 2ème puits mais de s’arrêter 2-3m avant le fond pour s''engager dans un petit méandre. \nAu bas d''une première verticale de 37 mètres contre parois, on atteint une vire d''où part la suite du puits plein vide mais dont on ne descend que 34 mètres. \nPour atteindre le belvédère il faut penduler ou descendre légèrement plus bas puis remonter en escalade.\n\nDu belvédère on descend une vaste galerie qui conduit à -120 m dans une très grande salle qui n''est en fait qu''une section de l''énorme collecteur de la Leicasse.',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (16,1,NULL,'2009-10-22 11:01:24.000',NULL,4,'Le Petit Fond','Pour le "Petit Fond", il faut remonter sur 10 mètres de corde sur la droite, aprés la salle Edmond Milhau et juste avant la galerie du Tac o Tac. \nNous remplaçons la corde (10-10-2009). \nIl y a du rab pour rééquiper un ressaut de 3 mètres avec corde en place pourrie.\n\nAprés la remontée, on prend une galerie sur la droite puis remontée étroite pour arriver sur le ressaut avec la corde abimée. \nOn suit une galerie assez jolie, galerie entrecoupée de passages rampés puis P8 équipé pour arriver au siphon. \nOn a de la chance il est complétement à sec !\n\nPartie la plus pénible dans un boyaux boueux pour arriver au lac. \nOn passe sur une main courante en place (niveau du lac trés bas), ça s’enchaîne sur une magnifique galerie entrecoupée de gours (un pont de singe est en place mais on passe à sec). \nRemontée sur main courante et remontée de 10 mètres (toutes deux équipées) pour arriver sur un petit lac qui est peut être un siphon pas long à traverser mais profond, nous faisons demi tour. ',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (17,2,NULL,'2009-12-30 21:51:13.000',NULL,1,'Du bas du Grand Puits à la galerie de la Nuit Blanche par le Shunt des Garrigues','Après le pendule, on accède à un grand palier puis à une descente dans de grand blocs. \nCorde fixe à main droite facilitant la descente sur la coulée. \nEn bas, ne pas s''engager dans le passage marqué de flèches noires mais rester en hauteur pour rejoindre plus tard le fond de la galerie et les dunes sableuses.\n\nApres un passage bas, la galerie se divise en deux (trois départs à main droite, à gauche on tombe sur de multiples spits trace d''un bivouac et départ d''un autre cheminement alternatif vers la galerie de la nuit blanche).\nEmprunter le premier passage à droite, cela donne accès à un belle galerie richement concrétionnée. \nAu fond remonter l''éboulis. \nLa suite se trouve par un passage désobstrué au sein de l''éboulis (rubalise derrière un gros bloc). s''insinuer entre les blocs en suivant les marques. \n\nOn débouche de nouveau dans une grosse galerie après un ressaut remontant (corde à noeuds en fixe). \nSuivre les balisages, cairns et remonter entre de gros blocs. \nEnfin, une désescalade argileuse donne sur un ressaut contre une coulée (corde fixe +/- 10m). \nOn débouche en hauteur d''un grand éboulis à la fin des tubes de la galerie de la nuit blanche.(arrivée de la galerie des meulières dans le descriptif de Nathan). \n\nVers la droite, la galerie d''effondrement, de belle section, conduit vers la salle Edmond Milhau. \nA/R au Tac O Tac en 1/2 heure en galopant. \nPour le reste du parcours voir les descriptions de Nathan.',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (18,4,NULL,'2014-11-02 20:03:43.000',NULL,3,'Des Meulières à la galerie de la Nuit Blanche par l''ancien cheminement','Après le pendule, on accède à un grand palier puis à une descente dans de grand blocs, après une corde en fixe sur la droite de la galerie qui permet de descendre un toboggan de calcite il faut descendre entre les blocs en suivant 2 flèches noir. \n\nUne série d''étroitures élargies permet d''accéder au sommet d''un P12. \nOn suit un méandre entrecoupé d''un R3 malaisé (étrier en place) pour accéder à "l''étroiture du pilier". \n\nSuivent une petite vire et un P8 qui ne doit pas être totalement descendu. \nUn passage étroit remontant entre des blocs sur la droite conduit à un P12. \nAu bas de ce dernier, on recoupe un méandre de type alpin parcouru par un ruisselet. \nP10 et un magnifique P35 permettent d''atteindre les galeries de la Nuit Blanche vers -200.',NULL,17,NULL,NULL,NULL,NULL,'fra',false);
INSERT INTO public.t_description (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,title,body,id_cave,id_entrance,id_exit,id_massif,id_point,id_document,id_language,is_deleted) VALUES
    (19,4,NULL,'2014-11-02 20:04:43.000',NULL,4,'Du début des galeries de la Nuit Blanche à la galerie du Tac O Tac.','Départ depuis l''arrivée de l''ancien cheminement.\nParcours sans aucune difficulté long d''environ 1,2 km. \n\nAu bout des galeries en tube on remonte un énorme éboulis dans une grande salle où l''on retrouve la suite de la galerie des Meulières délaissée précédemment. \nPrendre sur la gauche. \nOn passe près d''un bidon qui sert de point d''eau et d''une tente vestige de bivouacs souterrains. \nOn débouche peu à peu dans la très spectaculaire salle Edmond MILHAU (ancien berger  local). \nLa galerie monumentale se poursuit en se réduisant peu à peu jusqu''à buter sur un énorme colmatage alluvionnaire.\n\nUne désobstruction spectaculaire (galerie du Tac O Tac = une chance au grattage, une chance au tirage) a permis de creuser un tranchée digne des catacombes sur plus de 100 m. \nChacun est invité à ressortir un bidon de sable lors de sa visite pour faire avancer le chantier...',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (22,4,NULL,'2014-11-02 20:14:09.000',NULL,4,'Du bas du Grand Puits à la galerie de la Nuit Blanche par le Schunt de la Géode','Après le pendule, on accède à un grand palier puis une descente dans de grand blocs. \nCorde fixe à main droite facilitant la descente sur la coulée. \nEn bas, ne pas s''engager dans le passage marqué de flèches noires mais rester en hauteur pour rejoindre plus tard le fond de la galerie et les dunes sableuses. \nAprès un passage bas, la galerie se divise en deux : laisser l''ancien camp à gauche et prendre la galerie a droite. \nLe départ étroit du Shunt de la Géode est sur la gauche entre de gros blocs. \n2 spits sont visibles au dessus de ces blocs. \n\nAprès un passage entre des blocs et une corde en fixe de 6 mètres on arrive à la Géode. \nLa suite jusqu''à la galerie de la Nuit Blanche est à écrire (...)',NULL,17,NULL,NULL,NULL,NULL,'fra',false),
    (23,4,NULL,'2016-10-12 23:42:42.000',NULL,2,'Description sommaire','Le puits principal est une verticale de 100 mètres, au bas de laquelle coule la Sorgue souterraine. \nLa rivière peut être suivie sur quelques dizaines de mètres en amont et en aval. \nOn peut aussi descendre par des puits parallèles brochés (P21, R5, P12, R6, P9, P33) qui donnent par des balcons une belle vue sur l''ambiance du grand puits. \nOn peut, si l''on constitue 2 équipes, descendre par les petits puits et remonter par le P100 ou vice versa. \nPrévoir dans ce cas le matériel pour équiper les puits parallèles.',NULL,18,NULL,NULL,NULL,NULL,'fra',false),
    (24,4,NULL,'2015-04-09 16:21:07.000',NULL,3,'Traversée TQS -> Saints de Glace','La traversée TQS -> Saints de glace est bien marqué avec des flèches sur support réfléchissant.\nLe méandre francois peut etre descendu en rappel. Les mains courantes sont en place.\nDescendre les puits de l''entrée de TQS puits sortir de l''actif par la droite pour s''engager dans une zone étroite et boueuse avant d''arriver au méandre francois que l''on parcoure au plafond sur des vires.\nAprès le méandre Francois on arrive dans la Salle de la Conciergerie. On empreinte ensuite de belles galeries avec des marmites jusqu''à la salle Hydrokarst. De la salle Hydrokarst on récupère le méandre des Saints de Glace pour sortir.',NULL,21,20,NULL,NULL,NULL,'fra',false),
    (25,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 6068','Description 6068',NULL,NULL,NULL,NULL,NULL,6068,'fra',false),
    (26,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 1409','Description 1409',NULL,NULL,NULL,NULL,NULL,1409,'fra',false),
    (27,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 2542','Description 2542',NULL,NULL,NULL,NULL,NULL,2542,'fra',false),
    (28,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 2998','Description 2998',NULL,NULL,NULL,NULL,NULL,2998,'fra',false),
    (29,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 6065','Description 6065',NULL,NULL,NULL,NULL,NULL,6065,'fra',false),
    (30,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 6096','Description 6096',NULL,NULL,NULL,NULL,NULL,6096,'fra',false),
    (31,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 10406','Description 10406',NULL,NULL,NULL,NULL,NULL,10406,'fra',false),
    (32,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 12639','Description 12639',NULL,NULL,NULL,NULL,NULL,12639,'fra',false),
    (33,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 109','Description 109',NULL,NULL,NULL,NULL,NULL,109,'fra',false),
    (34,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 5801','Description 5801',NULL,NULL,NULL,NULL,NULL,5801,'fra',false),
    (35,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 191','Description 191',NULL,NULL,NULL,NULL,NULL,191,'fra',false),
    (36,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 16746','Description 16746',NULL,NULL,NULL,NULL,NULL,16746,'fra',false),
    (37,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 161','Description 161',NULL,NULL,NULL,NULL,NULL,161,'fra',false),
    (38,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 1378','Description 1378',NULL,NULL,NULL,NULL,NULL,1378,'fra',false),
    (39,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 2591','Description 2591',NULL,NULL,NULL,NULL,NULL,2591,'fra',false),
    (40,5,NULL,'2015-04-09 16:21:07.000',NULL,3,'Title 12106','Description 12106',NULL,NULL,NULL,NULL,NULL,12106,'fra',false);

INSERT INTO public.t_file (id,date_inscription,date_reviewed,filename,id_file_format,id_document,path_old) VALUES
	 (1629,'2020-12-22 00:13:44.771',NULL,'photo-lac-gournier.jpg',871,16746,'u427-t1579-r5275a16b5129b338f0339d5727010c0e-photo-lac-gournier.JPG');

INSERT INTO public.t_grotto (id,id_author,id_reviewer,village,county,region,city,postal_code,address,mail,year_birth,date_inscription,date_reviewed,latitude,longitude,custom_message,is_official_partner,url,id_country,picture_file_name,is_deleted,redirect_to) VALUES
	 (1,2,NULL,NULL,'Hauts-de-Seine','Île-de-France','Issy-les-Moulineaux','92130','5, avenue Jean Bouin','thomas_cabotiau@yahoo.fr',1984,'2008-07-28 14:47:45.000',NULL,48.82489600000000000000,2.26518199999998160000,'http://abimes.free.fr',false,NULL,'FR',NULL,false,NULL),
	 (2,4,NULL,NULL,'Rhône','Auvergne-Rhône-Alpes','Lyon 09','69009','36, av Sidoine Appolinaire','josiane.lips@free.fr',1958,'2008-07-28 15:05:45.000',NULL,45.77392000000000000000,4.79506200000003000000,'http://www.groupe-speleo-vulcain.com/',true,NULL,'FR','vulcain.gif',false,NULL),
	 (4,5,NULL,NULL,'Meuse','Grand Est','Bar-le-Duc','55000','13 Voie des Fusillers','jmggoutorbe@wanadoo.fr',1982,'2008-07-29 12:04:54.000',NULL,48.77725800000000000000,5.16451200000005900000,'http://gersm.over-blog.fr',false,NULL,'FR',NULL,false,NULL),
	 (5,1,NULL,NULL,'Haute-Corse','Corse','Bastia','20600','Montesoro','topipinnuti@orange.fr',1984,'2008-07-29 13:15:21.000',NULL,42.67344355830400000000,9.43635463714599600000,NULL,false,NULL,'FR',NULL,false,NULL),
	 (6,1,NULL,NULL,'Rhône','Auvergne-Rhône-Alpes','Villeurbanne','69100','1 rue Rouget de l''Isle','speleoclubvilleurbanne@hotmail.com',1949,'2008-07-29 13:27:49.000',NULL,45.78853443690652000000,4.88346576690673800000,'http://speleo-villeurbanne.fr/',true,NULL,'FR','scv.jpg',false,NULL),
	 (7,2,NULL,NULL,'Paris','Île-de-France','Paris','75000',NULL,'info@afegc.com',1995,'2008-07-29 14:58:06.000',NULL,48.85666700000000000000,2.35098700000003200000,'http://sites.google.com/site/afegcleclub/',false,NULL,'FR',NULL,false,NULL);

INSERT INTO public.t_name (id,"name",is_main,id_author,id_reviewer,date_inscription,date_reviewed,id_language,id_entrance,id_cave,id_massif,id_point,id_grotto,is_deleted) VALUES
	 (773,'CLUB 773',true,2,NULL,'2008-07-28 14:47:45.000',NULL,'fra',NULL,NULL,NULL,NULL,1,false),
	 (2025,'CLUB 2025',true,2,NULL,'2008-07-29 14:58:06.000',NULL,'fra',NULL,NULL,NULL,NULL,7,false),
	 (22172,'CLUB 22172',true,1,NULL,'2008-07-29 12:04:54.000',NULL,'fra',NULL,NULL,NULL,NULL,4,false),
	 (22179,'CLUB 22179',true,4,NULL,'2008-07-28 15:05:45.000',NULL,'fra',NULL,NULL,NULL,NULL,2,false),
	 (31486,'CLUB 31486',true,1,NULL,'2008-07-29 13:15:21.000',NULL,'fra',NULL,NULL,NULL,NULL,5,false),
	 (53674,'CLUB 53674',true,4,NULL,'2008-07-29 13:27:49.000',NULL,'fra',NULL,NULL,NULL,NULL,6,false);

INSERT INTO public.t_region (id,code,is_deprecated,"name",id_country) VALUES
	 (0,'--',false,'the whole country','00'),
	 (79,'F',true,NULL,'FR'),
	 (80,'F/A',true,'Ile-de-France (Seine; Seine-et-Marne; Yvelines; Essonne; Hauts-de-Seine; Val-de-Marne; Val-d´Oise)','FR'),
	 (81,'F/B',true,'Bourgogne (Côte-d´Or; Nièvre; Saône-et-Loire; Yonne)','FR'),
	 (82,'F/C',true,'Rhône-Alpes (Ain; Ardèche; Drôme; Isère; Loire; Rhône; Savoie; Haute-Savoie)','FR'),
	 (83,'F/D',true,'Provence-Côte d´Azur / Corse (Alpes-de-Haute-Provence; Hautes-Alpes; Alpes-Maritimes; Bouches-du-Rhône; Var; Vaucluse; Corse)','FR'),
	 (84,'F/E',true,'Languedoc-Roussillon (Aude; Gard; Hérault; Lozère; Pyrénées-Orientales)','FR'),
	 (85,'F/F',true,'Midi / Pyrénées (Ariège; Aveyron; Haute-Garonne; Gers; Lot; Hautes-Pyrénées; Tarn; Tarn-et-Garonne)','FR'),
	 (86,'F/G',true,'Aquitaine (Dordogne; Gironde; Landes; Lot-et-Garonne; Pyrénées-Atlantiques)','FR'),
	 (87,'F/H',true,'Bretagne / Poitou-Charentes / Pays-de-la-Loire (Charente; Charente-Maritime; Côtes-d’Armor; Finistère, Ille-et-Vilaine; Loire-Atlantique; Maine-et-Loire; Mayenne, Morbihan; Sarthe; Deux-Sèvres; Vendée; Vienne)','FR'),
	 (88,'F/J',true,'Normandie (Calvados; Eure; Manche; Orne; Seine-Maritime)','FR'),
	 (89,'F/K',true,'Nord / Ardennes / Picardie (Aisne; Ardennes; Aube; Marne; Haute-Marne; Nord; Oise; Pas-de-Calais; Somme)','FR'),
	 (90,'F/L',true,'Lorraine (Meurthe-et-Moselle; Meuse; Moselle; Vosges)','FR'),
	 (91,'F/M',true,'Auvergne / Limousin (Allier; Cantal; Corrèze; Creuse, Haute-Loire; Puy-de-Dôme; Haute-Vienne)','FR'),
	 (92,'F/N',true,'Centre (Cher; Eure-et-Loir; Indre; Indre-et-Loire, Loir-et-Cher; Loiret)','FR'),
	 (93,'F/P',true,'Franche-Comté / Alsace (Doubs; Jura; Bas-Rhin; Haut-Rhin; Haute-Saône; Belfort)','FR'),
	 (109,'IT01',true,'Abruzzo e Molise (Aquila; Chieti; Pescara; Teramo; Campobasso)','IT'),
	 (256,'USA26',true,'Missouri','US');

INSERT INTO public.t_rigging (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,title,obstacles,ropes,anchors,observations,id_entrance,id_exit,id_point,id_language,is_deleted) VALUES
	 (20,1,NULL,'2009-03-29 11:48:00.000',NULL,2,'Réseau du Petit Fond','Escalade',NULL,NULL,'En fixe',17,NULL,NULL,'fra',false),
	 (17,1,NULL,'2009-03-29 11:40:40.000',NULL,2,'Accès par l''ancienne entrée','R7\nR2|;|R5','16 m|;|10 m','AN + 1S|;|AN','Etroiture|;|',17,NULL,NULL,'fra',false),
	 (18,6,NULL,'2009-03-29 11:45:39.000',NULL,2,'Des Meulières aux galeries de la Nuit Blanche par l''ancien réseau de puits','R3|;|R8|;|P12|;|P10|;|P35','|;|10 m|;|20 m|;|16 m|;|50 m','|;|AN|;|3S + 1DEV|;|2S + 1S|;|2S (MC) + 2S + 1S (MC) + 2S','Etrier en place|;|Quitter avant le fond sur la gauche.|;||;||;|Equiper le méandre en MC au plafond.',17,NULL,NULL,'fra',false),
	 (19,6,NULL,'2009-03-29 11:47:14.000',NULL,2,'Des Meulières aux galeries de la Nuit Blanche par le nouveau réseau de puits','R5|;|Vire|;|Puits','Echelle rigide 6 m|;||;|','|;||;|','En fixe|;||;|',17,NULL,NULL,'fra',false),
	 (1,4,NULL,'2008-08-04 17:01:02.000',NULL,4,'','La Vire, le R3 de la Galerie des Gours et le R4 du Réseau Ben|;|P10|;|MC|;|P20|;|Trémie Galerie Nord MC + P7','Equipés en fixe|;|C65|;|Même corde|;|Même corde|;|C38 (facultatif)','Equipés en fixe|;|AN (barrière) + 2Br + 2Br|;|2Br + 1Br + 1Br + 1Br + 1Br + 1Br + 2Br|;|2Br + 2Br + 2Br\n|;|6 x (1Br + 1S)','A chaque visite il est important de vérifier l’état des cordes et amarrages. |;|Les 2 premières broches sous le porche font passer la corde très près d''un becquet, préférer 2 Spits disponible à coté\nPossibilité d''équiper le P10 fractionné en double avec une corde de 15m (prévoir 2S + 2B)|;|Il est préférable d''accéder au P20 final après la lucarne de la main courante plutot qu''avant|;|Possibilité d''équiper en double le dernier P20 direct avec une corde de 22m (prévoir 2S +2S)|;|La trémie peut se désescalader mais il est préférable de l''équiper en MC pour des débutants ou des personnes mal chaussées)',3,NULL,NULL,'fra',false),
	 (2,2,NULL,'2019-06-21 21:32:51.000',NULL,4,'',NULL,NULL,NULL,NULL,4,NULL,NULL,'fra',false),
	 (3,6,NULL,'2008-07-28 20:00:34.000',NULL,4,'Objectif Fond','P34|;|E9|;|P28|;|Lucarne\nR10\nR6|;|P20 \nP23|;|Total','C40|;|C15|;|C25|;|C25|;|C65|;|185m','AN (arbre)|;|2S|;|3S +1S à-9m et 1S à -15m\n|;|CP + 2S - MC\n1S + 1S à -1m\n1S|;|CP+2S +1S + 1S + 1S à -10m\n1S + 1S à -1m|;|19 plaquettes','|;|équipement en fixe|;|Certains spits sont doublés par des goujons de 12 mm|;|2S avant la lucarne. bien s''engager pour équiper proprement\nCertains spits sont doublés par des goujons de 12 mm|;|Certains spits sont doublés par des goujons de 12 mm|;|A partir de l''escalade, toutes les cordes peuvent être reliées.\nAttention, quelques spits sont à ménager',7,NULL,NULL,'fra',false),
	 (4,6,NULL,'2008-10-13 15:38:08.000',NULL,4,'De l''entrée au Carrefour','P10 coulée|;|V10 lac|;|R3 blocs|;|R4 laminoir|;|E5 début galeries du Minautore|;|V10 |;|P10 salle à manger|;|V10 siphon salle à manger','20 m ou échelle|;|Câble|;|7 m|;|7 m|;|10 m|;|15 m|;|15 m ou échelle|;|20 m','Nat|;|3 spits|;|Nat|;|Nat|;|Nat|;|Nat + 1 spit|;|Nat + 1 spit|;|3 spits','Parfois en fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe',9,NULL,NULL,'fra',false),
	 (5,6,NULL,'2009-01-20 21:27:57.000',NULL,2,'Du Carrefour au siphon des Pas Perdus','E8|;|E3|;|P5 galerie latérale siphon suspendu PP aval|;|P3|;|E13 siphon suspendu PP amont|;|E6','15m|;|5 m|;|6 m|;|5 m + échelle de corde|;|20m|;|10 m','Nat + 1Spit|;|1Spit|;|1Spit|;|2 Spits|;|3 Spits|;|1Spit','En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe :\nPuits / Cheminée de jonction avec la salle des Pas Perdus',9,NULL,NULL,'fra',false),
	 (6,6,NULL,'2009-01-20 21:37:36.000',NULL,2,'Le Réseau Supérieur (P100 / salle du Miroir / cheminée de l''Ours)','E10|;|P"100"|;|Vire salle du Miroir|;|P14 accès siphon suspendu du Réseau Supérieur|;|E5 accès siphon suspendu du Réseau Supérieur|;|Vire siphon suspendu du Réseau Supérieur|;|E8 accès cheminée de l''Ours|;|Vire 10 m|;|E80|;|P7 accès puits "CNS"|;|P18 + P28 (puits "CNS")|;|P15 + P8 accès puits parallèles et puits de la Queue de Dragon|;|P15|;|R8 + R4 + R3|;|P6|;|Puits de la Queue de Dragon|;|','15 m|;|60 m\n80 m|;|2x10 m|;|20 m|;|15 m|;|10 m|;|Echelle de corde 10 m|;|Corde15 m|;||;|15 m|;|80 m|;|20 m + 15 m|;|20 m|;||;|10 m|;||;|','2 Spits|;|Spits|;|Spits|;|2 Spits|;|3 Spits|;|4 spits|;||;|5 spits|;|AN + Spits|;||;|AN + Spits|;||;||;||;||;|AN + Spits|;|','En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe jusqu''à +130|;||;||;||;||;||;||;||;|',9,NULL,NULL,'fra',false),
	 (7,1,NULL,'2009-01-20 21:39:47.000',NULL,2,'Du Carrefour à la salle du Belvédère et des Niphargus','E3 + vire|;|Vire|;|E20|;|Vire|;|P15 salle des Niphargus|;||;|','10 m + Echelle rigide|;|Câble 15 m|;|30 m|;|15 m|;|25 m|;||;|','2 Spits|;|Nat + Spits|;|Nat + Spits|;||;|Nat + Spits|;||;|','En fixe|;|En fixe|;|En fixe|;|En fixe|;|A équiper !|;||;|',9,NULL,NULL,'fra',false),
	 (8,1,NULL,'2009-01-20 21:42:13.000',NULL,2,'De la salle du Belvédère à l''étroiture Madonna','P10|;|P5|;|E5|;|E15 réseau du Traître','15 m|;|10 m|;|10 m|;|','|;||;||;|','En fixe|;|En fixe|;|En fixe|;|',9,NULL,NULL,'fra',false),
	 (9,1,NULL,'2009-01-20 21:46:08.000',NULL,2,'Cheminée des Niphargus','P10|;|E20|;|E41|;|E100|;|Tb du "Dôme"|;|Tb15','20 m|;|30 m|;|50 m|;||;|20 m|;|20 m','Spits|;|Spits|;|Spits|;|Spits|;|2 Spits|;|2 AN','En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe|;|En fixe',9,NULL,NULL,'fra',false),
	 (10,1,NULL,'2009-01-20 21:57:57.000',NULL,2,'Cheminée du Phallus','E 150',NULL,'AN + spits','30 premiers mètres déséquipés',9,NULL,NULL,'fra',false),
	 (11,1,NULL,'2009-01-20 22:00:46.000',NULL,2,'Réseau du Labyrinthe','E8','10 m',NULL,'En fixe',9,NULL,NULL,'fra',false),
	 (12,5,NULL,'2019-09-07 17:54:36.000',NULL,4,'Equipement d''après le CDS 64','P34\n|;|P50-P5-P13 : \n|;|R5-P20 \n|;|P14-P19: \n|;|P14\n|;|P16 + P 17\n|;|R5\n|;|P54\n|;|P47\n|;|MC\n|;|MC\n|;|R dans blocs|;|Cascade 8m\n|;|R3\n|;|MC10\n|;|P12\n|;|P6\n|;|R3\n|;|R entre blocs\n|;|R8 : \n|;|R6 des rapides','C47|;|C100|;|C43|;|C55|;|C25|;|C50|;|C8|;|C70|;|C60|;| C10|;|C10|;|C12|;|C25|;|C5 |;|C15|;|C19 |;|C10 |;|C5 |;|C5|;|C18 |;|C15','5 broches|;|11 broches + 1 AN|;|8 broches|;|8 broches|;|4 broches|;|11 broches + 1 dev/broche|;|2 broches|;|5 broches|;|7 broches|;|en fixe|;|en fixe|;|en fixe|;|5 broches|;|en fixe|;|en fixe|;|en fixe|;|en fixe|;|en fixe|;|en fixe|;|en fixe 5 broches|;|','|;||;||;||;||;||;||;||;||;||;||;||;||;||;||;||;||;||;||;|Embarcadère|;|',10,NULL,NULL,'fra',false),
	 (13,1,NULL,'2009-11-06 17:58:24.000',NULL,4,'Fiche d''équipement hors crues (PP - AREHPA 2005)','Forage + ressaut|;|P5|;|P10|;|P36|;|P48|;|P42|;|P28|;|P4|;|Méandre d''ankou|;|P70 (Puits Ayme)|;|P80 (Puits de l''Astrolabe)|;|R80 (Série de puits)|;|P114','25 m|;|15 m|;|20 m|;|80 m|;|80 m|;|70 m|;|50 m|;|10 m|;||;|100 m|;|30 m + 100 m|;|60 m + 60 m|;|200 m','Prévoir de la dyneema pour le départ de puits\n2S + 2S|;|2S + 2S à -5|;|4S|;|20S + 1AN + 1DEV|;|16S|;|14S|;|8S|;|1AN + 3S|;||;|16S + 1AN|;|20S|;|20S + 1DEV|;|24S + 1DEV','Ne pas utiliser l''ancienne entrée (sous la chèvre) qui est dangereuse !|;||;||;||;||;||;|Arrivée à -200|;||;|Bien rester en haut du méandre ! Le bas du méandre est très étroit et se termine sur un puits sans issue.|;||;|Rabouter dans la corde précédente. Prévoir des déviations si nécessaire|;|Prévoir une C40 en plus au cas où. Prévoir des déviations si nécessaire|;|Arrivée dans la rivière',12,NULL,NULL,'fra',false),
	 (14,5,NULL,'2009-08-28 19:36:53.000',NULL,4,'Equipé en fixe.',NULL,NULL,NULL,NULL,13,NULL,NULL,'fra',false),
	 (15,1,NULL,'2010-06-10 13:30:00.000',NULL,4,'Equipement jusqu''à la cascade de 12 mètres (alias ','Lac d''entrée|;|Vire au dessus du lac d''entrée|;|Cascade de 12 mètres','40m de filin flottant si va et vient |;|C50 m|;|C30 m','|;|monter de 5m, 2broches, partir sur la vire à droite 1broche, 1 broche, 1broche (maillon rapide à demeure, rouillé), 1 as sur concrétion, 1 an sur concrétion derrière une colone,2 broches, 1 broche, 1 broche|;|Broches','|;|l''escalade de 5m depuis le lac est équipée de barreaux, la fin n''est pas sécurisable pour le premier à monter |;|Corde nécessaire pour le rappel de la cascade',14,NULL,NULL,'fra',false),
	 (16,1,NULL,'2009-03-29 11:39:17.000',NULL,4,'Nouvelle entrée aux galeries des Meulières','P10 d''entrée|;|P6|;|R6|;|R10|;|P37|;|P35|;|TB10','20 m\n(ou 40m pour faire les 2 puits)|;|12 m|;|12 m|;|15 m|;|95 m\n\n|;|Même corde|;|Corde 15 m','1AN (arbre)\n2S\n2S vers -4 |;|AN\nou bien : 2S et dev sur amarge foré. 1S puis nat dans le meandre|;|AN + 1S|;|2S|;|2S\nMC\n2 Broches|;|2 Broches\nMC\n2 Broches\n2S ou AN pour accrocher le bout de corde au belvédère|;|','Beaucoup d''araignées|;|ne pas descendre tout le puits. S''arréter 3m avant le fond pour prendre un méandre.|;|Départ étroit|;|Départ étroit|;|Contre parois jusqu''au palier intermédiaire|;|prévoir 1 mouskif supplémentaire pour éviter un frottement.\nA mi-hauteur penduler pour atteindre le belvédère.|;|En fixe à droite de la galerie.\n = Corde fixe en decembre 2010\nplein frottement à surveiller...',17,NULL,NULL,'fra',false);
INSERT INTO public.t_rigging (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,title,obstacles,ropes,anchors,observations,id_entrance,id_exit,id_point,id_language,is_deleted) VALUES
	 (21,1,NULL,'2009-04-03 22:20:28.000',NULL,2,'Réseau du Grand Fond','V10|;|P23 (facultatif)|;|R45|;|P13|;|P5|;|P8|;|P6|;|P7|;|P8|;|P5|;|P11|;|P19','|;|30 m|;||;||;||;||;||;||;||;||;||;|','|;||;||;||;||;||;||;||;||;||;||;|','En fixe?|;||;|Désescalade délicate|;||;||;||;||;||;||;||;||;|',17,NULL,NULL,'fra',false),
	 (22,1,NULL,'2009-12-30 22:06:51.000',NULL,4,'de la nouvelle entrée à la galerie de la nuit blanche','P entrée P12?|;|2eme puits P8?|;|R3 ou 4|;|P8 (?)|;|"P100"\nne se descend pas en totalité|;|toboggan|;|R8 (?)','C40|;|corde précédente|;| C6 (?)|;|C10 ou 15|;|C87|;|C25??|;|C15 (?)','4 spits|;|2 spits + 1 AN + 2 spits ou 2 AN en bas|;|1 AN |;|2 spits + 2 spits |;|2 spits + AN en hauteur + 2 broches + 2 broches au pallier|;|2 spits|;|1 AN','C40 enchaine les deux puits|;|ne pas descendre au fond enquiller le méandre à mi hauteur|;|facultatif (mais fort utile)|;|équipement possible sans MC|;|équipement strict minimum. + 2 broches facultatives possibles au pallier avant le plein vide|;|corde changée en juin 2016 (Gersam)|;|Ressaut d''accés galerie nuit blanche. Corde fixe fin 2009',17,NULL,NULL,'fra',false),
	 (23,2,NULL,'2013-08-19 21:11:35.000',NULL,4,'Par les puits parrallèles','MC + P21 de l''entrée |;|R5|;|MC + P13 |;|dalle (R6 et P9) + P33|;|Total minimum :','C38|;|C15|;|C28|;|C95|;|33 mousquetons sans plaquette','1 AN + 1 AN (main courante) \n2B tête puits ou 1S + 1B\n2B + 2B|;|2B + 2B |;|MC et vire : 2B   \nY : 2B \n1 AN + 1 S|;|R6 et P9 : 2B + 2B + B + 2B + 2B + 2B \n\nP33 : 2B + 2B +dev/B + B\n|;|2 mousquetons avec plaquette','Possibilité d''allonger la MC sur 2 B \n=> corde 48 m|;||;|En dernier : fractio jambon pour éviter un frottement. (prévoir 1 longue Dyneema).|;|Dans les deux cas, ne pas descendre jusqu''au fond mais penduler qq mètres avant le fond pour se poser sur le gros rocher en pente. Prévoir 1 sangle pour la DEV.\n \n|;|1 sangle\n1 Dyneema longue',18,NULL,NULL,'fra',false),
	 (24,4,NULL,'2016-10-12 23:49:45.000',NULL,4,'Grande verticale + vire d''accès','Vire + Grand puits','C30 + C100','10 mousquetons\n1 plaquette\n3 sangles\n1 sangle longue\n1 kit pour frottement','1 Nat \n1Spit \n3 Broches\n2 Nat sur poutre\nDev sur broche\nNat',18,NULL,NULL,'fra',false),
	 (25,6,NULL,'2008-09-19 19:03:55.000',NULL,4,'Accès à la salle Hydrokarst','P11 |;|P9|;|P4|;|P6|;|R3|;|P3\nP5|;|P11 (salle hydrokarst)','C24|;|C22|;|C13|;|C13|;|C5|;|C30|;|C20','2S + 1B + 1B + 1S pour MC + 1S et 1B en y|;|1AN (bloc énorme) +1 B (ou 2 B selon le côté où l''on équipe) + 1 dev sur spit|;|2 B + 1 B + 1S et 1B en y|;|2 B + 1B + 1S et 1B (ou 2S) en y|;|2S|;|corde de 30 m, 2S (ou 1B) + 1B + 1S (ou 1B) + 2B (ou 2S)  en y|;|2B (ou 1S et 1B) + 2B en y','B = broche|;|B = broche|;|B = broche|;|B = broche|;|équipement très facultatif |;|B = broche|;|B = broche',21,NULL,NULL,'fra',false);

INSERT INTO public.t_subject (code,subject,code_parent) VALUES
	 ('1.0  ','Geospeleology and Karstology',NULL),
	 ('2.0  ','Regional speleology',NULL),
	 ('3.0  ','Biospeleology',NULL),
	 ('4.0  ','Anthropospeleology',NULL),
	 ('1.11 ','KARST MORPHOLOGY AND MORPHOGENESIS : Exokarst of carbonatic rocks (limestones, dolomites, chalk, marbles); Geochemistry; Soil - CO2; Corrosion; Karst types (holo-, mero-, fluvio-, glacio-, volcano- karst; Tropical karst)','1.0  '),
	 ('1.15 ','FOSSIL KARST : Paleokarst; Karstic fillings; Paleogeography','1.0  '),
	 ('2.11 ','WESTERN & CENTRAL EUROPE','2.0  '),
	 ('2.12 ','EASTERN EUROPE','2.0  '),
	 ('3.35 ','AUSTRALASIA, OCEANIA','3.0  '),
	 ('4.1  ','ARCHAEOLOGY; PREHISTORICAL AND HISTORICAL CULTURES','4.0  ');

INSERT INTO public.t_bbs (id,articleyear,articletitle,librarycode,publicationother,publicationfascicule,publicationpages,"comments",publication_url,editor_address,editor_email,editor_url,abstract,xauteurfull,chaptercode,countrycode,xrefsubjectfull,xcountrycodefull,"ref",xrefnumeriquefinal,identifier,identifier_type,id_parent,pages) VALUES
	 (7,2015,NULL,'713','Geositi della Puglia',NULL,NULL,'Fotografie',NULL,'Regione Puglia, Sagraf, Capurso (BA).',NULL,NULL,'Censimento di oltre 440 emergenze geologiche regionali di cui una gran parte di interesse carso-speleologico. Scheda descrittiva, fotografie e bibliografia per ogni geosito.','MASTRONUZZI G. (a cura di); VALLETTA S. (a cura di); DAMIANI A. (a cura di); FIORE A. (a cura di); FRANCESCANGELI R. (a cura di); GIANDONATO P.B. (a cura di); IURILLI V. (a cura di); SABATO L. (a cura di);  ;  ','1,11',NULL,'6.4; ; ; ; ','IT12; ; ; ; ; ; ; ; ; ','2019,0008','5400007   ',NULL,NULL,NULL,'394'),
	 (5,2014,'Zur Entwicklung der Karststrukturen im Riffkalkstein von Iberg und Winterberg bei Bad Grund (Westharz).','706','Mitt. Verb. dt. Höhlen- u. Karstforsch.','60 (3+4)',NULL,NULL,NULL,NULL,NULL,NULL,'On the development of karst structures in the western Harz/Germany.','KNAPPE Hartmut;  ;  ;  ;  ;  ;  ;  ;  ;  ','1,11',NULL,NULL,'D04; ; ; ; ; ; ; ; ; ','2019,0006','5400005   ',NULL,NULL,NULL,'80-90,'),
	 (20,1997,'Wasserfärbung 1996 - Die Organisation','62','Jbericht Schweiz. Ges. für Höhlenforschung Sektion Bern','45',NULL,NULL,NULL,NULL,NULL,NULL,'Der Artikel beschreibt die einzelnen Arbeitsschritte, die für eine sorgfältige Planung einer Wasserfärbung / eines Tracerversuchs benötigt werden, und schätzt den dazu nötigen Zeitaufwand. Dazu gibt er Tipps für eine erfolgreiche Durchführung eines Versuchs.','HÄUSELMANN Philipp;  ;  ;  ;  ;  ;  ;  ;  ;  ','1,12',NULL,NULL,NULL,'2019,0021','5400020   ',NULL,NULL,NULL,'82-92,'),
	 (264,2014,'Die Vermessung der Bleßberghöhlen.','706','Karst und Höhle','2011-2014',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'FOHLERT Rainer;  ;  ;  ;  ;  ;  ;  ;  ;  ','2,11','D09',NULL,NULL,'2019,0265','5400264   ',NULL,NULL,NULL,'310-314,'),
	 (18,2016,'Hydrodynamique d''un lac souterrain : équipement et premiers résultats (Lesse souterraine)',NULL,'Journées 2016 de Spéléologie Scientifique. Vingtième édition',' ',NULL,NULL,NULL,NULL,NULL,NULL,'Compte rendu des vingtième Journées de la Spéléologie Scientifique organisées par l''Union Belge de Spéléologie. Résumé de communication sur des essais de traçages dans la Lesse souterraine.','DEWAIDE Lorraine; ROCHEZ Gaëtan; PAUWELS Michel; HALLET Vincent;  ;  ;  ;  ;  ;  ','1,12',NULL,'2.11; ; ; ; ','B02; ; ; ; ; ; ; ; ; ','2019,0019','5400018   ',NULL,NULL,NULL,'1'),
	 (52816,2003,'AA_NoCavingSubject___','62','Der Fledermaus','Dez. 2003',NULL,NULL,NULL,NULL,NULL,NULL,'AA_NoCavingSubject___',NULL,'9',NULL,NULL,NULL,NULL,'3955601   ',NULL,NULL,NULL,NULL);


INSERT INTO public.t_crs (id,id_author,id_reviewer,date_inscription,date_reviewed,definition,bounds,url,enabled,code) VALUES
	 (138,1,NULL,'2010-08-24 10:15:07.000',NULL,'+title=Old Hawaiian mean +proj=longlat +ellps=clrk66 +towgs84=58.0,-283.0,-182.0,0.0,0.0,0.0,0.0 +no_defs',NULL,'http://spatialreference.org/ref/epsg/61356405/',true,'EPSG:61356405'),
	 (164,1,NULL,'2010-08-30 15:52:59.000',NULL,'+title=Lambert 93 +proj=lcc +towgs84=0,0,0 +ellps=GRS80 +lat_0=46.500000000 +lon_0=3.000000000 +lat_1=44.000000000 +lat_2=49.000000000 +x_0=700000.000 +y_0=6600000.000 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/2154',true,'EPSG:2154'),
	 (165,1,NULL,'2010-09-13 10:29:12.000',NULL,'+title=Lambert II Etendu +proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m',NULL,'http://spatialreference.org/ref/epsg/27582',true,'EPSG:27582'),
	 (182,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California I FIPS +proj=lcc +lat_1=40 +lat_2=41.66666666666666 +lat_0=39.33333333333334 +lon_0=-122 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102241',true,'ESRI:102241'),
	 (183,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California II FIPS +proj=lcc +lat_1=38.33333333333334 +lat_2=39.83333333333334 +lat_0=37.66666666666666 +lon_0=-122 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102242',true,'ESRI:102242'),
	 (184,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California III FIPS +proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102243',true,'ESRI:102243'),
	 (185,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California IV FIPS +proj=lcc +lat_1=36 +lat_2=37.25 +lat_0=35.33333333333334 +lon_0=-119 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102244',true,'ESRI:102244'),
	 (186,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California V FIPS +proj=lcc +lat_1=34.03333333333333 +lat_2=35.46666666666667 +lat_0=33.5 +lon_0=-118 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102245',true,'ESRI:102245'),
	 (187,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 HARN StatePlane California VI FIPS +proj=lcc +lat_1=32.78333333333333 +lat_2=33.88333333333333 +lat_0=32.16666666666666 +lon_0=-116.25 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102246',true,'ESRI:102246'),
	 (214,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=Gauss Boaga Fuso Ovest +proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs',NULL,'http://spatialreference.org/ref/sr-org/4685',true,'SR-ORG:4685'),
	 (215,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=Gauss Boaga Fuso Est +proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs',NULL,'http://spatialreference.org/ref/sr-org/4686',true,'SR-ORG:4686'),
	 (227,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 StatePlane Texas North +proj=lcc +lat_1=34.65 +lat_2=36.18333333333333 +lat_0=34 +lon_0=-101.5 +x_0=200000 +y_0=1000000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs',NULL,'http://spatialreference.org/ref/esri/102737',true,'ESRI:102737'),
	 (228,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 StatePlane Texas North Central +proj=lcc +lat_1=32.13333333333333 +lat_2=33.96666666666667 +lat_0=31.66666666666667 +lon_0=-98.5 +x_0=600000.0000000001 +y_0=2000000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs',NULL,'http://spatialreference.org/ref/esri/102738',true,'ESRI:102738'),
	 (229,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 StatePlane Texas Central +proj=lcc +lat_1=30.11666666666667 +lat_2=31.88333333333333 +lat_0=29.66666666666667 +lon_0=-100.3333333333333 +x_0=700000 +y_0=3000000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs',NULL,'http://spatialreference.org/ref/esri/102739',true,'ESRI:102739'),
	 (230,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 StatePlane Texas South Central +proj=lcc +lat_1=28.38333333333333 +lat_2=30.28333333333334 +lat_0=27.83333333333333 +lon_0=-99 +x_0=600000.0000000001 +y_0=4000000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs',NULL,'http://spatialreference.org/ref/esri/102740',true,'ESRI:102740'),
	 (231,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 StatePlane Texas South +proj=lcc +lat_1=26.16666666666667 +lat_2=27.83333333333333 +lat_0=25.66666666666667 +lon_0=-98.5 +x_0=300000 +y_0=4999999.999999999 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs',NULL,'http://spatialreference.org/ref/esri/102741',true,'ESRI:102741'),
	 (232,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 Minnesota Central +proj=lcc +lat_1=47.05 +lat_2=45.61666666666667 +lat_0=45 +lon_0=-94.25 +x_0=800000 +y_0=100000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/3594',true,'EPSG:3594'),
	 (233,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 Minnesota North +proj=lcc +lat_1=48.63333333333333 +lat_2=47.03333333333333 +lat_0=46.5 +lon_0=-93.09999999999999 +x_0=800000 +y_0=100000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/3595',true,'EPSG:3595'),
	 (234,1,NULL,'2010-09-14 17:03:30.000',NULL,'+title=NAD 1983 Minnesota South +proj=lcc +lat_1=45.21666666666667 +lat_2=43.78333333333333 +lat_0=43 +lon_0=-94 +x_0=800000 +y_0=100000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/3596',true,'EPSG:3596'),
	 (239,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NTF (Paris) +proj=longlat +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +no_defs',NULL,'http://spatialreference.org/ref/epsg/4807',true,'EPSG:4807'),
	 (245,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=Lambert Azimutha Equal Area +proj=laea +lat_0=45.5 +lon_0=-114.125 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs',NULL,'http://spatialreference.org/ref/sr-org/28',true,'SR-ORG:28'),
	 (254,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN New Mexico East +proj=tmerc +lat_0=31 +lon_0=-104.3333333333333 +k=0.999909091 +x_0=165000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/2825',true,'EPSG:2825'),
	 (255,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN New Mexico Central +proj=tmerc +lat_0=31 +lon_0=-106.25 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/2826',true,'EPSG:2826'),
	 (256,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN New Mexico West +proj=tmerc +lat_0=31 +lon_0=-107.8333333333333 +k=0.999916667 +x_0=830000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/epsg/2827',true,'EPSG:2827'),
	 (275,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN Florida East +proj=tmerc +lat_0=24.33333333333333 +lon_0=-81 +k=0.9999411764705882 +x_0=200000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102258',true,'ESRI:102258'),
	 (276,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN Florida West +proj=tmerc +lat_0=24.33333333333333 +lon_0=-82 +k=0.9999411764705882 +x_0=200000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102259',true,'ESRI:102259'),
	 (277,1,NULL,'2010-11-17 14:41:58.000',NULL,'+title=NAD 1983 HARN Florida North +proj=lcc +lat_1=29.58333333333333 +lat_2=30.75 +lat_0=29 +lon_0=-84.5 +x_0=600000 +y_0=0 +ellps=GRS80 +units=m +no_defs',NULL,'http://spatialreference.org/ref/esri/102260',true,'ESRI:102260');

INSERT INTO public.j_country_crs (id_crs,id_country) VALUES
	 (239,'FR'),
	 (138,'IT'),
	 (255,'US');

INSERT INTO public.j_country_language (id_country,id_language,is_official,is_main) VALUES
	 ('FR','epo',false,false),
	 ('IT','fra',false,false),
	 ('FR','fra',true,true),
	 ('IT','epo',true,true),
	 ('US','ces',false,false),
	 ('US','fra',false,false),
	 ('US','epo',true,true);

INSERT INTO public.j_document_caver_author (id_document,id_caver) VALUES
	 (16746,4);

INSERT INTO public.j_document_language (id_document,id_language,is_main) VALUES
	 (109,'000',false),
	 (161,'000',false),
	 (191,'000',false),
	 (1378,'000',false),
	 (1409,'000',false),
	 (2542,'000',false),
	 (2591,'000',false),
	 (2998,'000',false),
	 (5801,'000',false),
	 (6065,'000',false),
	 (6068,'000',false),
	 (6096,'000',false),
	 (10406,'000',false),
	 (12106,'000',false),
	 (12639,'000',false),
	 (16746,'000',false);

INSERT INTO public.j_document_region (id_document,id_region) VALUES
	 (109,82),
	 (161,82),
	 (191,82),
	 (1378,82),
	 (1409,82),
	 (2542,82),
	 (2591,82),
	 (2998,82),
	 (5801,82),
	 (6065,82),
	 (6068,82),
	 (6096,82),
	 (10406,82),
	 (12106,82),
	 (12639,82),
	 (16746,82);

INSERT INTO public.j_entrance_caver (id_entrance,id_caver) VALUES
	 (1,1),
	 (1,4),
	 (1,5),
	 (1,6),
	 (2,4),
	 (2,5),
	 (3,2),
	 (4,5),
	 (5,5),
	 (5,6),
	 (6,5),
	 (7,1),
	 (7,6),
	 (9,2),
	 (10,2),
	 (11,2),
	 (12,2),
	 (12,5),
	 (13,1),
	 (13,2),
	 (13,5),
	 (14,1),
	 (14,2),
	 (15,2),
	 (15,5),
	 (16,2),
	 (17,2),
	 (18,2),
	 (20,1),
	 (20,2),
	 (20,5),
	 (21,1),
	 (21,2),
	 (21,5);

INSERT INTO public.j_grotto_cave_explorer (id_cave,id_grotto) VALUES
	 (75070,6);

INSERT INTO public.j_grotto_caver (id_caver,id_grotto) VALUES
	 (2,1),
	 (1,2),
	 (2,2),
	 (4,2),
	 (5,2),
	 (6,2);

INSERT INTO public.j_license_type (id_license,id_type) VALUES
	 (1,4),
	 (1,18);

-- INSERT INTO public.spatial_ref_sys (srid,auth_name,auth_srid,srtext,proj4text) VALUES
--	 (2192,'EPSG',2192,'PROJCS["ED50 / France EuroLambert (deprecated)",GEOGCS["ED50",DATUM["European_Datum_1950",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[-87,-98,-121,0,0,0,0],AUTHORITY["EPSG","6230"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4230"]],PROJECTION["Lambert_Conformal_Conic_1SP"],PARAMETER["latitude_of_origin",46.8],PARAMETER["central_meridian",2.337229166666667],PARAMETER["scale_factor",0.99987742],PARAMETER["false_easting",600000],PARAMETER["false_northing",2200000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","2192"]]','+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=2.337229166666667 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs '),
--	 (2309,'EPSG',2309,'PROJCS["WGS 84 / TM 116 SE",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",116],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",10000000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","2309"]]','+proj=tmerc +lat_0=0 +lon_0=116 +k=0.9996 +x_0=500000 +y_0=10000000 +datum=WGS84 +units=m +no_defs ');
