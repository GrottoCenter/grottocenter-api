\c grottoce;

-- A document search entry tells whether a validated file is attached to it
-- (hasFiles, #1739): adding, validating, moving or removing a file re-indexes
-- the document it belonged to and the one it belongs to. Thumbnails and the
-- other columns do not change hasFiles and enqueue nothing.
--
-- Relies on search_outbox_enqueue_refs (sql/9_22_2026_10_12_search_outbox.sql).

CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_file FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue_refs('documents', 'id_document');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_file FOR EACH ROW
  WHEN ((OLD.id_document, OLD.is_validated)
    IS DISTINCT FROM (NEW.id_document, NEW.is_validated))
  EXECUTE FUNCTION search_outbox_enqueue_refs('documents', 'id_document');
