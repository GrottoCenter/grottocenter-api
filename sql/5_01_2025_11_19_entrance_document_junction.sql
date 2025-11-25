\c grottoce;

-- Create junction table for entrance-document many-to-many relationship
CREATE TABLE IF NOT EXISTS j_document_entrance (
    id_document int4 NOT NULL,
    id_entrance int4 NOT NULL,
    CONSTRAINT j_document_entrance_pk PRIMARY KEY (id_document, id_entrance),
    CONSTRAINT j_document_entrance_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id),
    CONSTRAINT j_document_entrance_t_entrance_fk FOREIGN KEY (id_entrance) REFERENCES t_entrance(id)
);

-- Migrate existing data from t_document.id_entrance to junction table (only if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_document' AND column_name = 'id_entrance'
    ) THEN
        INSERT INTO j_document_entrance (id_document, id_entrance)
        SELECT id, id_entrance
        FROM t_document
        WHERE id_entrance IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Add sample many-to-many relationship: link document 109 to entrance 18 (already linked to entrance 17)
INSERT INTO j_document_entrance (id_document, id_entrance)
VALUES (109, 18)
ON CONFLICT DO NOTHING;
