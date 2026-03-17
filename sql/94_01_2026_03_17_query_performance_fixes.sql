\c grottoce;
-- =============================================================================
-- Migration: Query Performance Fixes
-- Date: 2026-03-17
-- Description: Fix 7 query performance defects from diagnostic analysis
-- Idempotent: All statements use IF EXISTS / IF NOT EXISTS or DO blocks
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fix 4: Add synthetic PK to t_last_change
-- Enables HOT updates and reduces dead tuple accumulation (7.2% → target <2%)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 't_last_change' AND column_name = 'id'
  ) THEN
    ALTER TABLE t_last_change ADD COLUMN id SERIAL PRIMARY KEY;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Fix 3: Add notification covering index for all user queries
-- Serves both read+unread notification lookups (98.1% seq scan ratio)
-- Retains existing idx_t_notification_notified_unread partial index
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_t_notification_notified
  ON t_notification(id_notified, date_inscription DESC);

-- -----------------------------------------------------------------------------
-- Fix 5: Replace partial comment indexes with non-partial
-- Partial WHERE IS NOT NULL prevents planner from using them for all patterns
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_t_comment_entrance;
DROP INDEX IF EXISTS idx_t_comment_cave;
CREATE INDEX IF NOT EXISTS idx_t_comment_entrance ON t_comment(id_entrance);
CREATE INDEX IF NOT EXISTS idx_t_comment_cave ON t_comment(id_cave);

-- -----------------------------------------------------------------------------
-- Fix 7: Autovacuum tuning for t_last_change
-- Triggers vacuum at ~5% dead tuples instead of default 20%
-- -----------------------------------------------------------------------------
ALTER TABLE t_last_change SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
