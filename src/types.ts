export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  avatarColor: string;
  role: UserRole;
  heightCm?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  description: string;
  weeks: number;
  weighInDayOfWeek: number;
  weighInNote: string;
  startDate: string;
  status: 'active' | 'completed' | 'upcoming';
  createdBy: string;
}

export interface Participation {
  id: string;
  userId: string;
  sessionId: string;
  startWeightKg: number;
  goalWeightKg: number;
  joinedAt: string;
}

export interface WeighIn {
  id: string;
  userId: string;
  sessionId: string;
  weightKg: number;
  bodyFatPct?: number;
  weekIndex: number;
  measuredAt: string;
  recordedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  sessionId: string;
  weekIndex: number;
  content: string;
  createdAt: string;
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

export interface WeeklyPoint {
  weekIndex: number;
  weightKg: number;
  pctFromStart: number;
  delta: number;
}

export interface ActivityEntry {
  id: string;
  type: 'overtake';
  occurredAt: string;
  sessionId: string;
  actorUserId: string;
  targetUserId: string;
  actorPct: number;
  targetPct: number;
}

