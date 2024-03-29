\c grottoce;

INSERT INTO t_subject (code, subject, code_parent) VALUES
	('1.0  ', 'Geospeleology and Karstology', NULL),
	('1.11 ', 'KARST MORPHOLOGY AND MORPHOGENESIS : Exokarst of carbonatic rocks (limestones, dolomites, chalk, marbles), Geochemistry; Soil - CO2; Corrosion; Karst types (holo-, mero-, fluvio-, glacio-, volcano- karst; Tropical karst)', '1.0  '),
	('1.12 ', 'HYDROLOGY : Water chemistry and physics; Springs and sinks; Karstic groundwater; Water tracings, hydrogeology', '1.0  '),
	('1.13 ', 'GEOLOGY AND PEDOLOGY : Petrography; Tectonics; Bauxite; Glaciations', '1.0  '),
	('1.14 ', 'CLIMATOLOGY AND BIOLOGY OF KARST REGIONS', '1.0  '),
	('1.15 ', 'FOSSIL KARST : Paleokarst; Karstic fillings; Paleogeography', '1.0  '),
	('1.16 ', 'HYDROTHERMAL KARST', '1.0  '),
	('1.21 ', 'MORPHOLOGY AND SPELEOGENESIS IN CARBONATIC ROCKS : Caves, potholes; Corrosion and erosion; Small and large hollow forms; Sumps', '1.0  '),
	('1.22 ', 'PARA-, PSEUDO- AND HYPOKARST', '1.0  '),
	('1.23 ', 'SUBTERRANEAN DEPOSITS AND FILLINGS : Chemistry and mineralogy; Sinter morphology; Clay and alluvial sediments; Collapses', '1.0  '),
	('1.24 ', 'SUBTERRANEAN CLIMATOLOGY : Temperature, Hygrometry, Winds, Air-CO2; Dripping and condensation waters, Ice', '1.0  '),
	('1.25 ', 'GEOPHYSICS : Radioactivity; Seismology; Geothermalism; Volcanism', '1.0  '),
	('1.26 ', 'CHRONOLOGY OF SUBTERRANEAN FILLINGS : Stratigraphy; Datings; Palynology; Paleoenvironment', '1.0  '),
	('1.3  ', 'SPECIAL KARSTS : Conglomerates; Magnesite; Travertine; Tufa ; Calcarenite; Corals; Chalk; Calcareous flysch', '1.0  '),
	('1.4  ', 'PARAKARST IN EVAPORITES : Gypsum, halides', '1.0  '),
	('1.5  ', 'PARAKARST IN SILICEOUS ROCKS : Quartzite; Sandstones; Flysch; Loess; Marles; Piping in alluvial material', '1.0  '),
	('1.6  ', 'PSEUDOKARST : Granites, Gneiss; Talus-caves', '1.0  '),
	('1.7  ', 'ICE HYPOKARST; PERMAFROST- AND THERMOKARST', '1.0  '),
	('1.8  ', 'HYPO- AND PSEUDOKARST IN VOLCANIC ROCKS : Lavas, basalt', '1.0  '),
	('2.0  ', 'Regional speleology', NULL),
	('2.11 ', 'WESTERN & CENTRAL EUROPE', '2.0  '),
	('2.12 ', 'EASTERN EUROPE', '2.0  '),
	('2.21 ', 'NORTHERN AMERICA', '2.0  '),
	('2.22 ', 'CENTRAL AND SOUTHERN AMERICA', '2.0  '),
	('2.3  ', 'ASIA', '2.0  '),
	('2.4  ', 'AFRICA', '2.0  '),
	('2.5  ', 'AUSTRALASIA, OCEANIA', '2.0  '),
	('2.6  ', 'COSMOS', '2.0  '),
	('3.0  ', 'Biospeleology', NULL),
	('3.11 ', 'CRUSTACEA', '3.0  '),
	('3.12 ', 'HEXAPODA', '3.0  '),
	('3.13 ', 'ARACHNIDA, PALPIGRADA, PSEUDOSCORPIONES, MYRIAPODA, ONYCHOPHORA', '3.0  '),
	('3.14 ', 'MOLLUSCA, VERMES, OTHER INVERTEBRATA', '3.0  '),
	('3.15 ', 'VERTEBRATA', '3.0  '),
	('3.16 ', 'MICROBIOLOGY SOIL- AIR- WATER', '3.0  '),
	('3.17 ', 'HYPOGEAN FLORA, FUNGI, ALGAE', '3.0  '),
	('3.2  ', 'GENERAL BIOLOGY', '3.0  '),
	('3.31 ', 'EUROPE', '3.0  '),
	('3.32 ', 'AMERICA', '3.0  '),
	('3.33 ', 'ASIA', '3.0  '),
	('3.34 ', 'AFRICA', '3.0  '),
	('3.35 ', 'AUSTRALASIA, OCEANIA', '3.0  '),
	('4.0  ', 'Anthropospeleology', NULL),
	('4.1  ', 'ARCHAEOLOGY; PREHISTORICAL AND HISTORICAL CULTURES', '4.0  '),
	('4.11 ', 'EUROPE', '4.1  '),
	('4.12 ', 'AMERICA', '4.1  '),
	('4.13 ', 'ASIA', '4.1  '),
	('4.14 ', 'AFRICA', '4.1  '),
	('4.15 ', 'AUSTRALASIA, OCEANIA', '4.1  '),
	('4.2  ', 'HISTORY OF SPELEOLOGY', '4.0  '),
	('4.3  ', 'PERSONALIA', '4.0  '),
	('4.4  ', 'VARIA : Fine arts; comics etc', '4.0  '),
	('5.0  ', 'Paleontospeleology', NULL),
	('5.1  ', 'FOSSIL AND SUBFOSSIL FAUNAS AND FLORAS (QUATERNARY) :', '5.0  '),
	('5.11 ', 'EUROPE', '5.1  '),
	('5.12 ', 'AMERICA', '5.1  '),
	('5.13 ', 'ASIA', '5.1  '),
	('5.14 ', 'AFRICA', '5.1  '),
	('5.15 ', 'Other', '5.1  '),
	('5.2  ', 'FOSSIL AND SUBFOSSIL FAUNAS AND FLORAS (QUATERNARY) : VARIA', '5.0  '),
	('6.0  ', 'Applied speleology', NULL),
	('6.1  ', 'ENVIRONMENT and HYGIENE : Drinking waters; Pollution; Cleaning. Geosystem', '6.0  '),
	('6.2  ', 'MINES, ENGINEERING : Use of artificial and natural cavities, poljes and hydraulic power, irrigations. Flood and collapse control. Urban and mine speleology', '6.0  '),
	('6.3  ', 'LAW, PROTECTION : Legislation, protection, vandalism, access restrictions. Ownership', '6.0  '),
	('6.4  ', 'RECREATION, TOURISM, GEOSYSTEM : Biogeography, Planning, Agriculture, Demography, Parks; Show caves and management. Anthropogenic impacts', '6.0  '),
	('6.5  ', 'SUBTERRANEAN THERAPY', '6.0  '),
	('6.6  ', 'RESEARCH MANAGEMENT : Research centres, Subterranean laboratories, Museums', '6.0  '),
	('6.7  ', 'VARIA : Collectables : Philately, Badges, Postcards etc.', '6.0  '),
	('7.0  ', 'Technical speleology', NULL),
	('7.1  ', 'EXPLORATION TECHNIQUES AND MATERIALS : Personal equipement, Exploration techniques, explosives, logistics', '7.0  '),
	('7.2  ', 'DIVING : Techniques and material', '7.0  '),
	('7.3  ', 'PROSPECTION : Geophysical, chemical, mathematical methods; Photogrammetry', '7.0  '),
	('7.4  ', 'ACCIDENTS AND RESCUE : Techniques and material including dive accidents. Accident reports and analysis. Rescue exercises', '7.0  '),
	('7.5  ', 'MEDICINE : Human physiology and psychology, sociology, nutrition. Subterranean therapy', '7.0  '),
	('7.6  ', 'ENSEIGNEMENT EDUCATION : Caving schools. Training exercises. Didactics. Ethics. Teaching. Exhibitions', '7.0  '),
	('7.7  ', 'ACTIVITIES', '7.0  '),
	('8.0  ', 'Documentary speleology', NULL),
	('8.1  ', 'TOPOGRAPHY : Methods and material for subterranean surveying and cartography. Computer assisted mapping', '8.0  '),
	('8.2  ', 'TERMINOLOGY, TOPONYMY : Glossaries. Multilingual terminology list. Naming practice', '8.0  '),
	('8.3  ', 'BIBLIOGRAPHY : General Bibliographic documentation. Indexes of periodca. Libraries. Catalogues. Documentation by informatics. Regional, scientific, technical bibliographies', '8.0  '),
	('8.41 ', 'PHOTOGRAPHIC METHODS AND MATERIALS', '8.0  '),
	('8.42 ', 'FILMS AND AUDIO-VISUAL DEVICES', '8.0  '),
	('8.5  ', 'GENERAL WORKS : Speleological books, Popular works', '8.0  '),
	('8.6  ', 'INVENTORIES, SURVEYS, MAPS : Cave cadastres and records. Geomorphological maps of karst forms, Computer assisted databases. Identification systems', '8.0  '),
	('9.0  ', 'No speleo', NULL),
	('9.1  ', 'canyon', '9.0  ');
