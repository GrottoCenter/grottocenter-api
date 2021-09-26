\c grottoce;

INSERT INTO t_type (id,"name","comment",id_parent,is_available,url) VALUES
	 (1,'Collection','An aggregation of resources',NULL,true, 'http://purl.org/dc/dcmitype/Collection'),
	 (2,'Dataset','Data encoded in a defined structure',NULL,false,'http://purl.org/dc/dcmitype/Dataset'),
	 (3,'Event','A non-persistent, time-based occurrence',NULL,false,'http://purl.org/dc/dcmitype/Event'),
	 (4,'Image','A visual representation other than text',NULL,true,'http://purl.org/dc/dcmitype/Image'),
	 (5,'InteractiveResource','A resource requiring interaction from the user to be understood, executed, or experienced',NULL,false,'http://purl.org/dc/dcmitype/InteractiveResource'),
	 (6,'MovingImage','A series of visual representations imparting an impression of motion when shown in succession',NULL,false,'http://purl.org/dc/dcmitype/MovingImage'),
	 (7,'PhysicalObject','An inanimate, three-dimensional object or substance',NULL,false,'http://purl.org/dc/dcmitype/PhysicalObject'),
	 (8,'Service','A system that provides one or more functions',NULL,false,'http://purl.org/dc/dcmitype/Service'),
	 (9,'Software','A computer program in source or compiled form',NULL,false,'http://purl.org/dc/dcmitype/Software'),
	 (10,'Sound','A resource primarily intended to be heard',NULL,false,'http://purl.org/dc/dcmitype/Sound'),
	 (11,'StillImage','A static visual representation including paintings, drawings, graphic designs, plans and maps',4,false,'http://purl.org/dc/dcmitype/StillImage'),
	 (12,'Text','A resource consisting primarily of words for reading',NULL,true,'http://purl.org/dc/dcmitype/Text'),
	 (13,'TopographicDrawing','A visual representation of a topography',11,false,'https://ontology.uis-speleo.org/ontology/#topography'),
	 (14,'TopographicData','Topographic data encoded in a defined structure',2,true,'https://ontology.uis-speleo.org/ontology/#topographicData'),
	 (16,'Book','A book',12,false,'http://id.loc.gov/vocabulary/marcgt/boo'),
	 (17,'Issue','An issue of a periodic publication',12,true,'http://id.loc.gov/vocabulary/marcgt/iss'),
	 (18,'Article','An article from a source',12,true,'http://id.loc.gov/vocabulary/marcgt/art'),
	 (19,'Map','A geographical map',11,false,'http://id.loc.gov/vocabulary/marcgt/map');