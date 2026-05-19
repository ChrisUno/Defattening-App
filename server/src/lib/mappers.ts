export const toUser = (row: any) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  avatarColor: row.avatar_color,
  role: row.role,
  heightCm: row.height_cm,
  isTempAdmin: row.is_temp_admin,
  tempAdminExpiresAt: row.temp_admin_expires_at,
  createdAt: row.created_at,
});

export const toSession = (row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  weeks: row.weeks,
  weighInDayOfWeek: row.weigh_in_day_of_week,
  weighInNote: row.weigh_in_note,
  startDate: row.start_date,
  status: row.status,
  createdBy: row.created_by,
});

export const toParticipation = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  startWeightKg: row.start_weight_kg,
  goalWeightKg: row.goal_weight_kg,
  joinedAt: row.joined_at,
});

export const toWeighIn = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weightKg: row.weight_kg,
  bodyFatPct: row.body_fat_pct,
  weekIndex: row.week_index,
  measuredAt: row.measured_at,
  recordedAt: row.recorded_at,
});

export const toJournal = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weekIndex: row.week_index,
  content: row.content,
  createdAt: row.created_at,
});

export const toActivity = (row: any) => ({
  id: row.id,
  type: row.type,
  occurredAt: row.occurred_at,
  sessionId: row.session_id,
  actorUserId: row.actor_user_id,
  targetUserId: row.target_user_id,
  actorPct: row.actor_pct,
  targetPct: row.target_pct,
});
