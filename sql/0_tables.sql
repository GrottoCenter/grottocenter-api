--
-- Grottocenter database model
-- Schema coming from v2
--

USE grottoce;

-- Entity tables

CREATE TABLE IF NOT EXISTS `T_application` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Is_current` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Version` varchar(10) NOT NULL,
  `Url` varchar(100) NOT NULL,
  `Contact` varchar(200) NOT NULL,
  `Host` varchar(100) NOT NULL,
  `Timer_min` double NOT NULL DEFAULT '5',
  `Availability` int(11) NOT NULL,
  `Estimated_reopening_time` datetime DEFAULT NULL,
  `Creation` date NOT NULL,
  `Revision` date NOT NULL,
  `Authors` varchar(200) NOT NULL,
  `Authors_contact` varchar(200) DEFAULT NULL,
  `Thanks` varchar(200) DEFAULT NULL,
  `Copyright` varchar(300) NOT NULL,
  `Id_comments` int(5) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_author` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Id_author` smallint(5) NOT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Id_caver` smallint(5) NOT NULL DEFAULT '0',
  `Name` varchar(70) DEFAULT NULL,
  `Contact` varchar(70) DEFAULT NULL,
  `Creator_is_author` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Validated` enum('YES','NO') NOT NULL DEFAULT 'NO',
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_bibliography` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Relevance` double NOT NULL DEFAULT '1',
  `Body` longtext NOT NULL,
  PRIMARY KEY (`Id`,`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_category` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `Fr_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `En_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `Es_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `De_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `Bg_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `It_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `Ca_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `Nl_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `Rs_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `T_cave` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Name` varchar(36) NOT NULL,
  `Min_depth` double DEFAULT NULL,
  `Max_depth` double DEFAULT NULL,
  `Depth` double DEFAULT NULL,
  `Length` double DEFAULT NULL,
  `Is_diving` enum('YES','NO') DEFAULT 'NO',
  `Temperature` double DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_caver` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Activated` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Activation_code` varchar(32) NOT NULL DEFAULT '0',
  `Banned` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Ip` varchar(200) DEFAULT NULL,
  `Browser` varchar(1000) DEFAULT NULL,
  `Connection_counter` int(10) NOT NULL DEFAULT '0',
  `Relevance` double NOT NULL DEFAULT '1',
  `Name` varchar(36) DEFAULT NULL,
  `Surname` varchar(32) DEFAULT NULL,
  `Login` varchar(20) NOT NULL,
  `Nickname` varchar(68) NOT NULL,
  `Password` varchar(32) NOT NULL DEFAULT '0',
  `Country` varchar(3) DEFAULT NULL,
  `Region` varchar(32) DEFAULT NULL,
  `City` varchar(32) DEFAULT NULL,
  `Postal_code` varchar(5) DEFAULT NULL,
  `Address` varchar(128) DEFAULT NULL,
  `Date_birth` date DEFAULT NULL,
  `Contact` varchar(50) NOT NULL,
  `Year_initiation` int(4) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_last_connection` datetime DEFAULT NULL,
  `Language` varchar(4) NOT NULL,
  `Contact_is_public` int(2) NOT NULL DEFAULT '0',
  `Alert_for_news` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Show_links` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Detail_level` int(3) NOT NULL DEFAULT '30',
  `Latitude` decimal(24,20) NOT NULL DEFAULT '0.00000000000000000000',
  `Longitude` decimal(24,20) NOT NULL DEFAULT '0.00000000000000000000',
  `Default_latitude` decimal(24,20) DEFAULT NULL,
  `Default_longitude` decimal(24,20) DEFAULT NULL,
  `Default_zoom` int(11) DEFAULT NULL,
  `Custom_message` longtext,
  `Facebook` varchar(100) DEFAULT NULL,
  `Picture_file_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Login` (`Login`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_comment` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) unsigned NOT NULL,
  `Id_answered` smallint(5) DEFAULT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Id_exit` smallint(5) NOT NULL DEFAULT '0',
  `Relevance` double NOT NULL DEFAULT '1',
  `E_t_underground` time DEFAULT NULL,
  `E_t_trail` time DEFAULT NULL,
  `Aestheticism` varchar(5) DEFAULT NULL,
  `Caving` double DEFAULT NULL,
  `Approach` double DEFAULT NULL,
  `Title` varchar(300) NOT NULL,
  `Body` longtext NOT NULL,
  `Alert` enum('YES','NO') NOT NULL DEFAULT 'NO',
  PRIMARY KEY (`Id`,`Id_author`,`Id_entry`,`Id_exit`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_answered` (`Id_answered`),
  KEY `Id_entry` (`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_country` (
  `Iso` varchar(2) NOT NULL,
  `Latitude` decimal(24,20) DEFAULT NULL,
  `Longitude` decimal(24,20) DEFAULT NULL,
  `Native_name` varchar(50) DEFAULT NULL,
  `En_name` varchar(50) NOT NULL,
  `Fr_name` varchar(50) NOT NULL,
  `Es_name` varchar(50) NOT NULL DEFAULT '-Unknown-',
  `De_name` varchar(50) NOT NULL DEFAULT '-UNK-',
  `Bg_name` varchar(50) NOT NULL DEFAULT '?',
  `It_name` varchar(50) NOT NULL DEFAULT '?',
  `Ca_name` varchar(50) NOT NULL DEFAULT '?',
  `Nl_name` varchar(50) NOT NULL DEFAULT '?',
  `Rs_name` varchar(50) NOT NULL DEFAULT '?',
  PRIMARY KEY (`Iso`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_crs` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Code` varchar(50) NOT NULL,
  `Definition` varchar(1000) NOT NULL,
  `Bounds` varchar(100) DEFAULT NULL,
  `Url` varchar(200) DEFAULT NULL,
  `Enabled` enum('YES','NO') NOT NULL DEFAULT 'NO',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_description` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Relevance` double NOT NULL DEFAULT '1',
  `Id_exit` smallint(5) DEFAULT NULL,
  `Title` varchar(300) NOT NULL,
  `Body` longtext NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_exit` (`Id_exit`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_entry` (
  `Id` mediumint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Name` varchar(100) NOT NULL,
  `Country` varchar(3) NOT NULL,
  `Region` varchar(32) DEFAULT NULL,
  `City` varchar(32) DEFAULT NULL,
  `Address` varchar(128) DEFAULT NULL,
  `Year_discovery` int(4) DEFAULT NULL,
  `Id_type` smallint(5) NOT NULL DEFAULT '0',
  `External_url` longtext,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Is_public` enum('YES','NO') NOT NULL,
  `Is_sensitive` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Contact` varchar(1000) DEFAULT NULL,
  `Modalities` varchar(100) NOT NULL DEFAULT 'NO,NO,NO,NO',
  `Has_contributions` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Latitude` decimal(24,20) NOT NULL,
  `Longitude` decimal(24,20) NOT NULL,
  `Altitude` double DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_type` (`Id_type`),
  KEY `latitude_longitude` (`Latitude`,`Longitude`),
  KEY `Id` (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_error` (
  `Id` int(5) NOT NULL AUTO_INCREMENT,
  `Id_caver` smallint(5) DEFAULT NULL,
  `File` varchar(100) DEFAULT NULL,
  `Frame` enum('banner','blank','details','filter','general','infowindow','loader','overview','site','function','file') DEFAULT NULL,
  `Function` varchar(100) DEFAULT NULL,
  `Date` datetime DEFAULT NULL,
  `Error` varchar(200) DEFAULT NULL,
  `Comment` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_caver` (`Id_caver`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_file` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Id_author` smallint(5) NOT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Name` varchar(100) NOT NULL,
  `Path` varchar(1000) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_grotto` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Name` varchar(100) NOT NULL,
  `Country` varchar(3) DEFAULT NULL,
  `Region` varchar(32) DEFAULT NULL,
  `City` varchar(32) DEFAULT NULL,
  `Postal_code` varchar(5) DEFAULT NULL,
  `Address` varchar(128) DEFAULT NULL,
  `Contact` varchar(40) DEFAULT NULL,
  `Year_birth` varchar(4) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Id_president` int(6) DEFAULT NULL,
  `Id_vice_president` int(6) DEFAULT NULL,
  `Id_treasurer` int(6) DEFAULT NULL,
  `Id_secretary` int(6) DEFAULT NULL,
  `Latitude` decimal(24,20) DEFAULT NULL,
  `Longitude` decimal(24,20) DEFAULT NULL,
  `Custom_message` longtext,
  `Picture_file_name` varchar(100) DEFAULT NULL,
  `isPartner` enum('YES','NO') DEFAULT 'NO',
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_president` (`Id_president`),
  KEY `Ind_vice_president` (`Id_vice_president`),
  KEY `Ind_treasurer` (`Id_treasurer`),
  KEY `Ind_secretary` (`Id_secretary`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_group` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) NOT NULL,
  `Comments` varchar(1000) DEFAULT NULL,
  `Level` smallint(5) DEFAULT NULL,
  `Id_label` smallint(5) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Id`,`Id_label`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_group_layer` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Code` varchar(100) NOT NULL,
  `Name` varchar(200) NOT NULL,
  `Id_label` smallint(5) NOT NULL,
  PRIMARY KEY (`Id`,`Id_label`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `T_history` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Relevance` double NOT NULL DEFAULT '1',
  `Body` longtext NOT NULL,
  PRIMARY KEY (`Id`,`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_label` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Frame` enum('banner','blank','details','filter','general','infowindow','loader','overview','site','file','home') NOT NULL,
  `Fr` varchar(1000) DEFAULT NULL,
  `En` varchar(1000) DEFAULT NULL,
  `Es` varchar(1000) DEFAULT NULL,
  `De` varchar(1000) DEFAULT NULL,
  `Bg` varchar(1000) DEFAULT NULL,
  `Nl` varchar(1000) DEFAULT NULL,
  `Ca` varchar(1000) DEFAULT NULL,
  `It` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_label_temp` (
  `Id_temp` smallint(5) NOT NULL,
  `Fr` varchar(1000) DEFAULT NULL,
  `En` varchar(1000) DEFAULT NULL,
  `Es` varchar(1000) DEFAULT NULL,
  `Ca` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`Id_temp`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_layer` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Enabled` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Code` varchar(100) NOT NULL,
  `Url` varchar(1000) NOT NULL,
  `Name` varchar(200) NOT NULL,
  `Short_name` varchar(100) NOT NULL,
  `Layer` varchar(100) NOT NULL,
  `Style` varchar(200) DEFAULT NULL,
  `Format` varchar(100) NOT NULL,
  `Version` varchar(50) NOT NULL,
  `Background_color` varchar(8) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `T_location` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Relevance` double NOT NULL DEFAULT '1',
  `Body` longtext NOT NULL,
  PRIMARY KEY (`Id`,`Id_entry`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Id_entry` (`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_massif` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Name` varchar(36) NOT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_message_subject` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Subject` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `Fr_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `Fr_admin_id` smallint(5) NOT NULL,
  `En_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `En_admin_id` smallint(5) NOT NULL,
  `Es_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `Es_admin_id` smallint(5) NOT NULL,
  `De_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `De_admin_id` smallint(5) NOT NULL,
  `Bg_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `Bg_admin_id` smallint(5) NOT NULL,
  `Nl_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `Nl_admin_id` smallint(5) NOT NULL,
  `Ca_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `Ca_admin_id` smallint(5) NOT NULL,
  `It_subject` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `It_admin_id` smallint(5) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_subject` (`Subject`),
  KEY `Ind_Fr` (`Fr_admin_id`),
  KEY `Ind_Es` (`Es_admin_id`),
  KEY `Ind_En` (`En_admin_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `T_news` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) unsigned NOT NULL,
  `Id_answered` smallint(5) DEFAULT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Is_public` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Title` varchar(300) NOT NULL,
  `Body` longtext NOT NULL,
  PRIMARY KEY (`Id`,`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_answered` (`Id_answered`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_request` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Date_issue` datetime DEFAULT NULL,
  `Name` varchar(100) NOT NULL,
  `Id_recipient` smallint(5) unsigned NOT NULL,
  `Id_status` smallint(5) unsigned NOT NULL,
  `Comments` longtext,
  PRIMARY KEY (`Id`,`Id_recipient`,`Id_status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_rigging` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` varchar(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Relevance` double NOT NULL DEFAULT '1',
  `Id_exit` smallint(5) DEFAULT NULL,
  `Title` varchar(300) NOT NULL,
  `Obstacles` longtext,
  `Ropes` longtext,
  `Anchors` longtext,
  `Observations` longtext,
  PRIMARY KEY (`Id`),
  KEY `Ind_author` (`Id_author`),
  KEY `Ind_reviewer` (`Id_reviewer`),
  KEY `Ind_exit` (`Id_exit`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_right` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) NOT NULL,
  `Comments` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_single_entry` (
  `Id` mediumint(5) unsigned NOT NULL,
  `Min_depth` float DEFAULT NULL,
  `Max_depth` float DEFAULT NULL,
  `Depth` float DEFAULT NULL,
  `Length` float unsigned DEFAULT NULL,
  `Is_diving` enum('YES','NO') DEFAULT 'NO',
  `Temperature` float DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_status` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Id_label` varchar(100) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_topography` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Id_author` smallint(5) NOT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Id_request` smallint(5) unsigned NOT NULL,
  `Is_public` enum('YES','NO') NOT NULL DEFAULT 'YES',
  `Remove_north` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Remove_scale` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Distort_topo` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Enabled` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Enabled_back` enum('YES','NO') NOT NULL DEFAULT 'NO',
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_type` (
  `Id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `Fr_type` varchar(100) NOT NULL,
  `En_type` varchar(100) NOT NULL,
  `Es_type` varchar(100) NOT NULL,
  `De_type` varchar(100) NOT NULL,
  `Bg_type` varchar(100) NOT NULL DEFAULT '',
  `Nl_type` varchar(100) NOT NULL DEFAULT '',
  `Ca_type` varchar(100) NOT NULL DEFAULT '',
  `It_type` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_url` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Locked` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `Id_author` smallint(5) NOT NULL,
  `Id_reviewer` smallint(5) DEFAULT NULL,
  `Id_locker` smallint(5) DEFAULT NULL,
  `Date_inscription` datetime DEFAULT NULL,
  `Date_reviewed` datetime DEFAULT NULL,
  `Date_locked` datetime DEFAULT NULL,
  `Url` varchar(200) DEFAULT NULL,
  `Name` varchar(200) NOT NULL,
  `Comments` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `T_warning` (
  `Id` int(5) NOT NULL AUTO_INCREMENT,
  `Id_caver` smallint(5) DEFAULT NULL,
  `Frame` varchar(50) DEFAULT NULL,
  `Date` datetime DEFAULT NULL,
  `Warning` varchar(5000) DEFAULT NULL,
  `Comment` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Ind_caver` (`Id_caver`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- Jointure tables

CREATE TABLE `J_author_file` (
  `Id_author` smallint(5) unsigned NOT NULL,
  `Id_file` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_author`,`Id_file`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_cave_entry` (
  `Id_cave` smallint(5) unsigned NOT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_cave`,`Id_entry`),
  KEY `Id_entry` (`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_caver_group` (
  `Id_caver` smallint(5) unsigned NOT NULL,
  `Id_group` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_caver`,`Id_group`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_country_crs` (
  `Iso` varchar(2) NOT NULL,
  `Id_crs` smallint(5) unsigned NOT NULL,
  KEY `Ind_country` (`Iso`),
  KEY `Ind_crs` (`Id_crs`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_entry_caver` (
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Id_caver` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_entry`,`Id_caver`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_entry_description` (
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Id_description` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_entry`,`Id_description`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_entry_rigging` (
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Id_rigging` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_entry`,`Id_rigging`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_entry_url` (
  `Id_entry` mediumint(5) unsigned NOT NULL,
  `Id_url` smallint(5) NOT NULL,
  PRIMARY KEY (`Id_entry`,`Id_url`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_grotto_caver` (
  `Id_grotto` smallint(5) unsigned NOT NULL,
  `Id_caver` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_grotto`,`Id_caver`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_grotto_entry` (
  `Id_grotto` smallint(5) unsigned NOT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_grotto`,`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `J_group_layer` (
  `Id_group` smallint(5) NOT NULL,
  `Id_layer` smallint(5) NOT NULL,
  PRIMARY KEY (`Id_group`,`Id_layer`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE `J_group_right` (
  `Id_group` smallint(5) unsigned NOT NULL,
  `Id_right` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_group`,`Id_right`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_help_topic` (
  `Id` smallint(5) NOT NULL AUTO_INCREMENT,
  `Id_help` smallint(5) NOT NULL,
  `Language` varchar(5) NOT NULL,
  `Id_forum` smallint(5) NOT NULL,
  `Id_topic` smallint(5) NOT NULL,
  `Comments` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`,`Id_forum`,`Id_topic`),
  KEY `Id_topic` (`Id_topic`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_massif_cave` (
  `Id_massif` smallint(5) unsigned NOT NULL,
  `Id_cave` smallint(5) unsigned NOT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_entry`,`Id_cave`,`Id_massif`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_topo_author` (
  `Id_topography` smallint(5) unsigned NOT NULL,
  `Id_author` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_topography`,`Id_author`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_topo_cave` (
  `Id_topography` smallint(5) unsigned NOT NULL,
  `Id_cave` smallint(5) unsigned NOT NULL,
  `Id_entry` mediumint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_topography`,`Id_cave`,`Id_entry`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `J_topo_file` (
  `Id_topography` smallint(5) unsigned NOT NULL,
  `Id_file` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`Id_topography`,`Id_file`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
