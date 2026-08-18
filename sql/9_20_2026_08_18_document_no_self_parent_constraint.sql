\c grottoce;

-- Prevent a document from referencing itself as its own parent.
-- Indirect cycles (A → B → A) are handled at the application layer in
-- DocumentService.checkParentCycle(); this constraint catches the direct
-- self-reference case at the database level as a safety net.
ALTER TABLE t_document
  ADD CONSTRAINT t_document_no_self_parent CHECK (id <> id_parent);
