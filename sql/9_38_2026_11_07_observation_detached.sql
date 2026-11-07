\c grottoce;

-- =============================================================================
-- #1982: an observation may be detached from any cave and any point
-- =============================================================================
--
-- Permanently deleting a cave without a merge target now keeps its scientific
-- data and clears the cave reference of its points and observations
-- (api/services/CaveLifecycleService.js). An observation recorded directly on
-- the cave, without a point, is then left with neither: the CHECK
-- t_observation_point_or_cave (sql/9_04_2026_06_03_scientific_observations_ddl.sql)
-- refused that state and would have blocked the delete.
--
-- The rule "a new observation names a cave or a point" stays in the import
-- validation (api/services/observation-import/ProfileValidator.js); only the
-- database stops enforcing it, since a detached observation is a legitimate
-- result of the cave lifecycle (docs/scientific-data-lifecycle.md).
--
-- Deployment order: apply this file BEFORE deploying the API that detaches
-- scientific data. The old API never writes such a row, so the migration is
-- safe to apply ahead of it.
ALTER TABLE t_observation DROP CONSTRAINT IF EXISTS t_observation_point_or_cave;
