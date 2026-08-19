\c grottoce;

-- Prevent a document from referencing itself as its own parent.
-- Indirect cycles (A → B → A) are handled at the application layer in
-- DocumentService.checkParentCycle(); this constraint catches the direct
-- self-reference case at the database level as a safety net.
--
-- NOT VALID skips the full-table scan at ALTER time so the migration never
-- aborts on pre-existing self-parented rows.  New and updated rows are
-- checked immediately once the constraint exists.
--
-- VALIDATE CONSTRAINT is intentionally omitted here.  Run it manually in a
-- follow-up step once ops has confirmed there are no remaining id = id_parent
-- rows (query: SELECT id FROM t_document WHERE id = id_parent).
-- Command to validate when ready:
--   ALTER TABLE t_document VALIDATE CONSTRAINT t_document_no_self_parent;
ALTER TABLE t_document DROP CONSTRAINT IF EXISTS t_document_no_self_parent;
ALTER TABLE t_document ADD CONSTRAINT t_document_no_self_parent CHECK (id <> id_parent) NOT VALID;
