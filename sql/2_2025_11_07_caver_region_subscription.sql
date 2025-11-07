\c grottoce;

-- Create junction table for caver region subscriptions
CREATE TABLE IF NOT EXISTS j_caver_region_subscription (
  id_caver INTEGER NOT NULL,
  id_region VARCHAR(10) NOT NULL,
  PRIMARY KEY (id_caver, id_region),
  FOREIGN KEY (id_caver) REFERENCES t_caver(id) ON DELETE CASCADE,
  FOREIGN KEY (id_region) REFERENCES t_iso3166_2(iso) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_j_caver_region_subscription_caver ON j_caver_region_subscription(id_caver);
CREATE INDEX IF NOT EXISTS idx_j_caver_region_subscription_region ON j_caver_region_subscription(id_region);