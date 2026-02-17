-- normalize-relevance.sql
--
-- Normalizes relevance values for t_location, t_description, t_comment,
-- t_rigging, and t_history to sequential positive integers (1, 2, 3, ...) within
-- each parent scope. Deleted entities get relevance = 0.
--
-- Ordering: current relevance ASC, then id ASC as tiebreaker.
-- This script is idempotent — running it multiple times produces the same result.
--
-- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6

\c grottoce;

BEGIN;

-- t_location: scoped by id_entrance
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY id_entrance
    ORDER BY relevance, id
  ) AS new_relevance
  FROM t_location
  WHERE is_deleted = false
)
UPDATE t_location SET relevance = ranked.new_relevance
FROM ranked WHERE t_location.id = ranked.id;

UPDATE t_location SET relevance = 0 WHERE is_deleted = true;

-- t_description: scoped by id_entrance, id_cave, id_massif, id_document
-- A description belongs to exactly one parent; COALESCE(field, 0) ensures
-- NULLs are grouped correctly so each parent scope is partitioned independently.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(id_entrance, 0), COALESCE(id_cave, 0),
                COALESCE(id_massif, 0), COALESCE(id_document, 0)
    ORDER BY relevance, id
  ) AS new_relevance
  FROM t_description
  WHERE is_deleted = false
)
UPDATE t_description SET relevance = ranked.new_relevance
FROM ranked WHERE t_description.id = ranked.id;

UPDATE t_description SET relevance = 0 WHERE is_deleted = true;

-- t_comment: scoped by id_entrance, id_cave
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(id_entrance, 0), COALESCE(id_cave, 0)
    ORDER BY relevance, id
  ) AS new_relevance
  FROM t_comment
  WHERE is_deleted = false
)
UPDATE t_comment SET relevance = ranked.new_relevance
FROM ranked WHERE t_comment.id = ranked.id;

UPDATE t_comment SET relevance = 0 WHERE is_deleted = true;

-- t_rigging: scoped by id_entrance, id_cave
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(id_entrance, 0), COALESCE(id_cave, 0)
    ORDER BY relevance, id
  ) AS new_relevance
  FROM t_rigging
  WHERE is_deleted = false
)
UPDATE t_rigging SET relevance = ranked.new_relevance
FROM ranked WHERE t_rigging.id = ranked.id;

UPDATE t_rigging SET relevance = 0 WHERE is_deleted = true;

-- t_history: scoped by id_entrance, id_cave
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(id_entrance, 0), COALESCE(id_cave, 0)
    ORDER BY relevance, id
  ) AS new_relevance
  FROM t_history
  WHERE is_deleted = false
)
UPDATE t_history SET relevance = ranked.new_relevance
FROM ranked WHERE t_history.id = ranked.id;

UPDATE t_history SET relevance = 0 WHERE is_deleted = true;

COMMIT;
