\c grottoce;

-- Fix Latin-1/UTF-8 mojibake in t_file.filename
--
-- Multer's default defParamCharset was 'latin1', causing UTF-8 filenames
-- to be misinterpreted as Latin-1 before storage. This migration re-encodes
-- the corrupted bytes back to proper UTF-8.
--
-- How it works:
--   convert_to(filename, 'LATIN1') — treats each character as a Latin-1 code
--     point and emits the corresponding byte (reversing the original mis-decode)
--   convert_from(..., 'UTF8') — re-interprets those bytes as UTF-8
--
-- Safety:
--   - ASCII-only filenames are unchanged (ASCII is identical in both encodings)
--   - The WHERE clause makes this idempotent (no-op on already-fixed rows)
--   - Rows with characters outside Latin-1 range (e.g. CJK already stored
--     correctly) will fail convert_to(..., 'LATIN1'), so we skip them
--     gracefully using a PL/pgSQL block with EXCEPTION handling.

BEGIN;

DO $$
DECLARE
  rec RECORD;
  fixed_name TEXT;
BEGIN
  FOR rec IN
    SELECT id, filename
    FROM t_file
    WHERE filename ~ '[^\x00-\x7F]'
  LOOP
    BEGIN
      fixed_name := convert_from(convert_to(rec.filename, 'LATIN1'), 'UTF8');
      -- 200-char guard matches t_file.filename varchar(200) / Waterline maxLength: 200.
      -- In practice, UTF-8 re-encoding produces shorter strings (multi-byte mojibake
      -- chars collapse back to single code points), so this is a safety net, not a filter.
      IF fixed_name IS DISTINCT FROM rec.filename
         AND length(fixed_name) <= 200
      THEN
        UPDATE t_file SET filename = fixed_name WHERE id = rec.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Skip rows where conversion fails (characters outside Latin-1 range)
      RAISE NOTICE 'Skipping t_file id=% filename=%: %', rec.id, rec.filename, SQLERRM;
    END;
  END LOOP;
END $$;

COMMIT;
