\c grottoce;

-- Profile personalization (#1730): a short custom message on a caver, and an
-- avatar for cavers and organizations. avatar_path is the blob path of the
-- re-encoded image in the documents storage container.
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS custom_message VARCHAR(500) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(200) DEFAULT NULL;
ALTER TABLE t_grotto ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(200) DEFAULT NULL;
