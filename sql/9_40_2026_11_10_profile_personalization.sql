\c grottoce;

-- Profile personalization (#1730): a short custom message on a caver, and an
-- avatar for cavers and organizations. avatar_path is the blob path of the
-- re-encoded image in the documents storage container.
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS custom_message VARCHAR(500) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(200) DEFAULT NULL;
ALTER TABLE t_grotto ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(200) DEFAULT NULL;

-- Avatar images waiting to be deleted from storage. A path is recorded here in
-- the same transaction that drops its last reference (replacement, removal,
-- deletion of its owner), and before a new image is uploaded. The row is
-- removed once the blob is gone. A failed deletion keeps the row, and the
-- hourly avatar-cleanup job (api/services/AvatarCleanupQueueService.js)
-- retries it: an image no record points to is never left in storage.
--
--   blob_path         path of the image in the documents container
--   date_inscription  when the path was recorded
--   attempts          failed deletions so far
--   last_error        message of the last failed deletion
CREATE TABLE IF NOT EXISTS t_avatar_pending_deletion (
  blob_path VARCHAR(200) PRIMARY KEY,
  date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
ALTER TABLE t_avatar_pending_deletion OWNER TO gc_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON t_avatar_pending_deletion TO gc_app;
