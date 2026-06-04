\c grottoce;

-- Note: the `banned` column already exists in t_caver (defined in 0_tables.sql).
-- AdminLoginProtectionService reuses it to ban accounts after consecutive failures.

ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS totp_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS login_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_used_totp VARCHAR(6) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_used_totp_at TIMESTAMP DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_suspicious_email_at TIMESTAMP DEFAULT NULL;
