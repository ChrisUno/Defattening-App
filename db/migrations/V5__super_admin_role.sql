-- Widen role column to fit 'super_admin' (11 chars > varchar(10))
ALTER TABLE users ALTER COLUMN role TYPE varchar(20);

-- Expand role CHECK constraint to include 'super_admin'
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'admin', 'user'));

-- Promote the project owner to super_admin (by email)
UPDATE users SET role = 'super_admin'
  WHERE email = 'chris.crawford@unosquare.com';
