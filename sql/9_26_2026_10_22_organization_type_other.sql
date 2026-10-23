\c grottoce;

-- =============================================================================
-- #1923: an OTHER type for the organizations outside the existing categories
-- =============================================================================
--
-- OTHER is a deliberate classification: "none of the categories apply". It is
-- distinct from NULL, which still means "registered before types were
-- introduced, not classified yet", and no NULL is converted here. Extends the
-- constraint created by sql/9_23_2026_10_15_organization_type.sql, keeping
-- every existing value; the list matches config/constants/organization.js.
--
-- Apply after sql/9_23_2026_10_15_organization_type.sql.
-- =============================================================================

ALTER TABLE t_grotto DROP CONSTRAINT IF EXISTS t_grotto_type_check;
ALTER TABLE t_grotto ADD CONSTRAINT t_grotto_type_check CHECK (
  type IS NULL OR type IN ('SPELEOLOGY', 'CAVE_RESCUE', 'EDITION', 'RESEARCH', 'ADMINISTRATION', 'NATURE_CONSERVATION', 'LIBRARY', 'OTHER')
);
