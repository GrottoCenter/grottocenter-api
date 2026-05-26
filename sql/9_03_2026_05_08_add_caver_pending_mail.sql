\c grottoce;

ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS pending_mail VARCHAR(50) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS t_caver_pending_mail_idx ON t_caver (pending_mail);
