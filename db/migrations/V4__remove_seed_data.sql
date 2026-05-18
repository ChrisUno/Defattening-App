-- V4: Remove seed/demo data inserted by V2__seed_data.sql
-- Safe to run: uses deterministic IDs from V2. CASCADE constraints on child tables
-- handle any additional rows created by seed.ts with random IDs referencing these
-- seed users/sessions.
-- Deletion order: children → sessions → users (sessions.created_by has no CASCADE).

DELETE FROM activity_entries WHERE id IN ('act-1', 'act-2');

DELETE FROM journals WHERE id IN (
  'j-alex-2', 'j-alex-4', 'j-alex-6',
  'j-jamie-2', 'j-jamie-4',
  'j-taylor-2', 'j-taylor-4', 'j-taylor-6'
);

DELETE FROM weigh_ins WHERE id LIKE 'wi-sp-%' OR id LIKE 'wi-wn-%';

DELETE FROM participations WHERE id LIKE 'part-spring-%' OR id LIKE 'part-winter-%';

DELETE FROM sessions WHERE id IN (
  'session-spring-2026',
  'session-winter-2026',
  'session-summer-2026'
);

DELETE FROM users WHERE id IN (
  'user-admin',
  'user-alex',
  'user-jamie',
  'user-taylor',
  'user-jordan'
);
