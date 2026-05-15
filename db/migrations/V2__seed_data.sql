-- Users
-- admin@unosquare.com / admin123
-- all others / password123
INSERT INTO users (id, email, password_hash, name, avatar_color, role, height_cm, created_at) VALUES
    ('user-admin',  'admin@unosquare.com',        '$2a$10$eKRhd2hray7wOra1/dmMEeOg7xGqslwx31AfVlu6UD3JMrUGsMviK', 'Sam Rivera',   '#312E81', 'admin', 178, now() - INTERVAL '20 weeks'),
    ('user-alex',   'alex.morgan@unosquare.com',  '$2a$10$BYPOPDpIW2sDQ39LPsNCu.CxjzOUx/auuMkZ8I0fbZNbQg94FJ19W', 'Alex Morgan',  '#2563EB', 'user',  172, now() - INTERVAL '20 weeks'),
    ('user-jamie',  'jamie.reyes@unosquare.com',  '$2a$10$BYPOPDpIW2sDQ39LPsNCu.CxjzOUx/auuMkZ8I0fbZNbQg94FJ19W', 'Jamie Reyes',  '#0EA5E9', 'user',  168, now() - INTERVAL '20 weeks'),
    ('user-taylor', 'taylor.chen@unosquare.com',  '$2a$10$BYPOPDpIW2sDQ39LPsNCu.CxjzOUx/auuMkZ8I0fbZNbQg94FJ19W', 'Taylor Chen',  '#06B6D4', 'user',  180, now() - INTERVAL '20 weeks'),
    ('user-jordan', 'jordan.patel@unosquare.com', '$2a$10$BYPOPDpIW2sDQ39LPsNCu.CxjzOUx/auuMkZ8I0fbZNbQg94FJ19W', 'Jordan Patel', '#7C3AED', 'user',  175, now() - INTERVAL '20 weeks');

-- Sessions
INSERT INTO sessions (id, name, description, weeks, weigh_in_day_of_week, weigh_in_note, start_date, status, created_by) VALUES
    ('session-spring-2026', 'Spring Slimdown 2026',
     'Eight weeks to bikini bonfire season. Bring snacks (the healthy kind).',
     8, 1, 'Official weigh-in is every Monday morning. Log by Tuesday night to count.',
     now() - INTERVAL '7 weeks', 'active', 'user-admin'),

    ('session-winter-2026', 'New Year, New Me 2026',
     'The post-holiday detox. Six weeks of disciplined gains (or losses).',
     6, 0, 'Weigh-in Sundays before brunch. No exceptions, no excuses.',
     now() - INTERVAL '15 weeks', 'completed', 'user-admin'),

    ('session-summer-2026', 'Summer Shred Challenge',
     'Ten weeks to beach body. Starts after the Spring session wraps.',
     10, 1, 'Mondays. Pre-coffee. Trust the process.',
     now() + INTERVAL '5 weeks', 'upcoming', 'user-admin');

-- Participations — Spring session (active)
INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg, joined_at) VALUES
    ('part-spring-alex',   'user-alex',   'session-spring-2026', 82.0, 74.0, now() - INTERVAL '7 weeks'),
    ('part-spring-jamie',  'user-jamie',  'session-spring-2026', 70.5, 64.0, now() - INTERVAL '7 weeks'),
    ('part-spring-taylor', 'user-taylor', 'session-spring-2026', 95.0, 87.0, now() - INTERVAL '7 weeks'),
    ('part-spring-jordan', 'user-jordan', 'session-spring-2026', 78.0, 72.0, now() - INTERVAL '7 weeks');

-- Participations — Winter session (completed)
INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg, joined_at) VALUES
    ('part-winter-alex',   'user-alex',   'session-winter-2026', 85.0, 78.0, now() - INTERVAL '15 weeks'),
    ('part-winter-jamie',  'user-jamie',  'session-winter-2026', 73.0, 67.0, now() - INTERVAL '15 weeks'),
    ('part-winter-taylor', 'user-taylor', 'session-winter-2026', 98.0, 90.0, now() - INTERVAL '15 weeks');

