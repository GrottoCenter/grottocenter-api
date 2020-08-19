ALTER TABLE t_entry ADD Quality int(5) DEFAULT NULL;
DROP TEMPORARY TABLE IF EXISTS temp_entry_quality;
CREATE TEMPORARY TABLE IF NOT EXISTS temp_entry_quality 
        SELECT t_entry.Id AS id, t_cave.Length AS c_length, t_cave.Depth AS c_depth, t_single_entry.Length AS se_length, t_single_entry.Depth AS se_depth
			FROM t_entry
			LEFT JOIN t_cave ON t_cave.Id = t_entry.Id_cave
			LEFT JOIN t_single_entry ON t_single_entry.Id = t_entry.Id
			GROUP BY t_entry.Id, t_cave.Length, t_cave.Depth, t_single_entry.Length, t_single_entry.Depth;

DROP PROCEDURE IF EXISTS populate_quality;
DELIMITER $$
CREATE PROCEDURE populate_quality()
   BEGIN
		DECLARE done INT DEFAULT FALSE;
        DECLARE id_entry, cave_length, cave_depth, single_entry_length, single_entry_depth INT;
        DECLARE quality_entry INT;

		DECLARE entry_cursor CURSOR FOR
			SELECT *
            FROM temp_entry_quality;

        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        OPEN entry_cursor;

        loop_entry: LOOP

			FETCH entry_cursor INTO id_entry, cave_length, cave_depth, single_entry_length, single_entry_depth;

			IF done THEN
				LEAVE loop_entry;
			END IF;
            SET quality_entry = 0;

            IF cave_depth IS NOT NULL THEN
				IF (cave_depth > 19 AND cave_depth <= 200) THEN SET quality_entry = quality_entry + 4;
                ELSEIF (cave_depth > 200) THEN SET quality_entry = quality_entry + 5;
				END IF;
			ELSE
				IF single_entry_depth IS NOT NULL THEN
					IF (single_entry_depth > 19 AND single_entry_depth <= 200) THEN SET quality_entry = quality_entry + 4;
					ELSEIF (single_entry_depth > 200) THEN SET quality_entry = quality_entry + 5;
					END IF;
				END IF;
			END IF;



			IF cave_length IS NOT NULL THEN
				IF (cave_length > 19 AND cave_length <= 200) THEN SET quality_entry = quality_entry + 1;
				ELSEIF (cave_length > 200  AND cave_length <= 500) THEN SET quality_entry = quality_entry + 2;
				ELSEIF (cave_length > 500  AND cave_length <= 5000) THEN SET quality_entry = quality_entry + 4;
				ELSEIF (cave_length > 5000) THEN SET quality_entry = quality_entry + 5;
				END IF;
			ELSE
				IF single_entry_length IS NOT NULL THEN
					IF (single_entry_length > 19 AND single_entry_length <= 200) THEN SET quality_entry = quality_entry + 1;
					ELSEIF (single_entry_length > 200  AND single_entry_length <= 500) THEN SET quality_entry = quality_entry + 2;
					ELSEIF (single_entry_length > 500  AND single_entry_length <= 5000) THEN SET quality_entry = quality_entry + 4;
					ELSEIF (single_entry_length > 5000) THEN SET quality_entry = quality_entry + 5;
					END IF;
				END IF;
			END IF;
            
            UPDATE t_entry SET t_entry.Quality = quality_entry WHERE t_entry.Id = id_entry;
        END LOOP loop_entry;
        CLOSE entry_cursor;
        DROP TEMPORARY TABLE IF EXISTS temp_entry_quality;
        
	END$$
 DELIMITER ;
 
 
CALL populate_quality();
