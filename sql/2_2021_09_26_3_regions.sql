\c grottoce;

-- Deprecated, replaced by the t_country and t_iso3166_2 tables
INSERT INTO t_region (id, code, is_deprecated, "name", id_country) VALUES
	(999, '--', false, 'the whole country', '00'),
	(1, 'Abchazia', true, 'Abkhazia', 'GE'),
	(2, 'Antilles', true, 'Antilles (Petites / Lesser) Antigua & Barbuda, Antilles néérlandaises (NL) (Curaçao), Barbados, Dominica, Grenada, Guadeloupe (F), Martinique (F), Montserrat (Commonw.), St.Kitts, Nevis & Anguilla, St. Lucia, St. Pierre(F), St. Vincent, Trinidad & Tobago', '00'),
	(3, 'ArabieEmirats', true, NULL, 'SA'),
	(4, 'Canberra', true, 'Canberra', 'AU'),
	(5, 'AUS', true, NULL, 'AU'),
	(6, 'AUS01', true, 'New South Wales / Nouvelle-Galles du Sud', 'AU'),
	(7, 'AUS02', true, 'Northern Territory / Territoire du Nord', 'AU'),
	(8, 'AUS03', true, 'Queensland', 'AU'),
	(9, 'AUS04', true, 'South Australia / Australie Méridionale', 'AU'),
	(10, 'AUS05', true, 'Tasmania / Tasmanie', 'AU'),
	(11, 'AUS06', true, 'Victoria', 'AU'),
	(12, 'AUS07', true, 'Western Australia / Australie Occidentale ', 'AU'),
	(13, 'azBELARUS', true, NULL, 'BY'),
	(14, 'B', true, 'Belgium', 'BE'),
	(15, 'B01', true, 'Liège / Luik / Luttich', 'BE'),
	(16, 'B02', true, 'Namur / Namem', 'BE'),
	(17, 'B03', true, 'Anvers, Bruxelles, Brabant, Hainaut, Limbourg, Luxembourg, Flandre / Antwerpen, Brussel, Brabant, Henegouwen, Limburg, Luxemburg, Vlaanderen', 'BE'),
	(18, 'Bahamas', true, 'Bahamas (incl. Turkos y Caicos; Cayman; Andros; Eleuthera)', 'BS'),
	(19, 'BOS', true, NULL, 'BA'),
	(20, 'BULG', true, NULL, 'BG'),
	(21, 'BurkinaFaso', true, NULL, 'BF'),
	(22, 'CaboVerde', true, NULL, 'CV'),
	(23, 'Cambodia', true, NULL, 'KH'),
	(24, 'Canarias', true, 'Canarias (Las Palmas; Santa Cruz de Tenerife)', 'ES'),
	(25, 'Cayman', true, NULL, 'GB'),
	(26, 'CDN', true, NULL, 'CA'),
	(27, 'CDN01', true, 'Alberta', 'CA'),
	(28, 'CDN02', true, 'British Columbia / Colombie Britannique', 'CA'),
	(29, 'CDN03', true, 'Prince Edward Island (PEI), New Brunswick; Newfoundland / Terre Neuve; Nova Scotia; Ontario', 'CA'),
	(30, 'CDN04', true, 'Manitoba; Northwest Territories; Saskatchewan; Yukon Territories; Nunavut', 'CA'),
	(31, 'CDN05', true, 'Québec', 'CA'),
	(32, 'Centro-Africaine', true, NULL, 'CF'),
	(33, 'Chile', true, NULL, 'CL'),
	(34, 'China', true, NULL, 'CN'),
	(35, 'China/A', true, 'Provinces & Municipalities. Anhui; Beijing; Guangdong; Guangxi; Guizhou; Hebei; Heilongjjang; Henan; Hubei; Hunan; Jangsu; Liaoning; Ningxia; Shandong; Shanxi; Shaanxi; Sichuan; Yunnan; Zheijang', 'CN'),
	(36, 'China/B', true, 'Marginal Autonomous Countries, Inner Mongolia (Nei Menggu Zizhiqu), Tibet (Xizang, Nei Zizhiqu), Sinkiang -Uighur (Xinjiang Weiwuer Zizhiqu)', 'CN'),
	(37, 'Columbia', true, NULL, 'CO'),
	(38, 'Comores', true, NULL, 'KM'),
	(39, 'CongoZaire', true, NULL, 'CD'),
	(40, 'CostaRica', true, NULL, 'CR'),
	(41, 'CoteIvoire', true, NULL, 'CI'),
	(42, 'CRO', true, NULL, 'HR'),
	(43, 'CZ', true, NULL, 'CZ'),
	(44, 'CZ/B', true, 'Bohemia / Bohème', 'CZ'),
	(45, 'CZ/M', true, 'Moravia, Silesia / Moravie, Silésie', 'CZ'),
	(46, 'CZDK', true, NULL, 'DK'),
	(47, 'D', true, 'Germany', 'DE'),
	(48, 'D01', true, 'Baden-Württemberg', 'DE'),
	(49, 'D02', true, 'Bayern', 'DE'),
	(50, 'D03', true, 'Hessen', 'DE'),
	(51, 'D04', true, 'Niedersachsen; Sachsen - Anhalt', 'DE'),
	(52, 'D05', true, 'Nordrhein-Westfalen', 'DE'),
	(53, 'D06', true, 'Rheinland-Pfalz; Saarland', 'DE'),
	(54, 'D07', true, 'Sachsen', 'DE'),
	(55, 'D08', true, 'Schleswig-Holstein; Mecklenburg - Vorpommern; Brandenburg; Berlin', 'DE'),
	(56, 'D09', true, 'Thüringen', 'DE'),
	(57, 'Djibuti', true, NULL, 'DJ'),
	(58, 'E', true, 'Spain', 'ES'),
	(59, 'E01', true, 'Andalucia (Almería; Cádiz; Córdoba; Granada; Huelva; Jaén; Málaga; Sevilla)', 'ES'),
	(60, 'E02', true, 'Aragon (Huesca; Teruel; Zaragoza)', 'ES'),
	(61, 'E03', true, 'Asturias (Oviedo)', 'ES'),
	(62, 'E04', true, 'Baleares', 'ES'),
	(63, 'E05', true, 'Canarias, Las Palmas; Santa Cruz de Tenerife', 'ES'),
	(64, 'E06', true, 'Cantabria (Santander)', 'ES'),
	(65, 'E07.1', true, 'Castilla la Nueva / La Mancha; Madrid (Ciudad Real; Toledo; Guadalajara; Cuenca; Madrid)', 'ES'),
	(66, 'E07.2', true, 'Castilla la Vieja; La Rioja; Burgos (Avila; Burgos; Palencia; Soria; Segovia; Valladolid; Logroño)', 'ES'),
	(67, 'E08', true, 'Catalunya (Barcelona; Gerona; Tarragona; Lerida (Lleida))', 'ES'),
	(68, 'E09', true, 'Extremadura (Cáceres; Badajoz)', 'ES'),
	(69, 'E10', true, 'Galicia (Lugo; Ourense; Pontevedra; La Coruña)', 'ES'),
	(70, 'E11', true, 'León (León; Zamora; Salamanca)', 'ES'),
	(71, 'E12', true, 'Murcia; Albacete (Albacete; Murcia)', 'ES'),
	(72, 'E13', true, 'Navarra (Navarra)', 'ES'),
	(73, 'E14', true, 'Valencia (Valencia; Castellon de la Plana; Alicante)', 'ES'),
	(74, 'E15', true, 'Vascongadas / Euskadi (Alava; Guipuzcoa; Vizcaya)', 'ES'),
	(75, 'Ecuador', true, NULL, 'EC'),
	(76, 'ElSalvador', true, NULL, 'SV'),
	(77, 'ezFAEROE', true, NULL, 'FO'),
	(78, 'EzFINLAND', true, NULL, 'FI'),
	(79, 'F', true, 'France', 'FR'),
	(80, 'F/A', true, 'Ile-de-France (Seine; Seine-et-Marne; Yvelines; Essonne; Hauts-de-Seine; Val-de-Marne; Val-d´Oise)', 'FR'),
	(81, 'F/B', true, 'Bourgogne (Côte-d´Or; Nièvre; Saône-et-Loire; Yonne)', 'FR'),
	(82, 'F/C', true, 'Rhône-Alpes (Ain; Ardèche; Drôme; Isère; Loire; Rhône; Savoie; Haute-Savoie)', 'FR'),
	(83, 'F/D', true, 'Provence-Côte d´Azur / Corse (Alpes-de-Haute-Provence; Hautes-Alpes; Alpes-Maritimes; Bouches-du-Rhône; Var; Vaucluse; Corse)', 'FR'),
	(84, 'F/E', true, 'Languedoc-Roussillon (Aude; Gard; Hérault; Lozère; Pyrénées-Orientales)', 'FR'),
	(85, 'F/F', true, 'Midi / Pyrénées (Ariège; Aveyron; Haute-Garonne; Gers; Lot; Hautes-Pyrénées; Tarn; Tarn-et-Garonne)', 'FR'),
	(86, 'F/G', true, 'Aquitaine (Dordogne; Gironde; Landes; Lot-et-Garonne; Pyrénées-Atlantiques)', 'FR'),
	(87, 'F/H', true, 'Bretagne / Poitou-Charentes / Pays-de-la-Loire (Charente; Charente-Maritime; Côtes-d’Armor; Finistère, Ille-et-Vilaine; Loire-Atlantique; Maine-et-Loire; Mayenne, Morbihan; Sarthe; Deux-Sèvres; Vendée; Vienne)', 'FR'),
	(88, 'F/J', true, 'Normandie (Calvados; Eure; Manche; Orne; Seine-Maritime)', 'FR'),
	(89, 'F/K', true, 'Nord / Ardennes / Picardie (Aisne; Ardennes; Aube; Marne; Haute-Marne; Nord; Oise; Pas-de-Calais; Somme)', 'FR'),
	(90, 'F/L', true, 'Lorraine (Meurthe-et-Moselle; Meuse; Moselle; Vosges)', 'FR'),
	(91, 'F/M', true, 'Auvergne / Limousin (Allier; Cantal; Corrèze; Creuse, Haute-Loire; Puy-de-Dôme; Haute-Vienne)', 'FR'),
	(92, 'F/N', true, 'Centre (Cher; Eure-et-Loir; Indre; Indre-et-Loire, Loir-et-Cher; Loiret)', 'FR'),
	(93, 'F/P', true, 'Franche-Comté / Alsace (Doubs; Jura; Bas-Rhin; Haut-Rhin; Haute-Saône; Belfort)', 'FR'),
	(94, 'Falkland', true, NULL, 'FK'),
	(95, 'GR', true, NULL, 'GR'),
	(96, 'GR01', true, 'Sterea Ellas; Peloponnisos; Thessalia; Ipiros', 'GR'),
	(97, 'GR02', true, 'Makedhonia; Thraki', 'GR'),
	(98, 'GR03', true, 'Nissia Egeon; Nissia Ionion', 'GR'),
	(99, 'GR04', true, 'Kriti (Crète / Crete)', 'GR'),
	(100, 'Groenland', true, NULL, 'GL'),
	(101, 'Guinée-équatoriale', true, NULL, 'GQ'),
	(102, 'GuyaneFrançaise', true, NULL, 'GF'),
	(103, 'H', true, 'Hungary', 'HU'),
	(104, 'Hongkong', true, NULL, 'HK'),
	(105, 'Iceland', true, NULL, 'IS'),
	(106, 'Indonesia', true, NULL, 'ID'),
	(107, 'IRL', true, NULL, 'IE'),
	(108, 'IT', true, NULL, 'IT'),
	(109, 'IT01', true, 'Abruzzo e Molise (Aquila; Chieti; Pescara; Teramo; Campobasso)', 'IT'),
	(110, 'IT02', true, 'Basilicata (Matera; Potenza)', 'IT'),
	(111, 'IT03', true, 'Calabria Catanzaro; Cosenza; Reggio di Calabria)', 'IT'),
	(112, 'IT04', true, 'Campania (Avellino; Benevento; Caserta; Napoli; Salerno)', 'IT'),
	(113, 'IT05', true, 'Emilia-Romagna (Bologna; Ferrara; Forlì; Modena; Parma; Piacenza; Ravenna; Reggio-Emilia)', 'IT'),
	(114, 'IT06', true, 'Friuli-Venezia Giulia (Gorizia; Pordenone; Trieste; Udine)', 'IT'),
	(115, 'IT07', true, 'Lazio (Frosinone; Latina; Rieti; Roma; Viterbo)', 'IT'),
	(116, 'IT08', true, 'Liguria (Genova; Imperia; Savona; La Spezia)', 'IT'),
	(117, 'IT09', true, 'Lombardia (Bergamo; Brescia; Como; Cremona; Lecco; Mantova; Milano; Pavia; Sondrio; Varese)', 'IT'),
	(118, 'IT10', true, 'Marche (Ancona; Ascoli Piceno; Macerata; Pesaro)', 'IT'),
	(119, 'IT11', true, 'Piemonte e Val d´Aosta (Alessandria; Asti; Cuneo; Novara; Torino; Vercelli; Aosta)', 'IT'),
	(120, 'IT12', true, 'Puglia (Bari; Brindisi; Foggia; Lecce; Taranto)', 'IT'),
	(121, 'IT13', true, 'Sardegna (Cagliari; Nuoro; Oristano; Sassari)', 'IT'),
	(122, 'IT14', true, 'Sicilia (Agrigento; Caltanissetta; Catania; Enna; Messina; Palermo; Ragusa; Siracusa; Trapani)', 'IT'),
	(123, 'IT15', true, 'Toscana (Arezzo; Firenze; Grosseto; Livorno; Lucca; Massa; Pisa; Pistoia; Siena)', 'IT'),
	(124, 'IT16', true, 'Umbria Perugia; Terni)', 'IT'),
	(125, 'IT17', true, 'Veneto (Belluno; Padova; Rovigo; Treviso; Venezia; Verona; Vicenza)', 'IT'),
	(126, 'IT18', true, 'Trentino-Alto Adige (Bolzano; Trento)', 'IT'),
	(127, 'KoreaNorth', true, NULL, 'KP'),
	(128, 'Koreasouth', true, NULL, 'KR'),
	(129, 'Latvia', true, NULL, 'LV'),
	(130, 'Liban', true, NULL, 'LB'),
	(131, 'Lithuania', true, NULL, 'LT'),
	(132, 'LUX', true, NULL, 'LU'),
	(133, 'NZ', true, NULL, 'NZ'),
	(134, 'POR', true, NULL, 'PT'),
	(135, 'PuertoRico', true, NULL, 'PR'),
	(136, 'Bermuda', true, NULL, 'BM'),
	(137, 'SanMarino', true, NULL, 'SM'),
	(138, 'Andorra', true, NULL, 'AD'),
	(139, 'Angola', true, NULL, 'AO'),
	(140, 'Antarctica', true, NULL, 'AQ'),
	(141, 'Argentina', true, NULL, 'AR'),
	(142, 'Belize', true, NULL, 'BZ'),
	(143, 'Bolivia', true, NULL, 'BO'),
	(144, 'Botswana', true, NULL, 'BW'),
	(145, 'Brunei', true, NULL, 'BN'),
	(146, 'Burundi', true, NULL, 'BI'),
	(147, 'Cuba', true, NULL, 'CU'),
	(148, 'Gabon', true, NULL, 'GA'),
	(149, 'Ghana', true, NULL, 'GH'),
	(150, 'Gibraltar', true, NULL, 'GI'),
	(151, 'Guatemala', true, NULL, 'GT'),
	(152, 'Guyana', true, NULL, 'GY'),
	(153, 'Honduras', true, NULL, 'HN'),
	(154, 'India', true, NULL, 'IN'),
	(155, 'Jamaica', true, NULL, 'JM'),
	(156, 'Lesotho', true, NULL, 'LS'),
	(157, 'Liberia', true, NULL, 'LR'),
	(158, 'Liechtenstein', true, NULL, 'LI'),
	(159, 'Madagascar', true, NULL, 'MG'),
	(160, 'Malawi', true, NULL, 'MW'),
	(161, 'Maldives', true, NULL, 'MV'),
	(162, 'Mali', true, NULL, 'ML'),
	(163, 'Malta', true, NULL, 'MT'),
	(164, 'Maroc', true, NULL, 'MA'),
	(165, 'Myanmar', true, NULL, 'MM'),
	(166, 'Namibia', true, NULL, 'NA'),
	(167, 'Nicaragua', true, NULL, 'NI'),
	(168, 'Niger', true, NULL, 'NE'),
	(169, 'Nigeria', true, NULL, 'NG'),
	(170, 'Pakistan', true, NULL, 'PK'),
	(171, 'Paraguay', true, NULL, 'PY'),
	(172, 'Rwanda', true, NULL, 'RW'),
	(173, 'Seychelles', true, NULL, 'SC'),
	(174, 'Somalia', true, NULL, 'SO'),
	(175, 'Sudan', true, NULL, 'SD'),
	(176, 'Surinam', true, NULL, 'SR'),
	(177, 'Tajikistan', true, NULL, 'TJ'),
	(178, 'Tanzania', true, NULL, 'TZ'),
	(179, 'Togo', true, NULL, 'TG'),
	(180, 'Uruguay', true, NULL, 'UY'),
	(181, 'Venezuela', true, NULL, 'VE'),
	(182, 'SierraLeone', true, NULL, 'SL'),
	(183, 'SK', true, NULL, 'SK'),
	(184, 'SN', true, NULL, 'SI'),
	(185, 'Afghanistan', true, NULL, 'AF'),
	(186, 'Albania', true, NULL, 'AL'),
	(187, 'Armenia', true, NULL, 'AM'),
	(188, 'Azerbaijan', true, NULL, 'AZ'),
	(189, 'Bahrain', true, NULL, 'BH'),
	(190, 'Bangladesh', true, NULL, 'BD'),
	(191, 'Benin', true, NULL, 'BJ'),
	(192, 'Bhutan', true, NULL, 'BT'),
	(193, 'Brazil', true, NULL, 'BR'),
	(194, 'Congo', true, NULL, 'CG'),
	(195, 'Egypt', true, NULL, 'EG'),
	(196, 'Estonia', true, NULL, 'EE'),
	(197, 'Ethiopia', true, NULL, 'ET'),
	(198, 'Gambia', true, NULL, 'GM'),
	(199, 'Georgia', true, NULL, 'GE'),
	(200, 'Guinea', true, NULL, 'GN'),
	(201, 'Guinea-Bissau', true, NULL, 'GW'),
	(202, 'Haiti', true, NULL, 'HT'),
	(203, 'Iran', true, NULL, 'IR'),
	(204, 'Israel', true, NULL, 'IL'),
	(205, 'Japan', true, NULL, 'JP'),
	(206, 'Kazakhstan', true, NULL, 'KZ'),
	(207, 'Kuwait', true, NULL, 'KW'),
	(208, 'Kyrgyzstan', true, NULL, 'KG'),
	(209, 'Macedonia', true, NULL, 'MK'),
	(210, 'Monaco', true, NULL, 'MC'),
	(211, 'Mongolia', true, NULL, 'MN'),
	(212, 'Montenegro', true, NULL, 'ME'),
	(213, 'Nepal', true, NULL, 'NP'),
	(214, 'Oman', true, NULL, 'OM'),
	(215, 'Panama', true, NULL, 'PA'),
	(216, 'Peru', true, NULL, 'PE'),
	(217, 'Philippines', true, NULL, 'PH'),
	(218, 'Qatar', true, NULL, 'QA'),
	(219, 'Senegal', true, NULL, 'SN'),
	(220, 'Thailand', true, NULL, 'TH'),
	(221, 'Turkmenistan', true, NULL, 'TM'),
	(222, 'Uzbekistan', true, NULL, 'UZ'),
	(223, 'Yemen', true, NULL, 'YE'),
	(224, 'Jordania', true, NULL, 'JO'),
	(225, 'Laos', true, NULL, 'LA'),
	(226, 'Singapur', true, NULL, 'SG'),
	(227, 'Vietnam', true, NULL, 'VN'),
	(228, 'Cameroun', true, NULL, 'CM'),
	(229, 'Algérie', true, NULL, 'DZ'),
	(230, 'Erythrée', true, NULL, 'ER'),
	(231, 'Tchad', true, NULL, 'TD'),
	(232, 'Tunisie', true, NULL, 'TN'),
	(233, 'Irak', true, NULL, 'IQ'),
	(234, 'USA', true, NULL, 'US'),
	(235, 'USA01', true, 'Alabama', 'US'),
	(236, 'USA02', true, 'Alaska', 'US'),
	(237, 'USA03', true, 'Arizona', 'US'),
	(238, 'USA04', true, 'Arkansas', 'US'),
	(239, 'USA05', true, 'California', 'US'),
	(240, 'USA06', true, 'Colorado', 'US'),
	(241, 'USA07', true, 'Connecticut; Maine; Massachussetts; New Hampshire; Rhode Island; Vermont (New England)', 'US'),
	(242, 'USA08', true, 'Delaware; Maryland; New Jersey; District of Columbia', 'US'),
	(243, 'USA10', true, 'Florida', 'US'),
	(244, 'USA11', true, 'Georgia', 'US'),
	(245, 'USA12', true, 'Hawaii', 'US'),
	(246, 'USA13', true, 'Idaho', 'US'),
	(247, 'USA14', true, 'Illinois', 'US'),
	(248, 'USA15', true, 'Indiana', 'US'),
	(249, 'USA16', true, 'Iowa', 'US'),
	(250, 'USA17', true, 'Kansas', 'US'),
	(251, 'USA18', true, 'Kentucky', 'US'),
	(252, 'USA19', true, 'Louisiana', 'US'),
	(253, 'USA23', true, 'Michigan', 'US'),
	(254, 'USA24', true, 'Minnesota', 'US'),
	(255, 'USA25', true, 'Mississippi', 'US'),
	(256, 'USA26', true, 'Missouri', 'US'),
	(257, 'USA27', true, 'Montana', 'US'),
	(258, 'USA28', true, 'Nebraska', 'US'),
	(259, 'USA29', true, 'Nevada', 'US'),
	(260, 'USA32', true, 'New Mexico', 'US'),
	(261, 'USA33', true, 'New York', 'US'),
	(262, 'USA34', true, 'North / South Carolina', 'US'),
	(263, 'USA35', true, 'North / South Dakota', 'US'),
	(264, 'USA36', true, 'Ohio', 'US'),
	(265, 'USA37', true, 'Oklahoma', 'US'),
	(266, 'USA38', true, 'Oregon', 'US'),
	(267, 'USA39', true, 'Pennsylvania', 'US'),
	(268, 'USA43', true, 'Tennessee', 'US'),
	(269, 'USA44', true, 'Texas', 'US'),
	(270, 'USA45', true, 'Utah', 'US'),
	(271, 'USA47', true, 'Virginia / West Virginia', 'US'),
	(272, 'USA48', true, 'Washington', 'US'),
	(273, 'USA50', true, 'Wisconsin', 'US'),
	(274, 'USA51', true, 'Wyoming', 'US'),
	(275, 'Madeira', true, NULL, 'PT'),
	(276, 'Malaysia', true, NULL, 'MY'),
	(277, 'Mauritius', true, NULL, 'MU'),
	(278, 'Mexico', true, NULL, 'MX'),
	(279, 'Mexico01', true, 'Chiapas', 'MX'),
	(280, 'Mexico02', true, 'Coahuila', 'MX'),
	(281, 'Mexico03', true, 'Guerrero', 'MX'),
	(282, 'Mexico04', true, 'Jalisco', 'MX'),
	(283, 'Mexico05', true, 'Michoacan', 'MX'),
	(284, 'Mexico06', true, 'Morelos', 'MX'),
	(285, 'Mexico07', true, 'Nuevo León', 'MX'),
	(286, 'Mexico08', true, 'Oaxaca', 'MX'),
	(287, 'Mexico09', true, 'Puebla', 'MX'),
	(288, 'Mexico10', true, 'Querretero', 'MX'),
	(289, 'Mexico11', true, 'San Luis Potosí', 'MX'),
	(290, 'Mexico12', true, 'Tamaulipas', 'MX'),
	(291, 'Mexico13', true, 'Veracruz', 'MX'),
	(292, 'Mexico14', true, 'Yucátan', 'MX'),
	(293, 'NL', true, NULL, 'NL'),
	(294, 'NOR', true, NULL, 'NO'),
	(295, 'Oceania', true, 'South Sea Islands, Pacific, Fidji, Kiribati (Gilbert Islands), Nauru, Nouvelle Calédonie (F), Polynesia, Salomon, Samoa, Tonga, Tuvalu, Vanuatu (Nouvelles Hebrides)', '00'),
	(296, 'OE', true, NULL, 'AT'),
	(297, 'OE01', true, 'Wien; Burgenland', 'AT'),
	(298, 'OE02', true, 'Kärnten; Tirol; Vorarlberg', 'AT'),
	(299, 'OE03', true, 'Niederösterreich', 'AT'),
	(300, 'OE04', true, 'Oberösterreich', 'AT'),
	(301, 'OE05', true, 'Steiermark', 'AT'),
	(302, 'OE06', true, 'Salzburg', 'AT'),
	(303, 'PL', true, NULL, 'PL'),
	(304, 'PNG', true, NULL, 'PG'),
	(305, 'R', true, 'Romania', 'RO'),
	(306, 'Réunion', true, NULL, 'RE'),
	(307, 'RUSS', true, NULL, 'RU'),
	(308, 'RUSS/A', true, 'Autonomous republics; Autonomous regions : European Russia (Russian Plain, Volga Basin; Pinega- Kuloy; Preduralje; South and Central Ural; Baskhiria), Russian Caucasus', 'RU'),
	(309, 'RUSS/B', true, 'Autonomous republics; Autonomous regions : Asiatic Russia, Siberia, Yakutia, Altay; Far East incl. Amur, Primorje, Sakhalin; Kamchatka', 'RU'),
	(310, 'Açores', true, 'Açores', 'PT'),
	(311, 'Cypre', true, 'Chypre', 'CY'),
	(312, 'Andaman', true, NULL, 'IN'),
	(313, 'Ascension', true, 'Ascension Island', 'GB'),
	(314, 'Kenya', true, NULL, 'KE'),
	(315, 'Libya', true, NULL, 'LY'),
	(316, 'Maurethania', true, NULL, 'MR'),
	(317, 'Moçambique', true, NULL, 'MZ'),
	(318, 'Nicobar', true, NULL, 'IN'),
	(319, 'Syria', true, NULL, 'SY'),
	(320, 'Zaire', true, NULL, 'CD'),
	(321, 'Sahara-Ouest', true, 'Sahara', 'MA'),
	(322, 'Saharauique', true, 'Sahara', 'MA'),
	(323, 'SantoDomingo', true, NULL, 'DO'),
	(324, 'SaoTome', true, NULL, 'ST'),
	(325, 'SaudiArabia', true, NULL, 'SA'),
	(326, 'SCH', true, NULL, 'CH'),
	(327, 'SCH/A', true, 'Deutsche Schweiz : Aargau; Appenzell; Basel; Bern; Glarus; Graubünden, Luzern; Unterwalden; St. Gallen; Schaffhausen; Schwyz; Solothurn; Thurgau; Zug; Zürich', 'CH'),
	(328, 'SCH/B', true, 'Suisse romande / Svizzera italiana ; Fribourg; Genève; Jura; Neuchâtel; Valais; Vaud; Ticino', 'CH'),
	(329, 'Serbia01', true, NULL, 'RS'),
	(330, 'Serbia02', true, 'Serbia; Vojvodina', 'RS'),
	(331, 'Serbia03', true, 'Kosovo', 'RS'),
	(332, 'SouthAfrica', true, 'Cape Province; Orange Free State; Transvaal; Natal', 'ZA'),
	(333, 'SriLanka', true, NULL, 'LK'),
	(334, 'StHelena', true, NULL, 'SH'),
	(335, 'Svalbard', true, NULL, 'SJ'),
	(336, 'SW', true, NULL, 'SE'),
	(337, 'Swasiland', true, NULL, 'SZ'),
	(338, 'Taiwan', true, NULL, 'TW'),
	(339, 'TimorEast', true, NULL, 'TL'),
	(340, 'Turquie', true, NULL, 'TR'),
	(341, 'UCRA', true, 'Carpathians, Podolya, Crimea, Donbas, Bukovina p.p.', '00'),
	(342, 'Uganda', true, NULL, 'UG'),
	(343, 'UK', true, NULL, 'GB'),
	(344, 'UK01', true, 'England (Southern England (Devonshire, Somersetshire, Kent, Cornwall, etc.), Middle England (Derbyshire, Essex, Lincolnshire, etc.), Northern England (Lancashire, Yorkshire, Westmoreland, Cumberland, etc.), Isle of Man and Channels islands)', 'GB'),
	(345, 'UK02', true, 'Wales (Anglesey, etc).', 'GB'),
	(346, 'UK03', true, 'Scotland (Berwick, Perth, Sutherland, etc.)', 'GB'),
	(347, 'UK04', true, 'Northern Ireland (Fermanagh, Antrim, etc.)', 'GB'),
	(348, 'YU', true, 'Yougoslavie', '00'),
	(349, 'YU04', true, 'General / Généralités', '00'),
	(350, 'YU05', true, 'General / Généralités', '00'),
	(351, 'Zanzibar', true, NULL, '00'),
	(352, 'Zimbabwe', true, NULL, 'ZW'),
	(353, 'Zambia', true, NULL, 'ZM'),
	(355, '--', false, 'the whole country', 'BN'),
	(356, '--', false, 'the whole country', 'BO'),
	(357, '--', false, 'the whole country', 'BR'),
	(358, '--', false, 'the whole country', 'BS'),
	(359, '--', false, 'the whole country', 'BT'),
	(360, '--', false, 'the whole country', 'BW'),
	(361, '--', false, 'the whole country', 'BY'),
	(362, '--', false, 'the whole country', 'BZ'),
	(363, '--', false, 'the whole country', 'CA'),
	(364, '--', false, 'the whole country', 'CD'),
	(365, '--', false, 'the whole country', 'CF'),
	(366, '--', false, 'the whole country', 'CG'),
	(367, '--', false, 'the whole country', 'CH'),
	(368, '--', false, 'the whole country', 'CI'),
	(369, '--', false, 'the whole country', 'CK'),
	(370, '--', false, 'the whole country', 'CL'),
	(371, '--', false, 'the whole country', 'CM'),
	(372, '--', false, 'the whole country', 'CN'),
	(373, '--', false, 'the whole country', 'CO'),
	(374, '--', false, 'the whole country', 'CR'),
	(375, '--', false, 'the whole country', 'CU'),
	(376, '--', false, 'the whole country', 'CV'),
	(377, '--', false, 'the whole country', 'CY'),
	(378, '--', false, 'the whole country', 'CZ'),
	(379, '--', false, 'the whole country', 'DE'),
	(380, '--', false, 'the whole country', 'DJ'),
	(381, '--', false, 'the whole country', 'DK'),
	(382, '--', false, 'the whole country', 'DM'),
	(383, '--', false, 'the whole country', 'DO'),
	(384, '--', false, 'the whole country', 'DZ'),
	(385, '--', false, 'the whole country', 'EC'),
	(386, '--', false, 'the whole country', 'EE'),
	(387, '--', false, 'the whole country', 'EG'),
	(388, '--', false, 'the whole country', 'ER'),
	(389, '--', false, 'the whole country', 'ES'),
	(390, '--', false, 'the whole country', 'ET'),
	(391, '--', false, 'the whole country', 'FI'),
	(392, '--', false, 'the whole country', 'FJ'),
	(393, '--', false, 'the whole country', 'FM'),
	(394, '--', false, 'the whole country', 'FR'),
	(395, '--', false, 'the whole country', 'GA'),
	(396, '--', false, 'the whole country', 'GB'),
	(397, '--', false, 'the whole country', 'GD'),
	(398, '--', false, 'the whole country', 'GE'),
	(399, '--', false, 'the whole country', 'GH'),
	(400, '--', false, 'the whole country', 'GM'),
	(401, '--', false, 'the whole country', 'GN'),
	(402, '--', false, 'the whole country', 'SV'),
	(403, '--', false, 'the whole country', 'GQ'),
	(404, '--', false, 'the whole country', 'GR'),
	(405, '--', false, 'the whole country', 'GT'),
	(406, '--', false, 'the whole country', 'GW'),
	(407, '--', false, 'the whole country', 'GY'),
	(408, '--', false, 'the whole country', 'HN'),
	(409, '--', false, 'the whole country', 'HR'),
	(410, '--', false, 'the whole country', 'HT'),
	(411, '--', false, 'the whole country', 'HU'),
	(412, '--', false, 'the whole country', 'ID'),
	(413, '--', false, 'the whole country', 'IE'),
	(414, '--', false, 'the whole country', 'IL'),
	(415, '--', false, 'the whole country', 'IN'),
	(416, '--', false, 'the whole country', 'IQ'),
	(417, '--', false, 'the whole country', 'IR'),
	(418, '--', false, 'the whole country', 'IS'),
	(419, '--', false, 'the whole country', 'IT'),
	(420, '--', false, 'the whole country', 'JM'),
	(421, '--', false, 'the whole country', 'JO'),
	(422, '--', false, 'the whole country', 'JP'),
	(423, '--', false, 'the whole country', 'KE'),
	(424, '--', false, 'the whole country', 'KG'),
	(425, '--', false, 'the whole country', 'KH'),
	(426, '--', false, 'the whole country', 'KI'),
	(427, '--', false, 'the whole country', 'KM'),
	(428, '--', false, 'the whole country', 'KN'),
	(429, '--', false, 'the whole country', 'KP'),
	(430, '--', false, 'the whole country', 'PY'),
	(431, '--', false, 'the whole country', 'KR'),
	(432, '--', false, 'the whole country', 'KW'),
	(433, '--', false, 'the whole country', 'KZ'),
	(434, '--', false, 'the whole country', 'LB'),
	(435, '--', false, 'the whole country', 'LC'),
	(436, '--', false, 'the whole country', 'LI'),
	(437, '--', false, 'the whole country', 'LK'),
	(438, '--', false, 'the whole country', 'LR'),
	(439, '--', false, 'the whole country', 'LS'),
	(440, '--', false, 'the whole country', 'LT'),
	(441, '--', false, 'the whole country', 'LU'),
	(442, '--', false, 'the whole country', 'LV'),
	(443, '--', false, 'the whole country', 'LY'),
	(444, '--', false, 'the whole country', 'MA'),
	(445, '--', false, 'the whole country', 'MC'),
	(446, '--', false, 'the whole country', 'MD'),
	(447, '--', false, 'the whole country', 'LA'),
	(448, '--', false, 'the whole country', 'ME'),
	(449, '--', false, 'the whole country', 'MG'),
	(450, '--', false, 'the whole country', 'MH'),
	(451, '--', false, 'the whole country', 'MK'),
	(452, '--', false, 'the whole country', 'ML'),
	(453, '--', false, 'the whole country', 'MM'),
	(454, '--', false, 'the whole country', 'MN'),
	(455, '--', false, 'the whole country', 'MR'),
	(456, '--', false, 'the whole country', 'MT'),
	(457, '--', false, 'the whole country', 'MU'),
	(458, '--', false, 'the whole country', 'MV'),
	(459, '--', false, 'the whole country', 'MW'),
	(460, '--', false, 'the whole country', 'MX'),
	(461, '--', false, 'the whole country', 'MY'),
	(462, '--', false, 'the whole country', 'MZ'),
	(463, '--', false, 'the whole country', 'NA'),
	(464, '--', false, 'the whole country', 'NE'),
	(465, '--', false, 'the whole country', 'NG'),
	(466, '--', false, 'the whole country', 'NI'),
	(467, '--', false, 'the whole country', 'NL'),
	(468, '--', false, 'the whole country', 'NO'),
	(469, '--', false, 'the whole country', 'NP'),
	(470, '--', false, 'the whole country', 'NR'),
	(471, '--', false, 'the whole country', 'NZ'),
	(472, '--', false, 'the whole country', 'OM'),
	(473, '--', false, 'the whole country', 'PA'),
	(474, '--', false, 'the whole country', 'PE'),
	(475, '--', false, 'the whole country', 'PG'),
	(476, '--', false, 'the whole country', 'PH'),
	(477, '--', false, 'the whole country', 'PK'),
	(478, '--', false, 'the whole country', 'PL'),
	(479, '--', false, 'the whole country', 'PS'),
	(480, '--', false, 'the whole country', 'PT'),
	(481, '--', false, 'the whole country', 'PW'),
	(482, '--', false, 'the whole country', 'QA'),
	(483, '--', false, 'the whole country', 'RO'),
	(484, '--', false, 'the whole country', 'RS'),
	(485, '--', false, 'the whole country', 'RU'),
	(486, '--', false, 'the whole country', 'RW'),
	(487, '--', false, 'the whole country', 'SA'),
	(488, '--', false, 'the whole country', 'SB'),
	(489, '--', false, 'the whole country', 'SC'),
	(490, '--', false, 'the whole country', 'SD'),
	(491, '--', false, 'the whole country', 'SE'),
	(492, '--', false, 'the whole country', 'SG'),
	(493, '--', false, 'the whole country', 'SI'),
	(494, '--', false, 'the whole country', 'SK'),
	(495, '--', false, 'the whole country', 'SL'),
	(496, '--', false, 'the whole country', 'SM'),
	(497, '--', false, 'the whole country', 'SN'),
	(498, '--', false, 'the whole country', 'SO'),
	(499, '--', false, 'the whole country', 'SR'),
	(500, '--', false, 'the whole country', 'ST'),
	(501, '--', false, 'the whole country', 'SY'),
	(502, '--', false, 'the whole country', 'SZ'),
	(503, '--', false, 'the whole country', 'TD'),
	(504, '--', false, 'the whole country', 'TG'),
	(505, '--', false, 'the whole country', 'TH'),
	(506, '--', false, 'the whole country', 'TJ'),
	(507, '--', false, 'the whole country', 'TL'),
	(508, '--', false, 'the whole country', 'TM'),
	(509, '--', false, 'the whole country', 'TN'),
	(510, '--', false, 'the whole country', 'TO'),
	(511, '--', false, 'the whole country', 'TR'),
	(512, '--', false, 'the whole country', 'TT'),
	(513, '--', false, 'the whole country', 'TV'),
	(514, '--', false, 'the whole country', 'TZ'),
	(515, '--', false, 'the whole country', 'UA'),
	(516, '--', false, 'the whole country', 'UG'),
	(517, '--', false, 'the whole country', 'US'),
	(518, '--', false, 'the whole country', 'UY'),
	(519, '--', false, 'the whole country', 'UZ'),
	(520, '--', false, 'the whole country', 'VA'),
	(521, '--', false, 'the whole country', 'VC'),
	(522, '--', false, 'the whole country', 'VE'),
	(523, '--', false, 'the whole country', 'VN'),
	(524, '--', false, 'the whole country', 'VU'),
	(525, '--', false, 'the whole country', 'WS'),
	(526, '--', false, 'the whole country', 'YE'),
	(527, '--', false, 'the whole country', 'ZA'),
	(528, '--', false, 'the whole country', 'ZM'),
	(529, '--', false, 'the whole country', 'ZW'),
	(530, '--', false, 'the whole country', 'AS'),
	(531, '--', false, 'the whole country', 'AI'),
	(532, '--', false, 'the whole country', 'AW'),
	(533, '--', false, 'the whole country', 'BM'),
	(534, '--', false, 'the whole country', 'BV'),
	(535, '--', false, 'the whole country', 'IO'),
	(536, '--', false, 'the whole country', 'KY'),
	(537, '--', false, 'the whole country', 'CX'),
	(538, '--', false, 'the whole country', 'CC'),
	(539, '--', false, 'the whole country', 'FK'),
	(540, '--', false, 'the whole country', 'FO'),
	(541, '--', false, 'the whole country', 'GF'),
	(542, '--', false, 'the whole country', 'PF'),
	(543, '--', false, 'the whole country', 'TF'),
	(544, '--', false, 'the whole country', 'GI'),
	(545, '--', false, 'the whole country', 'GL'),
	(546, '--', false, 'the whole country', 'GP'),
	(547, '--', false, 'the whole country', 'GU'),
	(548, '--', false, 'the whole country', 'GG'),
	(549, '--', false, 'the whole country', 'HM'),
	(550, '--', false, 'the whole country', 'AD'),
	(551, '--', false, 'the whole country', 'AE'),
	(552, '--', false, 'the whole country', 'AF'),
	(553, '--', false, 'the whole country', 'AG'),
	(554, '--', false, 'the whole country', 'AL'),
	(555, '--', false, 'the whole country', 'AM'),
	(556, '--', false, 'the whole country', 'AO'),
	(557, '--', false, 'the whole country', 'AQ'),
	(558, '--', false, 'the whole country', 'AR'),
	(559, '--', false, 'the whole country', 'AT'),
	(560, '--', false, 'the whole country', 'AU'),
	(561, '--', false, 'the whole country', 'AZ'),
	(562, '--', false, 'the whole country', 'BA'),
	(563, '--', false, 'the whole country', 'BB'),
	(564, '--', false, 'the whole country', 'BD'),
	(565, '--', false, 'the whole country', 'BE'),
	(566, '--', false, 'the whole country', 'BF'),
	(567, '--', false, 'the whole country', 'BG'),
	(568, '--', false, 'the whole country', 'BH'),
	(569, '--', false, 'the whole country', 'BI'),
	(570, '--', false, 'the whole country', 'BJ'),
	(571, '--', false, 'the whole country', 'HK'),
	(572, '--', false, 'the whole country', 'IM'),
	(573, '--', false, 'the whole country', 'JE'),
	(574, '--', false, 'the whole country', 'AX'),
	(575, '--', false, 'the whole country', 'MO'),
	(576, '--', false, 'the whole country', 'MQ'),
	(577, '--', false, 'the whole country', 'YT'),
	(578, '--', false, 'the whole country', 'MS'),
	(579, '--', false, 'the whole country', 'AN'),
	(580, '--', false, 'the whole country', 'NC'),
	(581, '--', false, 'the whole country', 'NU'),
	(582, '--', false, 'the whole country', 'NF'),
	(583, '--', false, 'the whole country', 'MP'),
	(584, '--', false, 'the whole country', 'PN'),
	(585, '--', false, 'the whole country', 'PR'),
	(586, '--', false, 'the whole country', 'RE'),
	(587, '--', false, 'the whole country', 'SH'),
	(588, '--', false, 'the whole country', 'PM'),
	(589, '--', false, 'the whole country', 'GS'),
	(590, '--', false, 'the whole country', 'SJ'),
	(591, '--', false, 'the whole country', 'TW'),
	(592, '--', false, 'the whole country', 'TK'),
	(593, '--', false, 'the whole country', 'TC'),
	(594, '--', false, 'the whole country', 'UM'),
	(595, '--', false, 'the whole country', 'VG'),
	(596, '--', false, 'the whole country', 'VI'),
	(597, '--', false, 'the whole country', 'WF'),
	(598, '--', false, 'the whole country', 'EH'),
	(599, '--', false, 'the whole country', 'BL'),
	(600, '--', false, 'the whole country', 'MF'),
	(601, '--', false, 'the whole country', 'SS'),
	(602, '--', false, 'the whole country', 'CW');
