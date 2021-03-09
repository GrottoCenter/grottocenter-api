-- This SQL requests aim to remove the trailing ";" in the t_bbs authors column.

SET SQL_SAFE_UPDATES=0; -- Needed for Cloud SQL

--
-- Remove everything after "; ;"
-- 
UPDATE t_bbs SET cAuthorsFull = SUBSTR(cAuthorsFull, 1, LOCATE("; ;", cAuthorsFull) - 1) WHERE LOCATE("; ;", cAuthorsFull) != 0;

--
-- Suppress the remaining final "; " 
--
UPDATE t_bbs SET cAuthorsFull = SUBSTR(cAuthorsFull, 1, CHAR_LENGTH(cAuthorsFull) - 1) WHERE cAuthorsFull LIKE "%; " OR cAuthorsFull LIKE "%;  ";

SET SQL_SAFE_UPDATES=1;
