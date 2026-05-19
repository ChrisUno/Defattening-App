ALTER TABLE users
  ADD COLUMN is_temp_admin       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN temp_admin_expires_at TIMESTAMPTZ;