-- Weigh-ins — Spring session (Alex: 82.0 → 81.2 → 80.6 → 79.5 → 79.1 → 78.2 → 77.5)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at) VALUES
    ('wi-sp-alex-0', 'user-alex', 'session-spring-2026', 82.0, 26.5, 0, now() - INTERVAL '7 weeks', now() - INTERVAL '7 weeks'),
    ('wi-sp-alex-1', 'user-alex', 'session-spring-2026', 81.2, 26.3, 1, now() - INTERVAL '6 weeks', now() - INTERVAL '6 weeks'),
    ('wi-sp-alex-2', 'user-alex', 'session-spring-2026', 80.6, 26.1, 2, now() - INTERVAL '5 weeks', now() - INTERVAL '5 weeks'),
    ('wi-sp-alex-3', 'user-alex', 'session-spring-2026', 79.5, 25.8, 3, now() - INTERVAL '4 weeks', now() - INTERVAL '4 weeks'),
    ('wi-sp-alex-4', 'user-alex', 'session-spring-2026', 79.1, 25.7, 4, now() - INTERVAL '3 weeks', now() - INTERVAL '3 weeks'),
    ('wi-sp-alex-5', 'user-alex', 'session-spring-2026', 78.2, 25.4, 5, now() - INTERVAL '2 weeks', now() - INTERVAL '2 weeks'),
    ('wi-sp-alex-6', 'user-alex', 'session-spring-2026', 77.5, 25.2, 6, now() - INTERVAL '1 weeks', now() - INTERVAL '1 weeks');

-- Weigh-ins — Spring session (Jamie: 70.5 → 70.0 → 69.3 → 69.0 → 68.1 → 67.5 → 66.7)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at) VALUES
    ('wi-sp-jamie-0', 'user-jamie', 'session-spring-2026', 70.5, 28.0, 0, now() - INTERVAL '7 weeks', now() - INTERVAL '7 weeks'),
    ('wi-sp-jamie-1', 'user-jamie', 'session-spring-2026', 70.0, 27.9, 1, now() - INTERVAL '6 weeks', now() - INTERVAL '6 weeks'),
    ('wi-sp-jamie-2', 'user-jamie', 'session-spring-2026', 69.3, 27.7, 2, now() - INTERVAL '5 weeks', now() - INTERVAL '5 weeks'),
    ('wi-sp-jamie-3', 'user-jamie', 'session-spring-2026', 69.0, 27.6, 3, now() - INTERVAL '4 weeks', now() - INTERVAL '4 weeks'),
    ('wi-sp-jamie-4', 'user-jamie', 'session-spring-2026', 68.1, 27.3, 4, now() - INTERVAL '3 weeks', now() - INTERVAL '3 weeks'),
    ('wi-sp-jamie-5', 'user-jamie', 'session-spring-2026', 67.5, 27.1, 5, now() - INTERVAL '2 weeks', now() - INTERVAL '2 weeks'),
    ('wi-sp-jamie-6', 'user-jamie', 'session-spring-2026', 66.7, 26.9, 6, now() - INTERVAL '1 weeks', now() - INTERVAL '1 weeks');

-- Weigh-ins — Spring session (Taylor: 95.0 → 93.8 → 92.9 → 91.9 → 91.3 → 90.2 → 89.4)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at) VALUES
    ('wi-sp-taylor-0', 'user-taylor', 'session-spring-2026', 95.0, 24.0, 0, now() - INTERVAL '7 weeks', now() - INTERVAL '7 weeks'),
    ('wi-sp-taylor-1', 'user-taylor', 'session-spring-2026', 93.8, 23.6, 1, now() - INTERVAL '6 weeks', now() - INTERVAL '6 weeks'),
    ('wi-sp-taylor-2', 'user-taylor', 'session-spring-2026', 92.9, 23.3, 2, now() - INTERVAL '5 weeks', now() - INTERVAL '5 weeks'),
    ('wi-sp-taylor-3', 'user-taylor', 'session-spring-2026', 91.9, 23.0, 3, now() - INTERVAL '4 weeks', now() - INTERVAL '4 weeks'),
    ('wi-sp-taylor-4', 'user-taylor', 'session-spring-2026', 91.3, 22.8, 4, now() - INTERVAL '3 weeks', now() - INTERVAL '3 weeks'),
    ('wi-sp-taylor-5', 'user-taylor', 'session-spring-2026', 90.2, 22.5, 5, now() - INTERVAL '2 weeks', now() - INTERVAL '2 weeks'),
    ('wi-sp-taylor-6', 'user-taylor', 'session-spring-2026', 89.4, 22.3, 6, now() - INTERVAL '1 weeks', now() - INTERVAL '1 weeks');

