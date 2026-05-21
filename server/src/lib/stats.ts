interface Participation {
  userId: string;
  sessionId: string;
  startWeightKg: number;
  goalWeightKg: number;
}

interface WeighIn {
  userId: string;
  sessionId: string;
  weightKg: number;
  bodyFatPct?: number | null;
  weekIndex: number;
}

interface User {
  id: string;
  name: string;
  avatarColor: string;
}

interface Session {
  id: string;
  startDate: string;
  weeks: number;
}

export interface ParticipantStats {
  userId: string;
  userName: string;
  avatarColor: string;
  cumulativePct: number;
  weeklyDelta: number;
  bestWeekLoss: number;
  currentLossStreak: number;
  currentWeightKg: number | null;
  startWeightKg: number;
  weeksLogged: number;
}

const weighInsForUserSession = (
  weighIns: WeighIn[],
  userId: string,
  sessionId: string,
) => weighIns.filter((w) => w.userId === userId && w.sessionId === sessionId);

const carryForwardWeights = (
  participation: Participation,
  weighIns: WeighIn[],
  upToWeekInclusive: number,
): (number | null)[] => {
  const userWeighIns = weighInsForUserSession(weighIns, participation.userId, participation.sessionId)
    .sort((a, b) => a.weekIndex - b.weekIndex);

  const result: (number | null)[] = [];
  let last: number = participation.startWeightKg;
  for (let i = 0; i <= upToWeekInclusive; i++) {
    const direct = userWeighIns.find((w) => w.weekIndex === i);
    if (direct) {
      last = direct.weightKg;
      result.push(last);
    } else if (i === 0) {
      result.push(participation.startWeightKg);
    } else {
      result.push(last);
    }
  }
  return result;
};

interface WeeklyPoint {
  weekIndex: number;
  weightKg: number;
  pctFromStart: number;
  delta: number;
}

export const weeklyPointsFor = (
  participation: Participation,
  weighIns: WeighIn[],
  upToWeekInclusive: number,
): WeeklyPoint[] => {
  const weights = carryForwardWeights(participation, weighIns, upToWeekInclusive);
  const start = participation.startWeightKg;
  return weights.map((weight, i) => {
    const prev = i === 0 ? start : weights[i - 1] ?? start;
    const w = weight ?? start;
    return {
      weekIndex: i,
      weightKg: w,
      pctFromStart: ((start - w) / start) * 100,
      delta: ((prev - w) / prev) * 100,
    };
  });
};

const longestLossStreak = (points: WeeklyPoint[]): number => {
  let streak = 0;
  for (let i = points.length - 1; i >= 1; i--) {
    if (points[i].weightKg < points[i - 1].weightKg) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const computeParticipantStats = (
  user: User,
  participation: Participation,
  weighIns: WeighIn[],
  weekIndex: number,
): ParticipantStats => {
  const points = weeklyPointsFor(participation, weighIns, weekIndex);
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];

  const cumulativePct = latest ? latest.pctFromStart : 0;
  const weeklyDelta = prior && latest ? ((prior.weightKg - latest.weightKg) / prior.weightKg) * 100 : 0;
  const bestWeekLoss = points.reduce(
    (acc, point, idx) => (idx === 0 ? acc : Math.max(acc, point.delta)),
    0,
  );

  const directLogs = weighInsForUserSession(weighIns, user.id, participation.sessionId);
  const distinctWeeksLogged = new Set(directLogs.map((w) => w.weekIndex)).size;

  return {
    userId: user.id,
    userName: user.name,
    avatarColor: user.avatarColor,
    cumulativePct,
    weeklyDelta,
    bestWeekLoss,
    currentLossStreak: longestLossStreak(points),
    currentWeightKg: latest?.weightKg ?? participation.startWeightKg,
    startWeightKg: participation.startWeightKg,
    weeksLogged: distinctWeeksLogged,
  };
};

export const computeLeaderboard = (
  session: Session,
  users: User[],
  participations: Participation[],
  weighIns: WeighIn[],
  weekIndex: number,
): ParticipantStats[] => {
  const inSession = participations.filter((p) => p.sessionId === session.id);
  return inSession
    .map((p) => {
      const user = users.find((u) => u.id === p.userId);
      if (!user) return null;
      return computeParticipantStats(user, p, weighIns, weekIndex);
    })
    .filter((s): s is ParticipantStats => s !== null)
    .sort((a, b) => b.cumulativePct - a.cumulativePct);
};

export const computeRanksForSession = (
  board: ParticipantStats[],
): Record<string, number> => {
  const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
  return Object.fromEntries(sorted.map((p, i) => [p.userId, i + 1]));
};

export const currentWeekIndex = (session: Session, now: Date = new Date()) => {
  const start = new Date(session.startDate);
  const diffMs = now.getTime() - start.getTime();
  const idx = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(session.weeks - 1, idx));
};
