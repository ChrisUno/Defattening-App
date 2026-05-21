-- Fix display name and ensure super_admin role for project owner
-- V5 migration missed this user because the row was created after V5 ran (via Entra auto-create).
UPDATE users
SET name = 'Chris Crawford',
    role = 'super_admin'
WHERE email = 'chris.crawford@unosquare.com';
