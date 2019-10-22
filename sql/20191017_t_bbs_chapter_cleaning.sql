-- This SQL requests aim to correctly format the chapter code of the t_bbs table data in order
-- to make them match the column "code_matiere_" of t_bbs_chapter.

--
-- Alter ChapterCode column from float to varchar in order to suppress last characters (trailling "0")
--
ALTER TABLE `t_bbs` CHANGE `ChapterCode` `ChapterCode` VARCHAR(5) NULL DEFAULT NULL; 

--
-- Remove trailing "00" at the end of chapter codes.
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode LIKE "%00"
AND ChapterCode != "4.100"
AND ChapterCode != "5.100";

--
-- 4.100 and 5.100 must be converted to 4.10 & 5.10
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode = "4.100"
OR ChapterCode = "5.100";

--
-- 2.00 and 9.00 must be converted to 2.0 & 9.0
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode = "2.00"
OR ChapterCode = "9.00";

--
-- Remove trailing "0" at the end of chapter codes formated as X.XX0
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode LIKE "_.__0";

--
-- Remove trailing "0" at the end of chapter codes formated as X.Y0 with Y > 1 (.20, .30 etc.)
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode LIKE "_._0"
AND ChapterCode NOT LIKE "_.10";

--
-- Remove trailing "0" at the end of chapter codes 6.10, 7.10, 8.10, 9.10 (they don't exist, it's 6.1, 7.1, 8.1 & 9.1)
-- 
UPDATE t_bbs
SET ChapterCode = SUBSTR(ChapterCode, 1, CHAR_LENGTH(ChapterCode) - 1)
WHERE ChapterCode = "6.10"
OR ChapterCode = "7.10"
OR ChapterCode = "8.10"
OR ChapterCode = "9.10";


-- 
-- Change code_matiere "9" by "9.0"
--
UPDATE t_bbs_chapter
SET code_matiere = "9.0"
WHERE code_matiere = "9";


--
-- "Remove / symbol in a chapter / matière name
--
UPDATE t_bbs_chapter
SET ctexte_matiere = "PARA-, PSEUDO- AND HYPOKARST", texte_matiere_anglais = "PARA-, PSEUDO- AND HYPOKARST", texte_matiere_francais = "PARA-, PSEUDO- ET HYPOKARST"
WHERE code_matiere = "1.22";



