\c grottoce;

INSERT INTO t_type (id,"name","comment",id_parent,is_available,url) VALUES
	 (1,'Collection','An aggregation of resources',NULL,true, 'http://purl.org/dc/dcmitype/Collection'),
	 (2,'Dataset','Data encoded in a defined structure',NULL,true,'http://purl.org/dc/dcmitype/Dataset'),
	 (3,'Event','A non-persistent, time-based occurrence',NULL,true,'http://purl.org/dc/dcmitype/Event'),
	 (4,'Image','A visual representation other than text',NULL,true,'http://purl.org/dc/dcmitype/Image'),
	 (5,'Interactive Resource','A resource requiring interaction from the user to be understood, executed, or experienced',NULL,true,'http://purl.org/dc/dcmitype/InteractiveResource'),
	 (6,'Moving Image','A serie of visual representations imparting an impression of motion when shown in succession',NULL,true,'http://purl.org/dc/dcmitype/MovingImage'),
	 (7,'Physical Object','An inanimate, three-dimensional object or substance',NULL,true,'http://purl.org/dc/dcmitype/PhysicalObject'),
	 (8,'Service','A system that provides one or more functions',NULL,true,'http://purl.org/dc/dcmitype/Service'),
	 (9,'Software','A computer program in source or compiled form',NULL,true,'http://purl.org/dc/dcmitype/Software'),
	 (10,'Sound','A resource primarily intended to be heard',NULL,true,'http://purl.org/dc/dcmitype/Sound'),
	 (11,'Still Image','A static visual representation including paintings, drawings, graphic designs, plans and maps',4,false,'http://purl.org/dc/dcmitype/StillImage'),
	 (12,'Text','A resource consisting primarily of words for reading',NULL,true,'http://purl.org/dc/dcmitype/Text'),
	 (13,'Topographic Drawing','A visual representation of a topography',11,true,'https://ontology.uis-speleo.org/ontology/#topography'),
	 (14,'Topographic Data','Topographic data encoded in a defined structure',2,true,'https://ontology.uis-speleo.org/ontology/#topographicData'),
	 (16,'Book','A book',12,true,'http://id.loc.gov/vocabulary/marcgt/boo'),
	 (17,'Issue','An issue of a periodic publication',12,true,'http://id.loc.gov/vocabulary/marcgt/iss'),
	 (18,'Article','An article from a source',12,true,'http://id.loc.gov/vocabulary/marcgt/art'),
	 (19,'Map','A geographical map',11,true,'http://id.loc.gov/vocabulary/marcgt/map'),
	 (20,'Authorization To Publish','Document attesting to the authorization to publish other documents under a defined licence',NULL,true,'https://ontology.uis-speleo.org/ontology/#AutorizationToPublish'),
	 (21,'Report','Proceedings, reports or summaries of a conference, study, expedition',NULL,true,'http://id.loc.gov/vocabulary/marcgt/cpb');
