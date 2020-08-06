-- phpMyAdmin SQL Dump
-- version 4.7.8
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le :  lun. 28 oct. 2019 à 05:50
-- Version du serveur :  5.7.18
-- Version de PHP :  7.2.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `grottoce`
--

-- --------------------------------------------------------

--
-- Structure de la table `t_bbs_lib`
--

CREATE TABLE `t_bbs_lib` (
  `code_centre` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom_centre` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pays` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set code_centre as primary key and unique
ALTER TABLE `t_bbs_lib` ADD PRIMARY KEY(`code_centre`); 
ALTER TABLE `t_bbs_lib` ADD UNIQUE(`code_centre`); 

--
-- Déchargement des données de la table `t_bbs_lib`
--

INSERT INTO `t_bbs_lib` (`code_centre`, `nom_centre`, `pays`) VALUES
('A_01', 'Speläologisches Dokumentationszentrum der Abteilung für Karst- und Höhlenkunde am Naturhistorischen Museum Wien', 'Autriche'),
('B_01', 'Centre Documentation; Union Belge de Spéléologie UBS/SSW', 'Belgique'),
('CH_01', 'Bibliothèque centrale Société Suisse de Spéléologie / Centre Documentation UIS', 'Suisse'),
('CH_02', 'Bibliothèque du centre d’hydrogéologie de l’université de Neuchâtel', 'Suisse'),
('CH_03', 'Musée d’Histoire Naturelle de Genêve', NULL),
('D_01', 'Bibliothek des Verbandes der Deutschen Höhlen- und Karstforscher', 'Allemagne'),
('E_01', 'Centre de documentació espeleologica', 'Espagne'),
('E_02', 'Bibliotheca Espeleo Club de Gràcia (Barcelona)', 'Espagne'),
('E_03', 'Biblioteca Federació Catalana d’Espeleologia (Barcelona)', 'Espagne'),
('F_01', 'Centre National de Documentation Spéléologique ', 'France'),
('F_02', 'Musée régional de préhistoire Orgnac-l’Aven', NULL),
('F_03', 'Centre de documentation sur le Karst. Fonds Jacques Choppy', 'France'),
('GR_01', 'Société spéléologique Hellenique', 'Grèce'),
('I_01', 'Centro Italiano di documentazione speleologica “F. Anelli”, Società Speleologica Italiana', 'Italie'),
('J_01', 'Natural Science Museum', 'Japon'),
('J_02', 'Departement of Earth System Science, Faculty of Science', 'Japon'),
('NC', 'inconnu / unknown', NULL),
('P_01', 'Biblioteca Sociedade portuguesa de espeleologia', 'Portugal'),
('PL_01', 'Library of \"Kras i speleologia\" ; Laboratory of Research and Documentation of Karst Environment', 'POLAND'),
('R_01', 'Institut de spéologie', 'Roumanie'),
('RA_1', 'Bibliotheque \"Dr. Emilio Maury\"/ Library GEA', 'República Argentina'),
('RA_2', 'Bibliotheque IN.A.E/Library IN.A.E', 'Argentina'),
('RL_01', 'Bibliothèque Sami Karkabi - Centre International de Documentation Speleologique', 'Liban'),
('S_01', 'Library of Swedish Speleological Society', NULL),
('SK_01', 'The Slovak Museum of Natural Protection and Speleology', 'Slovakia'),
('SL_01', 'Institut za raziskovanje krasa ZRC SAZU', 'Slovenia'),
('UK_01', 'British Cave Research Association BCRA, Library', 'United Kingdom'),
('USA_01', 'National Speleological Society, Library', 'USA'),
('WEB', 'WWW', NULL),
('YV_01', 'Biblioteca Sociedad Venezolana de espeleologia', 'Venezuela');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