-- Weigh-ins — Spring session (Jordan: 78.0 → 77.7 → 77.1 → 76.7 → 76.9 → 76.1 → 75.6)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, week_index, measured_at, recorded_at) VALUES
    ('wi-sp-jordan-0', 'user-jordan', 'session-spring-2026', 78.0, 0, now() - INTERVAL '7 weeks', now() - INTERVAL '7 weeks'),
    ('wi-sp-jordan-1', 'user-jordan', 'session-spring-2026', 77.7, 1, now() - INTERVAL '6 weeks', now() - INTERVAL '6 weeks'),
    ('wi-sp-jordan-2', 'user-jordan', 'session-spring-2026', 77.1, 2, now() - INTERVAL '5 weeks', now() - INTERVAL '5 weeks'),
    ('wi-sp-jordan-3', 'user-jordan', 'session-spring-2026', 76.7, 3, now() - INTERVAL '4 weeks', now() - INTERVAL '4 weeks'),
    ('wi-sp-jordan-4', 'user-jordan', 'session-spring-2026', 76.9, 4, now() - INTERVAL '3 weeks', now() - INTERVAL '3 weeks'),
    ('wi-sp-jordan-5', 'user-jordan', 'session-spring-2026', 76.1, 5, now() - INTERVAL '2 weeks', now() - INTERVAL '2 weeks'),
    ('wi-sp-jordan-6', 'user-jordan', 'session-spring-2026', 75.6, 6, now() - INTERVAL '1 weeks', now() - INTERVAL '1 weeks');

-- Weigh-ins — Winter session (Alex: 85.0 → 84.3 → 83.8 → 83.0 → 82.7 → 82.1)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, week_index, measured_at, recorded_at) VALUES
    ('wi-wn-alex-0', 'user-alex', 'session-winter-2026', 85.0, 0, now() - INTERVAL '15 weeks', now() - INTERVAL '15 weeks'),
    ('wi-wn-alex-1', 'user-alex', 'session-winter-2026', 84.3, 1, now() - INTERVAL '14 weeks', now() - INTERVAL '14 weeks'),
    ('wi-wn-alex-2', 'user-alex', 'session-winter-2026', 83.8, 2, now() - INTERVAL '13 weeks', now() - INTERVAL '13 weeks'),
    ('wi-wn-alex-3', 'user-alex', 'session-winter-2026', 83.0, 3, now() - INTERVAL '12 weeks', now() - INTERVAL '12 weeks'),
    ('wi-wn-alex-4', 'user-alex', 'session-winter-2026', 82.7, 4, now() - INTERVAL '11 weeks', now() - INTERVAL '11 weeks'),
    ('wi-wn-alex-5', 'user-alex', 'session-winter-2026', 82.1, 5, now() - INTERVAL '10 weeks', now() - INTERVAL '10 weeks');

