\c grottoce;

-- Drop FK constraints on history tables that reference their parent t_ table
-- via the `id` column (e.g., h_entrance.id -> t_entrance.id).
--
-- These constraints prevent permanent deletes from preserving history rows
-- for auditability. Production data already contains orphaned h_ rows
-- (parent t_ row deleted, h_ rows retained), confirming these FKs are not
-- enforced in practice. Removing them aligns the schema with actual behavior.
--
-- ROLLBACK: To restore these constraints, run the commented-out block at the
-- end of this file. Note that restoring requires no orphaned h_ rows exist,
-- or the ADD CONSTRAINT will fail. You may need to clean up orphans first.

-- Parent FK constraints (h_.id -> t_.id)
ALTER TABLE h_entrance DROP CONSTRAINT IF EXISTS h_entrance_t_entrance;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_description;
ALTER TABLE h_location DROP CONSTRAINT IF EXISTS h_location_t_location;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_rigging;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_comment;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_history;
ALTER TABLE h_cave DROP CONSTRAINT IF EXISTS h_cave_t_cave;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_name;
ALTER TABLE h_document DROP CONSTRAINT IF EXISTS h_document_t_document;
ALTER TABLE h_grotto DROP CONSTRAINT IF EXISTS h_grotto_t_grotto;
ALTER TABLE h_massif DROP CONSTRAINT IF EXISTS h_massif_t_massif;

-- Cross-entity FK constraints on h_ tables referencing t_entrance(id).
-- These block entrance hard-deletes when h_ rows are preserved.
ALTER TABLE h_location DROP CONSTRAINT IF EXISTS h_location_t_entrance_fk;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_entrance_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_entrance1_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_entrance2_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_entrance1_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_entrance2_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_entrance_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_entrance1_fk;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_entrance_fk;

-- Cross-entity FK constraints on h_ tables referencing t_cave(id).
-- These block cave hard-deletes when h_ rows are preserved.
ALTER TABLE h_entrance DROP CONSTRAINT IF EXISTS h_entrance_t_cave_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_cave_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_cave_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_cave_fk;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_cave_fk;
ALTER TABLE h_document DROP CONSTRAINT IF EXISTS h_document_t_cave_fk;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_cave0_fk;

-- ============================================================================
-- ROLLBACK (commented out)
-- Restore the dropped constraints. Only run this if you need to revert AND
-- have first cleaned up any orphaned h_ rows that would violate the FKs.
-- ============================================================================
--
-- -- Parent FK constraints (h_.id -> t_.id)
-- ALTER TABLE h_entrance ADD CONSTRAINT h_entrance_t_entrance FOREIGN KEY (id) REFERENCES t_entrance(id);
-- ALTER TABLE h_description ADD CONSTRAINT h_description_t_description FOREIGN KEY (id) REFERENCES t_description(id);
-- ALTER TABLE h_location ADD CONSTRAINT h_location_t_location FOREIGN KEY (id) REFERENCES t_location(id);
-- ALTER TABLE h_rigging ADD CONSTRAINT h_rigging_t_rigging FOREIGN KEY (id) REFERENCES t_rigging(id);
-- ALTER TABLE h_comment ADD CONSTRAINT h_comment_t_comment FOREIGN KEY (id) REFERENCES t_comment(id);
-- ALTER TABLE h_history ADD CONSTRAINT h_history_t_history FOREIGN KEY (id) REFERENCES t_history(id);
-- ALTER TABLE h_cave ADD CONSTRAINT h_cave_t_cave FOREIGN KEY (id) REFERENCES t_cave(id);
-- ALTER TABLE h_name ADD CONSTRAINT h_name_t_name FOREIGN KEY (id) REFERENCES t_name(id);
-- ALTER TABLE h_document ADD CONSTRAINT h_document_t_document FOREIGN KEY (id) REFERENCES t_document(id);
-- ALTER TABLE h_grotto ADD CONSTRAINT h_grotto_t_grotto FOREIGN KEY (id) REFERENCES t_grotto(id);
-- ALTER TABLE h_massif ADD CONSTRAINT h_massif_t_massif FOREIGN KEY (id) REFERENCES t_massif(id);
--
-- -- Cross-entity FK constraints on h_ tables referencing t_entrance(id)
-- ALTER TABLE h_location ADD CONSTRAINT h_location_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
-- ALTER TABLE h_name ADD CONSTRAINT h_name_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
-- ALTER TABLE h_description ADD CONSTRAINT h_description_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
-- ALTER TABLE h_description ADD CONSTRAINT h_description_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id);
-- ALTER TABLE h_comment ADD CONSTRAINT h_comment_t_entrance1_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
-- ALTER TABLE h_comment ADD CONSTRAINT h_comment_t_entrance2_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id);
-- ALTER TABLE h_rigging ADD CONSTRAINT h_rigging_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
-- ALTER TABLE h_rigging ADD CONSTRAINT h_rigging_t_entrance1_fk FOREIGN KEY (id_exit) REFERENCES t_entrance(id);
-- ALTER TABLE h_history ADD CONSTRAINT h_history_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id);
--
-- -- Cross-entity FK constraints on h_ tables referencing t_cave(id)
-- ALTER TABLE h_entrance ADD CONSTRAINT h_entrance_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_description ADD CONSTRAINT h_description_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_comment ADD CONSTRAINT h_comment_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_rigging ADD CONSTRAINT h_rigging_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_history ADD CONSTRAINT h_history_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_document ADD CONSTRAINT h_document_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
-- ALTER TABLE h_name ADD CONSTRAINT h_name_t_cave0_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id);
