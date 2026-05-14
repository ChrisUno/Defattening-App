import { faker } from '@faker-js/faker';
import { addWeeks, formatISO, subDays, subWeeks } from 'date-fns';
import type {
  ActivityEntry,
  JournalEntry,
  Participation,
  Session,
  User,
  WeighIn,
} from '../types';

faker.seed(20260514);

const AVATAR_COLORS = [
  '#2563EB',
  '#1D4ED8',
  '#1E40AF',
  '#0EA5E9',
  '#0284C7',
  '#0369A1',
  '#06B6D4',
  '#0891B2',
  '#3B82F6',
  '#6366F1',
  '#4F46E5',
  '#4338CA',
  '#7C3AED',
  '#8B5CF6',
  '#0F766E',
  '#14B8A6',
];

const pickColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

const journalSnippets = [
  'Hit the gym 4x this week and meal-prepped Sunday. Feeling strong!',
  'Stressful week at work, snacked too much. Resetting tomorrow.',
  'Walking 10k steps a day is a game changer.',
  'Wedding on Saturday wrecked the diet — totally worth the cake.',
  'Tried intermittent fasting, surprisingly easy by Friday.',
  'Stuck on a plateau. Going to switch up cardio next week.',
  'Made it through happy hour with sparkling water. Proud of myself.',
  'Bumped protein up to 150g/day and finally feel less hungry.',
  'Bad sleep all week — definitely felt it on the scale.',
  'Switched from coffee creamer to oat milk. Small win.',
  'Date night = pizza and zero regrets.',
  'Yoga twice this week was clutch for the back pain.',
  'Climbed 3 floors of stairs without dying. Progress.',
  'Tracked every meal in the app. Eye opening.',
  'Took rest days seriously this week. Body needed it.',
];

const buildUsers = (): User[] => {
  const admin: User = {
    id: 'user-admin',
    email: 'admin@unosquare.com',
    password: 'admin',
    name: 'Sam Rivera',
    avatarColor: '#312E81',
    role: 'admin',
    heightCm: 178,
    createdAt: formatISO(subWeeks(new Date(), 30)),
  };

  const teamMembers: User[] = [];
  for (let i = 0; i < 19; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    teamMembers.push({
      id: `user-${i + 1}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@unosquare.com`,
      password: 'password',
      name: `${firstName} ${lastName}`,
      avatarColor: pickColor(i + 3),
      role: 'user',
      heightCm: faker.number.int({ min: 155, max: 192 }),
      createdAt: formatISO(subWeeks(new Date(), faker.number.int({ min: 5, max: 25 }))),
    });
  }

  const you: User = {
    id: 'user-you',
    email: 'you@unosquare.com',
    password: 'password',
    name: 'Alex Morgan',
    avatarColor: '#2563EB',
    role: 'user',
    heightCm: 172,
    createdAt: formatISO(subWeeks(new Date(), 8)),
  };

  return [admin, you, ...teamMembers];
};

const buildSessions = (): Session[] => {
  const today = new Date();
  return [
    {
      id: 'session-spring-2026',
      name: 'Spring Slimdown 2026',
      description: 'Eight weeks to bikini bonfire season. Bring snacks (the healthy kind).',
      weeks: 8,
      weighInDayOfWeek: 1,
      weighInNote: 'Official weigh-in is every Monday morning. Log by Tuesday night to count.',
      startDate: formatISO(subWeeks(today, 7)),
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
      startDate: formatISO(subWeeks(today, 15)),
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
      startDate: formatISO(addWeeks(today, 5)),
      status: 'upcoming',
      createdBy: 'user-admin',
    },
  ];
};

