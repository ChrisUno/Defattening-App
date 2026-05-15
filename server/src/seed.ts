import db from './db.js';
import bcrypt from 'bcryptjs';

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

const now = new Date();
const weeksAgo = (n: number) => new Date(now.getTime() - n * 7 * 24 * 60 * 60 * 1000).toISOString();
const weeksFromNow = (n: number) => new Date(now.getTime() + n * 7 * 24 * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

console.log('Seeding database...');

db.exec('DELETE FROM activity_entries');
db.exec('DELETE FROM journals');
db.exec('DELETE FROM weigh_ins');
db.exec('DELETE FROM participations');
db.exec('DELETE FROM sessions');
db.exec('DELETE FROM users');

const USERS = [
  { id: 'user-admin', email: 'admin@unosquare.com', password: 'admin123', name: 'Sam Rivera', avatarColor: '#312E81', role: 'admin', heightCm: 178 },
  { id: 'user-alex', email: 'alex.morgan@unosquare.com', password: 'password123', name: 'Alex Morgan', avatarColor: '#2563EB', role: 'user', heightCm: 172 },
  { id: 'user-jamie', email: 'jamie.reyes@unosquare.com', password: 'password123', name: 'Jamie Reyes', avatarColor: '#0EA5E9', role: 'user', heightCm: 168 },
  { id: 'user-taylor', email: 'taylor.chen@unosquare.com', password: 'password123', name: 'Taylor Chen', avatarColor: '#06B6D4', role: 'user', heightCm: 180 },
  { id: 'user-jordan', email: 'jordan.patel@unosquare.com', password: 'password123', name: 'Jordan Patel', avatarColor: '#7C3AED', role: 'user', heightCm: 175 },
];

const insertUser = db.prepare(
  `INSERT INTO users (id, email, password_hash, name, avatar_color, role, height_cm, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const u of USERS) {
  insertUser.run(u.id, u.email, hash(u.password), u.name, u.avatarColor, u.role, u.heightCm, weeksAgo(20));
}
console.log(`  Created ${USERS.length} users`);

const SESSIONS = [
  {
    id: 'session-spring-2026',
    name: 'Spring Slimdown 2026',
    description: 'Eight weeks to bikini bonfire season. Bring snacks (the healthy kind).',
    weeks: 8,
    weighInDayOfWeek: 1,
    weighInNote: 'Official weigh-in is every Monday morning. Log by Tuesday night to count.',
    startDate: weeksAgo(7),
    status: 'active',
    createdBy: 'user-admin',
  },
  {
    id: 'session-winter-2026',
    name: 'New Year, New Me 2026',
    description: 'The post-holiday detox. Six weeks of disciplined gains (or losses).',
    weeks: 6,
    weighInDayOfWeek: 0,
    weighInNote: 'Weigh-in Sundays before brunch. No exceptions, no excuses.',
    startDate: weeksAgo(15),
    status: 'completed',
    createdBy: 'user-admin',
  },
  {
    id: 'session-summer-2026',
    name: 'Summer Shred Challenge',
    description: 'Ten weeks to beach body. Starts after the Spring session wraps.',
    weeks: 10,
    weighInDayOfWeek: 1,
    weighInNote: 'Mondays. Pre-coffee. Trust the process.',
    startDate: weeksFromNow(5),
    status: 'upcoming',
    createdBy: 'user-admin',
  },
];

const insertSession = db.prepare(
  `INSERT INTO sessions (id, name, description, weeks, weigh_in_day_of_week, weigh_in_note, start_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const s of SESSIONS) {
  insertSession.run(s.id, s.name, s.description, s.weeks, s.weighInDayOfWeek, s.weighInNote, s.startDate, s.status, s.createdBy);
}
console.log(`  Created ${SESSIONS.length} sessions`);

const insertPart = db.prepare(
  `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg, joined_at) VALUES (?, ?, ?, ?, ?, ?)`
);
const insertWeighIn = db.prepare(
  `INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertJournal = db.prepare(
  `INSERT INTO journals (id, user_id, session_id, week_index, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`
);
const insertActivity = db.prepare(
  `INSERT INTO activity_entries (id, type, occurred_at, session_id, actor_user_id, target_user_id, actor_pct, target_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);

const journalSnippets = [
  'Hit the gym 4x this week and meal-prepped Sunday. Feeling strong!',
  'Stressful week at work, snacked too much. Resetting tomorrow.',
  'Walking 10k steps a day is a game changer.',
  'Tried intermittent fasting, surprisingly easy by Friday.',
  'Stuck on a plateau. Going to switch up cardio next week.',
  'Made it through happy hour with sparkling water. Proud of myself.',
  'Bumped protein up to 150g/day and finally feel less hungry.',
  'Bad sleep all week — definitely felt it on the scale.',
  'Tracked every meal in the app. Eye opening.',
];

interface ParticipantSeed {
  userId: string;
  startWeight: number;
  goalWeight: number;
  weeklyChanges: number[];
  bodyFatStart?: number;
}

const springParticipants: ParticipantSeed[] = [
  { userId: 'user-alex', startWeight: 82.0, goalWeight: 74.0, weeklyChanges: [0, -0.8, -0.6, -1.1, -0.4, -0.9, -0.7], bodyFatStart: 26.5 },
  { userId: 'user-jamie', startWeight: 70.5, goalWeight: 64.0, weeklyChanges: [0, -0.5, -0.7, -0.3, -0.9, -0.6, -0.8], bodyFatStart: 28.0 },
  { userId: 'user-taylor', startWeight: 95.0, goalWeight: 87.0, weeklyChanges: [0, -1.2, -0.9, -1.0, -0.6, -1.1, -0.8], bodyFatStart: 24.0 },
  { userId: 'user-jordan', startWeight: 78.0, goalWeight: 72.0, weeklyChanges: [0, -0.3, -0.6, -0.4, +0.2, -0.8, -0.5] },
];

let partCount = 0;
let weighInCount = 0;
let journalCount = 0;

const springSession = SESSIONS[0];

for (const p of springParticipants) {
  const partId = uid('part');
  insertPart.run(partId, p.userId, springSession.id, p.startWeight, p.goalWeight, springSession.startDate);
  partCount++;

  let weight = p.startWeight;
  let bodyFat = p.bodyFatStart ?? null;

  for (let week = 0; week < p.weeklyChanges.length; week++) {
    weight = +(weight + p.weeklyChanges[week]).toFixed(1);
    if (bodyFat !== null) {
      bodyFat = +(bodyFat + (week === 0 ? 0 : p.weeklyChanges[week] * 0.3)).toFixed(1);
    }
    const measuredAt = new Date(new Date(springSession.startDate).getTime() + week * 7 * 24 * 60 * 60 * 1000).toISOString();

    insertWeighIn.run(
      uid('weighin'), p.userId, springSession.id, weight,
      bodyFat, week, measuredAt, measuredAt
    );
    weighInCount++;

    if (week > 0 && week % 2 === 0) {
      insertJournal.run(
        uid('journal'), p.userId, springSession.id, week,
        journalSnippets[journalCount % journalSnippets.length],
        measuredAt
      );
      journalCount++;
    }
  }
}

const winterSession = SESSIONS[1];
const winterParticipants: ParticipantSeed[] = [
  { userId: 'user-alex', startWeight: 85.0, goalWeight: 78.0, weeklyChanges: [0, -0.7, -0.5, -0.8, -0.3, -0.6] },
  { userId: 'user-jamie', startWeight: 73.0, goalWeight: 67.0, weeklyChanges: [0, -0.4, -0.6, -0.5, -0.7, -0.4] },
  { userId: 'user-taylor', startWeight: 98.0, goalWeight: 90.0, weeklyChanges: [0, -1.0, -0.8, -0.9, -1.1, -0.7] },
];

for (const p of winterParticipants) {
  const partId = uid('part');
  insertPart.run(partId, p.userId, winterSession.id, p.startWeight, p.goalWeight, winterSession.startDate);
  partCount++;

  let weight = p.startWeight;
  for (let week = 0; week < p.weeklyChanges.length; week++) {
    weight = +(weight + p.weeklyChanges[week]).toFixed(1);
    const measuredAt = new Date(new Date(winterSession.startDate).getTime() + week * 7 * 24 * 60 * 60 * 1000).toISOString();
    insertWeighIn.run(uid('weighin'), p.userId, winterSession.id, weight, null, week, measuredAt, measuredAt);
    weighInCount++;
  }
}

console.log(`  Created ${partCount} participations`);
console.log(`  Created ${weighInCount} weigh-ins`);
console.log(`  Created ${journalCount} journal entries`);

insertActivity.run(uid('activity'), 'overtake', daysAgo(2), springSession.id, 'user-taylor', 'user-alex', 5.47, 4.63);
insertActivity.run(uid('activity'), 'overtake', daysAgo(5), springSession.id, 'user-jamie', 'user-jordan', 4.68, 2.56);
console.log('  Created 2 activity entries');

console.log('Seed complete!');
console.log('\nLogin credentials:');
console.log('  Admin:  admin@unosquare.com / admin123');
console.log('  User:   alex.morgan@unosquare.com / password123');
console.log('  User:   jamie.reyes@unosquare.com / password123');
console.log('  User:   taylor.chen@unosquare.com / password123');
console.log('  User:   jordan.patel@unosquare.com / password123');
