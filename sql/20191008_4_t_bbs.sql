-- phpMyAdmin SQL Dump
-- version 4.7.8
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le :  ven. 01 nov. 2019 à 16:37
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
-- Structure de la table `t_bbs`
--

CREATE TABLE `t_bbs` (
  `ArticleTitle` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ArticleYear` int(5) DEFAULT NULL,
  `publication_export` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Abstract` varchar(10000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ChapterCode` float(50,3) DEFAULT NULL,
  `cros_chap_rebuilt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CountryCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cros_country_rebuilt` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `XrefNumeriqueFinal` int(20) NOT NULL,
  `cAuthorsFull` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editor_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editor_email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editor_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publication_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LibraryCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set XrefNumeriqueFinal as primary key and unique
ALTER TABLE `t_bbs` ADD PRIMARY KEY( `XrefNumeriqueFinal`); 
ALTER TABLE `t_bbs` ADD UNIQUE( `XrefNumeriqueFinal`); 

--
-- Déchargement des données de la table `t_bbs`
--

INSERT INTO `t_BBS` (`ArticleTitle`, `ArticleYear`, `publication_export`, `Abstract`, `ChapterCode`, `cros_chap_rebuilt`, `CountryCode`, `cros_country_rebuilt`, `ref_`, `XrefNumeriqueFinal`, `cAuthorsFull`, `editor_address`, `editor_email`, `editor_url`, `publication_url`, `LibraryCode`) VALUES
('[Introduction]. ', 1989, 'IV Symposium on Historic Underground, Mariánské Lázne 29.9-1.10.1989. In Knih. Ces. Speleol. Spol., vol. 17 : 1, (1 fig.)', 'Introduction to the volume with the general information on the area of the Slavkovsky les (Bohemia).', 2.110, NULL, 'CZ', NULL, ' 89.0229', 8902290, 'Jana BAROCHOVA; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('The effect of pressure on aragonite dissolution rates in seawater', 1987, 'Geochim. et Cosmochim. Acta vol. 51 : 2171-2175.', NULL, 1.110, '1.13    ', NULL, NULL, '1988.0001', 198800010, 'J. G. ACKER;R. H. BYRNE;S. BEN-YAKOOV;R. A. FEELY;P. R. Betzer; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Calcite dissolution kinetics in the system H20-CO2-CaCO3 with participation of foreign ions', 1987, 'Chemical geology 64 : 90-102.', 'Although foreign ions displace the calcite solution equilibria, by the effect of ion-strength, ion-pairing and the commonion effect, the kinetics of the dissolution process are hardly changed. Additional experiments with different limestones show that the effect of lithology on calcite dissolution kinetics is smali, even for rather impure limestones', 1.110, NULL, NULL, NULL, '1988.0002', 198800020, 'Dieter BUHMANN;Wolfgang DREYBRODT; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('(Balancing rocks)', 1988, 'Föld és ég 1988/1 : 6-9 (photos, figs. (hungar.)', 'The article informs about the origin and the typical occurence of balancing rocks, also mentioning that they can come into being by tropical karstification as well', 1.110, '1.15    ', NULL, 'H         ', '1988.0003', 198800030, 'Denes BALAZS; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Les rapports entre formes de fond et formes de surface dans les paysages karstiques. \"Actes des Journées Felix Trombe, 1987\", t. 1', 1988, 'Mémoires S. C. Paris (14) : 37-42 (3 fig.).', 'La compréhension de ces rapports exige une égale connaissance des deux types de formes. L\'auteur se propose de rechercher une classification des différentes relations entre les formes et leurs divers rapports de \"causalité (interaction ?, évolution séparée ?). Ont été distingués, en prenant appui sur des exemples pris dans le Doubs, les rapports de causalité commune et les rapports de causalité directe : communication reprise des Trav. Inst. Géog. Reims, n°17, 1974', 1.110, NULL, NULL, NULL, '1988.0004', 198800040, 'Y. CALLOT; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Le facteur lithologique - 2° partie : Roches solubles non carbonatées et karstification', 1988, 'Phénomènes karstiques, Série 41, éd. compte d\'auteur, vente S. C. Paris, 78 pp., 47 fig., 3 pl., ph.', 'Fait suite à \"Roches carbonatées et karstification\" (BBS nr. 87.0005). Rassemble les connaissances (littérature en langue non-française pour la plupart) sur les karsts en roche magmatique (granits, basaltes), en roche siliceuse (grès, quartzite), sur les karsts de gypse, de sel gemme, distinguant karst superficiel et karst profond. Reproduit de nombreux plans, bloc-diagrammes, cartes. Une table alphabétique (pp. 63-64) et une bibliographie abondante (pp. 67-73) complètent l\'ouvrage', 1.110, '1.21 8.3   ', NULL, NULL, '1988.0005', 198800050, 'J. CHOPPY; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Surface stability considerations related to abstraction of ground water from dolomite', 1988, 'PWV Area 1988 : 80-85.', 'Workshop on dolomitic groundwater of the The effects of water level lowering by 5-10 m in different karst morphological zones (sinkholes, subsidences) are examined', 1.110, '6.2    ', NULL, NULL, '1988.0006\n', 198800060, 'J. H. DE BEER; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Genèse des magasins karstiques. Analyse comparative des valeurs actuelles de la dissolution naturelle des roches carbonatées d\'après des exemples en Chine et dans d\'autres parties du monde', 1987, 'Carsologia sinica vol. 6, Nr. 2 : 127-130.', 'Discussion sur la genèse des magasins karstiques, sur les modes de calcul de la dissolution, sur les valeurs de la dissolution actuelle', 1.110, '1.21    ', NULL, NULL, '1988.0007', 198800070, 'Claude DROGUE;Daoxian YUAN; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('[Formation of karst cavities and comparison between carbonate rock dissolution rates in China and some other part of the world]', 1987, 'Carsologia sinica vol. 6 Nr. 2 : 131-136 (chines. ; engl. summ. )(5 fig.).', 'It is shown that climate conditions cast clear influence on carbonate dissolution rate', 1.110, NULL, NULL, NULL, '1988.0008', 198800080, 'Claude DROGUE;Daoxian YUAN; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Experiments on kluftkarren and related lapies forms', 1988, 'Z. Geormoph. N. F. 32 (l) : 1-16, 4 fig. : 9 photos.', 'Experiments with fractured plaster-of-paris model blocks, the top surface of which is acted upon by artificial rain, yield close replicas of natural kluftkarren and derivative positive lapies forms. With progressing dissolution, the fractures are transformed into V-shaped lapies crevices, and the positive forms are seen to pass through a sequence of transformations which correspond closely to specific lapies forms observed in nature. -- It is suggested that the transformations and the resulting sequences of forms observed in experiments may also correspond to much larger karst landforms such as crevice karst, pinnacled karst of arète-and-pinnacle karst', 1.110, NULL, NULL, NULL, '1988.0009', 198800090, 'S. DZULYNSKI;E. GIL;J. RUDNICKI; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('A review of dissolution rills in limestone and other soluble rocks', 1987, 'Catena suppl. 8 : 119-140.', 'Solutional rills are classified and discussed by size, form and supposed mode of origin. The emphases is on hydraulics of flow, the basic distinction being between channels parallel to the direction of flow (the most common) and those which are transverse to flow (transverse ripples and flutëd scallops). The first group are further divided : (1) Microrills, controlled by capillary forces, (2) Gravitomorphic rills are subdivided into (a) those which head at the crest and extinguish downslope (Rillenkarren); (b) the Hortonian type which head below a belt of no channelled erosion and enlarge downslope (Rinnenkarren develop on bare rock, Rundkarren develop under a cover); (c) decantation forms which reduce in width and/or depth downslope : a point source produces Wzindkarren, a diffuse source produces a suite of parallel decantation flutings. In nature few rills have had a sample history. Many must be classified as polygenetic forms', 1.110, NULL, NULL, NULL, '1988.0010', 198800100, 'D. C. FORD;J. LUNDBERG; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Tropical caves in retrospect and prospect', 1987, 'Progress in physical geography 11 (4) : 511-532, (4 fig., 2 tab.).', 'This article gives an overlook over recent studies in limestone caves of the humid tropics (with large bibliography). The author discusses specially the questions : are tropical caves significantly different in morphology and process to other limestone caves; what is their contribution to speleogenetic theory; can we use them to infer rates of surface landform development; and is their study of relevance to tropical countries, or is it a pursuit for adventurous dilettantes ?', 1.110, '1.21    ', NULL, NULL, '1988.0011', 198800110, 'David GILLIESON; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('[The corrosion of carbonates and environment temperaturel', 1987, 'Carsologia sinica vol. 6 (nr. 4) : 287-296 (chines. ; engl. summ.) (3 tabl., 13 fig.).', 'Tue dissolution speed of carbonates (limestone, dolomite) was studied. Low (0, 5°C) and high (80°C) temperature are unfavourable for dissolution of carbonates', 1.110, NULL, NULL, NULL, '1988.0012', 198800120, 'Shangyu HUANG;Huanrong SONG; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Distribution coefficient of Mg++ ions between calcite and solutions at 10-15\'C', 1987, 'Marine Chemistry 20 : 327-336.', NULL, 1.110, NULL, NULL, NULL, '1988.0013', 198800130, 'Tamotsu OOMORI;Hiroshi KANESHIMA;Yoko MAEZATO; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Modelle der Kalk-Auflösung und 13C/12C-Entwicklung von Karbonat-Grundwässern', 1987, 'Z. Wasser-Abwasser-Forsch. 20 : 69-81.', 'The subsurface dissolution of carbonate rocks is essentially controlled by dissolved biogenic C02, and occurs in hydrogeochemical systems which stand between two limiting cases. In industrial areas an additional dissolution by dissolved sulfur oxides from atmospheric pollution may occur. A model consideration of these processes requires data on the composition of groundwater with respect to the major components as well as data on the stable carbon isotopes of the dissolved carbonate, the carbonate rocks, and the soil-CO2 in the recharge area. It is further necessary to determine the quantities of the dissolved sulfate of geogenic and anthropogenic origin. The formal treatment of quantitative model considerations for various hydrogeochemical situations is deduced using the system CaCO3-CO2-SO3-H20', 1.110, '1.12    ', NULL, NULL, '1988.0014', 198800140, 'Karl Wolfram SCHAEFER;Eberhard USDOWSKI; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC'),
('Gruppe Biwak 77', 1999, 'AGH - Forschungsberichte 1998/99. 10 Pläne.', '1150 m. Gänge vermessen.', 2.110, NULL, 'SCH/A', NULL, '1999.01995b', 1999019952, 'Toni PULFER; ; ; ; ; ; ; ; ; ', NULL, NULL, NULL, NULL, 'NC');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
