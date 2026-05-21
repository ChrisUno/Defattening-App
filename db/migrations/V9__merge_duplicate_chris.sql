-- Merge duplicate user rows for chris.crawford@unosquare.com
-- Row 1b2fbe02 was created by Entra auto-create (has OID, no email)
-- Row 7a579bd2 was created separately (has email, no OID, super_admin from V8)
-- Keep row 7a579bd2 as canonical; migrate all FK refs from row 1b2fbe02.

-- Move participation records
UPDATE participations
SET user_id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE user_id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Move any weigh-ins
UPDATE weigh_ins
SET user_id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE user_id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Move any journals
UPDATE journals
SET user_id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE user_id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Move any activity entries (actor)
UPDATE activity_entries
SET actor_user_id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE actor_user_id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Move any activity entries (target)
UPDATE activity_entries
SET target_user_id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE target_user_id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Move any created sessions
UPDATE sessions
SET created_by = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26'
WHERE created_by = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Clear OID from duplicate row first (unique constraint)
UPDATE users
SET entra_oid = NULL
WHERE id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';

-- Copy the Entra OID to the canonical row
UPDATE users
SET entra_oid = '7b4f8682-4c3c-4c0c-b1cd-574cd9164453'
WHERE id = '7a579bd2-7b33-4d9e-aeb8-ec51168b5d26';

-- Delete the duplicate row
DELETE FROM users
WHERE id = '1b2fbe02-b454-4f50-851b-eb73f6077bcf';
