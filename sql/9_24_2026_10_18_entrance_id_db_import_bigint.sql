\c grottoce;

-- =============================================================================
-- #1900: entrance import ids wider than int4
-- =============================================================================
--
-- The Georisques "Inventaire des cavités souterraines" file carries 11-digit
-- ids (e.g. 10000000001), beyond the int4 range. No view depends on the
-- column. Re-running on a bigint column is a no-op.
-- =============================================================================

ALTER TABLE t_entrance ALTER COLUMN id_db_import TYPE bigint;
