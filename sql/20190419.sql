ALTER TABLE t_entry ADD Quality int(5) DEFAULT NULL;
DROP TEMPORARY TABLE IF EXISTS temp_entry_quality;
CREATE TEMPORARY TABLE IF NOT EXISTS temp_entry_quality 
        SELECT t_entry.Id, t_cave.Length, COUNT(j_topo_file.Id_file), COUNT(t_location.Id), count(j_entry_description.Id_description)
			FROM t_entry
			LEFT JOIN t_cave ON t_cave.Id = t_entry.Id_cave
			LEFT JOIN j_topo_entry ON j_topo_entry.id_entry = t_entry.Id
			LEFT JOIN j_topo_file ON j_topo_file.Id_topography = j_topo_entry.id_topography
			LEFT JOIN t_location ON t_location.Id_entry = t_entry.Id
			LEFT JOIN j_entry_description ON j_entry_description.Id_entry = t_entry.Id
			GROUP BY t_entry.Id, t_cave.Length;

DROP PROCEDURE IF EXISTS populate_quality;
DELIMITER $$
CREATE PROCEDURE populate_quality()
   BEGIN        
		DECLARE done INT DEFAULT FALSE;
        DECLARE id_entry, cave_length, nb_file, nb_location, nb_description INT; 
        DECLARE quality_entry INT;
   
		DECLARE entry_cursor CURSOR FOR 
			SELECT *
            FROM temp_entry_quality;
         
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        OPEN entry_cursor;
        
        loop_entry: LOOP
        
			FETCH entry_cursor INTO id_entry, cave_length, nb_file, nb_location, nb_description;
			
			IF done THEN
				LEAVE loop_entry;
			END IF;
            SET quality_entry = 0;
			
            IF cave_length IS NOT NULL THEN
				IF (cave_length > 50 AND cave_length <= 200) THEN SET quality_entry = quality_entry + 1;
				ELSEIF (cave_length > 200  AND cave_length <= 500) THEN SET quality_entry = quality_entry + 2;
				ELSEIF (cave_length > 500  AND cave_length <= 1000) THEN SET quality_entry = quality_entry + 3;
				ELSEIF (cave_length > 1000  AND cave_length <= 10000) THEN SET quality_entry = quality_entry + 4;
				ELSEIF (cave_length > 10000) THEN SET quality_entry = quality_entry + 5;
				END IF;
			END IF;
            
            IF (nb_file > 0) THEN
				SET quality_entry = quality_entry + 2;
            END IF;
            
            IF (nb_location > 0) THEN
				SET quality_entry = quality_entry + 1;
            END IF;
            
            IF (nb_description > 0) THEN
				SET quality_entry = quality_entry + 1;
            END IF;
            
            UPDATE t_entry SET t_entry.Quality = quality_entry WHERE t_entry.Id = id_entry;
        END LOOP loop_entry;
        CLOSE entry_cursor;
        DROP TEMPORARY TABLE IF EXISTS temp_entry_quality;
        
	END$$
 DELIMITER ;
 
 
CALL populate_quality();