-- Weigh-ins — Winter session (Jamie: 73.0 → 72.6 → 72.0 → 71.5 → 70.8 → 70.4)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, week_index, measured_at, recorded_at) VALUES
    ('wi-wn-jamie-0', 'user-jamie', 'session-winter-2026', 73.0, 0, now() - INTERVAL '15 weeks', now() - INTERVAL '15 weeks'),
    ('wi-wn-jamie-1', 'user-jamie', 'session-winter-2026', 72.6, 1, now() - INTERVAL '14 weeks', now() - INTERVAL '14 weeks'),
    ('wi-wn-jamie-2', 'user-jamie', 'session-winter-2026', 72.0, 2, now() - INTERVAL '13 weeks', now() - INTERVAL '13 weeks'),
    ('wi-wn-jamie-3', 'user-jamie', 'session-winter-2026', 71.5, 3, now() - INTERVAL '12 weeks', now() - INTERVAL '12 weeks'),
    ('wi-wn-jamie-4', 'user-jamie', 'session-winter-2026', 70.8, 4, now() - INTERVAL '11 weeks', now() - INTERVAL '11 weeks'),
    ('wi-wn-jamie-5', 'user-jamie', 'session-winter-2026', 70.4, 5, now() - INTERVAL '10 weeks', now() - INTERVAL '10 weeks');

-- Weigh-ins — Winter session (Taylor: 98.0 → 97.0 → 96.2 → 95.3 → 94.2 → 93.5)
INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, week_index, measured_at, recorded_at) VALUES
    ('wi-wn-taylor-0', 'user-taylor', 'session-winter-2026', 98.0, 0, now() - INTERVAL '15 weeks', now() - INTERVAL '15 weeks'),
    ('wi-wn-taylor-1', 'user-taylor', 'session-winter-2026', 97.0, 1, now() - INTERVAL '14 weeks', now() - INTERVAL '14 weeks'),
    ('wi-wn-taylor-2', 'user-taylor', 'session-winter-2026', 96.2, 2, now() - INTERVAL '13 weeks', now() - INTERVAL '13 weeks'),
    ('wi-wn-taylor-3', 'user-taylor', 'session-winter-2026', 95.3, 3, now() - INTERVAL '12 weeks', now() - INTERVAL '12 weeks'),
    ('wi-wn-taylor-4', 'user-taylor', 'session-winter-2026', 94.2, 4, now() - INTERVAL '11 weeks', now() - INTERVAL '11 weeks'),
    ('wi-wn-taylor-5', 'user-taylor', 'session-winter-2026', 93.5, 5, now() - INTERVAL '10 weeks', now() - INTERVAL '10 weeks');

-- Journals
INSERT INTO journals (id, user_id, session_id, week_index, content, created_at) VALUES
    ('j-alex-2',  'user-alex',   'session-spring-2026', 2, 'Hit the gym 4x this week and meal-prepped Sunday. Feeling strong!',  now() - INTERVAL '5 weeks'),
    ('j-alex-4',  'user-alex',   'session-spring-2026', 4, 'Stuck on a plateau. Going to switch up cardio next week.',            now() - INTERVAL '3 weeks'),
    ('j-alex-6',  'user-alex',   'session-spring-2026', 6, 'Bumped protein up to 150g/day and finally feel less hungry.',          now() - INTERVAL '1 weeks'),
    ('j-jamie-2', 'user-jamie',  'session-spring-2026', 2, 'Walking 10k steps a day is a game changer.',                           now() - INTERVAL '5 weeks'),
    ('j-jamie-4', 'user-jamie',  'session-spring-2026', 4, 'Tried intermittent fasting, surprisingly easy by Friday.',             now() - INTERVAL '3 weeks'),
    ('j-taylor-2','user-taylor', 'session-spring-2026', 2, 'Stressful week at work, snacked too much. Resetting tomorrow.',        now() - INTERVAL '5 weeks'),
    ('j-taylor-4','user-taylor', 'session-spring-2026', 4, 'Made it through happy hour with sparkling water. Proud of myself.',    now() - INTERVAL '3 weeks'),
    ('j-taylor-6','user-taylor', 'session-spring-2026', 6, 'Tracked every meal in the app. Eye opening.',                          now() - INTERVAL '1 weeks');

-- Activity entries
INSERT INTO activity_entries (id, type, occurred_at, session_id, actor_user_id, target_user_id, actor_pct, target_pct) VALUES
    ('act-1', 'overtake', now() - INTERVAL '2 days',  'session-spring-2026', 'user-taylor', 'user-alex',   5.89, 5.49),
    ('act-2', 'overtake', now() - INTERVAL '5 days',  'session-spring-2026', 'user-jamie',  'user-jordan',  5.39, 3.08);
