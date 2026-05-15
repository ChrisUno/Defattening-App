ALTER TABLE users ADD COLUMN entra_oid VARCHAR(64) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE INDEX idx_users_entra_oid ON users (entra_oid);