const buildParticipationsAndLogs = (users: User[], sessions: Session[]) => {
  const participations: Participation[] = [];
  const weighIns: WeighIn[] = [];
  const journals: JournalEntry[] = [];

  const spring = sessions.find((s) => s.id === 'session-spring-2026')!;
  const winter = sessions.find((s) => s.id === 'session-winter-2026')!;

  const springCurrentWeek = 7;

  users
    .filter((u) => u.role === 'user')
    .forEach((user, idx) => {
      const startWeight = faker.number.float({ min: 62, max: 118, fractionDigits: 1 });
      const goal = +(startWeight - faker.number.float({ min: 4, max: 12, fractionDigits: 1 })).toFixed(1);

      participations.push({
        id: `part-${spring.id}-${user.id}`,
        userId: user.id,
        sessionId: spring.id,
        startWeightKg: startWeight,
        goalWeightKg: goal,
        joinedAt: spring.startDate,
      });

      let weight = startWeight;
      const tracksBodyFat = idx % 3 !== 0;
      let bodyFat = tracksBodyFat
        ? faker.number.float({ min: 22, max: 34, fractionDigits: 1 })
        : null;
      const isYou = user.id === 'user-you';
      for (let week = 0; week <= springCurrentWeek; week += 1) {
        const skipThisWeek =
          (isYou && week === springCurrentWeek) ||
          (week > 0 && faker.number.float({ min: 0, max: 1 }) < 0.12);
        if (skipThisWeek) continue;

        let change: number;
        if (week === 0) {
          change = 0;
        } else if (idx % 11 === 0) {
          change = faker.number.float({ min: -0.5, max: 0.9, fractionDigits: 1 });
        } else {
          change = faker.number.float({ min: -1.6, max: 0.4, fractionDigits: 1 });
        }
        weight = Math.max(weight + change, goal - 2);
        if (bodyFat != null) {
          bodyFat = Math.max(
            14,
            bodyFat + (week === 0 ? 0 : faker.number.float({ min: -0.6, max: 0.2, fractionDigits: 1 })),
          );
        }

        const measuredAt = formatISO(addWeeks(new Date(spring.startDate), week));
        weighIns.push({
          id: `weighin-${user.id}-${spring.id}-${week}`,
          userId: user.id,
          sessionId: spring.id,
          weightKg: +weight.toFixed(1),
          bodyFatPct: bodyFat != null ? +bodyFat.toFixed(1) : undefined,
          weekIndex: week,
          measuredAt,
          recordedAt: measuredAt,
        });

        if (faker.number.float({ min: 0, max: 1 }) < 0.55) {
          journals.push({
            id: `journal-${user.id}-${spring.id}-${week}`,
            userId: user.id,
            sessionId: spring.id,
            weekIndex: week,
            content: faker.helpers.arrayElement(journalSnippets),
            createdAt: formatISO(addWeeks(new Date(spring.startDate), week)),
          });
        }
      }
    });

  users
    .filter((u) => u.role === 'user')
    .slice(0, 14)
    .forEach((user) => {
      const startWeight = faker.number.float({ min: 65, max: 120, fractionDigits: 1 });
      const goal = +(startWeight - faker.number.float({ min: 4, max: 10, fractionDigits: 1 })).toFixed(1);

      participations.push({
        id: `part-${winter.id}-${user.id}`,
        userId: user.id,
        sessionId: winter.id,
        startWeightKg: startWeight,
        goalWeightKg: goal,
        joinedAt: winter.startDate,
      });

      let weight = startWeight;
      for (let week = 0; week < winter.weeks; week += 1) {
        const change = week === 0 ? 0 : faker.number.float({ min: -1.4, max: 0.3, fractionDigits: 1 });
        weight = Math.max(weight + change, goal - 1);
        const measuredAt = formatISO(addWeeks(new Date(winter.startDate), week));
        weighIns.push({
          id: `weighin-${user.id}-${winter.id}-${week}`,
          userId: user.id,
          sessionId: winter.id,
          weightKg: +weight.toFixed(1),
          weekIndex: week,
          measuredAt,
          recordedAt: measuredAt,
        });
      }
    });

  return { participations, weighIns, journals };
};

const buildActivityFeed = (
  users: User[],
  sessions: Session[],
  participations: Participation[],
  weighIns: WeighIn[],
): ActivityEntry[] => {
  const spring = sessions.find((s) => s.id === 'session-spring-2026');
  if (!spring) return [];

  const standings = participations
    .filter((p) => p.sessionId === spring.id)
    .map((p) => {
      const userWeighIns = weighIns
        .filter((w) => w.userId === p.userId && w.sessionId === spring.id)
        .sort((a, b) => b.weekIndex - a.weekIndex);
      const latest = userWeighIns[0]?.weightKg ?? p.startWeightKg;
      const pct = ((p.startWeightKg - latest) / p.startWeightKg) * 100;
      return { userId: p.userId, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const pickIdx = (offset: number) => Math.min(standings.length - 1, Math.max(0, offset));

  const draftEntries: { actorIdx: number; targetIdx: number; daysAgo: number }[] = [
    { actorIdx: 2, targetIdx: 1, daysAgo: 1 },
    { actorIdx: 5, targetIdx: 4, daysAgo: 3 },
    { actorIdx: 4, targetIdx: 3, daysAgo: 5 },
    { actorIdx: 7, targetIdx: 6, daysAgo: 6 },
  ];

  const now = new Date();
  let n = 0;
  return draftEntries
    .map((d): ActivityEntry | null => {
      const actor = standings[pickIdx(d.actorIdx)];
      const target = standings[pickIdx(d.targetIdx)];
      if (!actor || !target || actor.userId === target.userId) return null;
      if (!users.find((u) => u.id === actor.userId) || !users.find((u) => u.id === target.userId))
        return null;
      n += 1;
      return {
        id: `activity-seed-${n}`,
        type: 'overtake',
        occurredAt: formatISO(subDays(now, d.daysAgo)),
        sessionId: spring.id,
        actorUserId: actor.userId,
        targetUserId: target.userId,
        actorPct: actor.pct,
        targetPct: target.pct,
      };
    })
    .filter((e): e is ActivityEntry => e !== null);
};

export const buildInitialData = () => {
  const users = buildUsers();
  const sessions = buildSessions();
  const { participations, weighIns, journals } = buildParticipationsAndLogs(users, sessions);
  const activityFeed = buildActivityFeed(users, sessions, participations, weighIns);

  return {
    users,
    sessions,
    participations,
    weighIns,
    journals,
    activityFeed,
  };
};
