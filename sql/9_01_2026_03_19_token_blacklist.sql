\c grottoce;

CREATE TABLE IF NOT EXISTS t_token_blacklist (
    id_caver integer NOT NULL,
    revoked_before timestamp with time zone NOT NULL,
    CONSTRAINT t_token_blacklist_pkey PRIMARY KEY (id_caver),
    CONSTRAINT t_token_blacklist_id_caver_fkey FOREIGN KEY (id_caver)
        REFERENCES t_caver(id) ON DELETE CASCADE
);

COMMENT ON TABLE t_token_blacklist IS 'Stores per-user token revocation timestamps. Tokens with iat < revoked_before are rejected.';
COMMENT ON COLUMN t_token_blacklist.id_caver IS 'FK to t_caver.id — the user whose tokens are revoked';
COMMENT ON COLUMN t_token_blacklist.revoked_before IS 'Cutoff timestamp — tokens issued before this are invalid';
