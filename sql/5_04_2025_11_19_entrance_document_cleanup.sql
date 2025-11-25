\c grottoce;

-- Remove the foreign key constraint from t_document
ALTER TABLE t_document DROP CONSTRAINT IF EXISTS t_document_t_entrance_fk;

-- Drop the id_entrance column from t_document
ALTER TABLE t_document DROP COLUMN IF EXISTS id_entrance;

-- Also update h_document (history table) to remove id_entrance
ALTER TABLE h_document DROP CONSTRAINT IF EXISTS h_document_t_entrance_fk;
ALTER TABLE h_document DROP COLUMN IF EXISTS id_entrance;
