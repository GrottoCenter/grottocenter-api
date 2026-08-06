\c grottoce;

CREATE TABLE IF NOT EXISTS t_job_batch (
  id varchar(36) NOT NULL,
  type varchar(50) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  id_initiator int4 NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp NULL,
  total_rows int4 NOT NULL,
  chunk_size int4 NOT NULL,
  total_chunks int4 NOT NULL,
  result jsonb NULL,
  CONSTRAINT t_job_batch_pk PRIMARY KEY (id),
  CONSTRAINT t_job_batch_initiator_fk FOREIGN KEY (id_initiator) REFERENCES t_caver(id)
);

CREATE INDEX IF NOT EXISTS idx_job_batch_initiator ON t_job_batch (id_initiator);
CREATE INDEX IF NOT EXISTS idx_job_batch_status ON t_job_batch (status);

-- Add new notification type for import completion
INSERT INTO t_notification_type (id, name) VALUES (8, 'IMPORT_COMPLETE')
ON CONFLICT (id) DO NOTHING;

-- Add job_batch FK to t_notification
ALTER TABLE t_notification
  ADD COLUMN IF NOT EXISTS id_job_batch varchar(36) NULL;

-- Add FK constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 't_notification_job_batch_fk'
  ) THEN
    ALTER TABLE t_notification
      ADD CONSTRAINT t_notification_job_batch_fk
      FOREIGN KEY (id_job_batch) REFERENCES t_job_batch(id);
  END IF;
END $$;
