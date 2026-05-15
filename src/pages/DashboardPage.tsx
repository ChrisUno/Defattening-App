import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  Scale,
  Crown,
  Flame,
  TrendingDown,
  TrendingUp,
  ChartLine,
  ArrowRight,
  Pencil,
  CalendarClock,
  CalendarHeart,
  Sparkles,
  NotebookPen,
  Activity,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfDay,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Dialog } from '../components/ui/Dialog';
import { Input, Label } from '../components/ui/Input';
import { WeighInModal } from '../components/WeighInModal';
import { PersonalProgressChart } from '../components/PersonalProgressChart';
import { SessionBanner } from '../components/SessionBanner';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { RivalCard } from '../components/RivalCard';
import { PursuerCard } from '../components/PursuerCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { BmiDialog } from '../components/BmiDialog';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  carryForwardWeights,
  computeLeaderboard,
  computeParticipantStats,
  currentWeekIndex,
  findPursuer,
  findRival,
  formatPct,
  latestBodyFatPct,
  userHasWeighedInThisWeek,
  userJournalForWeek,
} from '../lib/stats';

const DashboardPage = () => {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const weighIns = useDataStore((s) => s.weighIns);
  const journals = useDataStore((s) => s.journals);
  const activityFeed = useDataStore((s) => s.activityFeed);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const updateParticipation = useDataStore((s) => s.updateParticipation);
  const user = useAuthStore((s) => s.currentUser);

  const [weighInOpen, setWeighInOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bmiOpen, setBmiOpen] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);

  const session = sessions.find((s) => s.id === activeSessionId);
  const participation = session ? participations.find(
    (p) => p.userId === user?.id && p.sessionId === activeSessionId,
  ) : undefined;

  const weekIdx = session ? currentWeekIndex(session) : 0;

  const leaderboard = useMemo(
    () => session ? computeLeaderboard(session, users, participations, weighIns, weekIdx) : [],
    [session, users, participations, weighIns, weekIdx],
  );

  const rivalInfo = useMemo(
    () => (user ? findRival(leaderboard, user.id) : null),
    [leaderboard, user],
  );

  const pursuerInfo = useMemo(
    () => (user ? findPursuer(leaderboard, user.id) : null),
    [leaderboard, user],
  );

  const recentMovers = useMemo(() => {
    if (!session) return new Set<string>();
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const moverIds = new Set<string>();
    for (const entry of activityFeed) {
      if (entry.sessionId !== session.id) continue;
      if (Date.parse(entry.occurredAt) < cutoff) continue;
      moverIds.add(entry.actorUserId);
    }
    return moverIds;
  }, [activityFeed, session?.id]);

  const myStats = useMemo(() => {
    if (!user || !participation) return null;
    return computeParticipantStats(user, participation, weighIns, weekIdx);
  }, [user, participation, weighIns, weekIdx]);

  const myWeighedIn = useMemo(() => {
    if (!user || !session) return false;
    return userHasWeighedInThisWeek(user.id, session.id, weekIdx, weighIns);
  }, [user, session, weekIdx, weighIns]);

  const journalCount = useMemo(() => {
    if (!user || !session) return 0;
    return journals.filter((j) => j.userId === user.id && j.sessionId === session.id).length;
  }, [journals, user, session]);

  const lastJournal = useMemo(() => {
    if (!user || !session) return null;
    return userJournalForWeek(user.id, session.id, weekIdx, journals);
  }, [user, session, weekIdx, journals]);

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (!participation || !myStats) return null;

  const hasEnoughDataForBoard = weighIns.filter((w) => w.sessionId === session.id).length >= 4;
  const topUserId = leaderboard[0]?.userId;
  const myRank = leaderboard.findIndex((p) => p.userId === user.id) + 1;
  const today = startOfDay(new Date());
  const daysUntilWeighIn = (session.weighInDayOfWeek - today.getDay() + 7) % 7;
  const nextWeighInDate = addDays(today, daysUntilWeighIn);
  const daysAway = differenceInCalendarDays(nextWeighInDate, today);

  const weights = carryForwardWeights(participation, weighIns, weekIdx);
  const currentWeight = weights[weights.length - 1] ?? participation.startWeightKg;
  const totalLostKg = participation.startWeightKg - currentWeight;
  const goalDeltaKg = currentWeight - participation.goalWeightKg;
  const currentBodyFat = latestBodyFatPct(user.id, session.id, weighIns);

  const handleWeighInSuccess = () => {
    setConfettiTick((t) => t + 1);
  };

  const daysAwayLabel =
    daysAway === 0
      ? 'Today — step on the scale'
      : daysAway === 1
        ? 'Tomorrow'
        : `In ${daysAway} days`;

  return (
    <div className="space-y-8">
      <ConfettiBurst trigger={confettiTick} />

      <section>
        <div
          className={
            'rounded-3xl border-2 px-5 py-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-4 ' +
            (daysAway === 0
              ? 'bg-tangerine-500 text-cream-50 border-tangerine-700 shadow-[0_4px_0_0_var(--color-tangerine-700)]'
              : 'bg-cream-50 text-ink-900 border-ink-900/10 shadow-[0_2px_0_0_rgba(11,23,51,0.05)]')
          }
        >
          <span
            className={
              'inline-flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ' +
              (daysAway === 0
                ? 'bg-cream-50/15 text-cream-50 animate-pulse-glow'
                : 'bg-tangerine-50 text-tangerine-700')
            }
          >
            <CalendarHeart size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={
                'text-[11px] uppercase tracking-wider font-bold ' +
                (daysAway === 0 ? 'text-cream-50/80' : 'text-ink-500')
              }
            >
              Next weigh-in
            </p>
            <p className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {format(nextWeighInDate, 'EEEE, MMM d')}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <span
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ' +
                (daysAway === 0
                  ? 'bg-cream-50 text-tangerine-700'
                  : 'bg-tangerine-50 text-tangerine-700 border-2 border-tangerine-300/40')
              }
            >
              {daysAwayLabel}
            </span>
            {!myWeighedIn && daysAway === 0 && (
              <button
                onClick={() => setWeighInOpen(true)}
                className="text-xs font-bold underline underline-offset-4 hover:opacity-90"
              >
                Log it now →
              </button>
            )}
          </div>
        </div>
      </section>

      <SessionBanner session={session} weekIndex={weekIdx} />

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Badge tone="tangerine" className="mb-3">
              <Flame size={12} /> {session.name} · Week {weekIdx + 1} of {session.weeks}
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
              Hey {user.name.split(' ')[0]}, ready to{' '}
              <span className="text-tangerine-500">lose a little</span>?
            </h1>
            <p className="mt-2 text-ink-700 max-w-xl">{session.weighInNote}</p>
          </motion.div>

          <div className="flex flex-col sm:items-end gap-2">
            <Button
              size="lg"
              onClick={() => setWeighInOpen(true)}
              leftIcon={<Scale size={18} />}
              className={myWeighedIn ? '' : 'animate-pulse-glow'}
            >
              {myWeighedIn ? 'Update this week\'s weigh-in' : 'Weigh-in'}
            </Button>
            {myWeighedIn && (
              <p className="text-xs text-ink-500 font-semibold">
                ✓ Logged for week {weekIdx + 1}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Cumulative loss"
          icon={<TrendingDown size={16} />}
          value={formatPct(myStats.cumulativePct)}
          sub={`${totalLostKg >= 0 ? '−' : '+'}${Math.abs(totalLostKg).toFixed(1)} kg total`}
          tone="lime"
          positive={myStats.cumulativePct >= 0}
        />
        <StatTile
          label="This week"
          icon={myStats.weeklyDelta >= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
          value={formatPct(myStats.weeklyDelta)}
          sub={`vs last week`}
          tone="tangerine"
          positive={myStats.weeklyDelta >= 0}
        />
        <StatTile
          label="Best single week"
          icon={<Sparkles size={16} />}
          value={formatPct(myStats.bestWeekLoss)}
          sub="Personal record"
          tone="grape"
          positive
        />
        <StatTile
          label="Loss streak"
          icon={<Flame size={16} />}
          value={`${myStats.currentLossStreak} wk`}
          sub={myStats.currentLossStreak >= 2 ? 'On fire 🔥' : 'Build it up'}
          tone="sunny"
          positive={myStats.currentLossStreak > 0}
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-6 pb-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <ChartLine size={18} className="text-tangerine-500" />
                Your weight loss journey
              </h2>
              <p className="text-sm text-ink-500">
                Goal in green, start in indigo. You&apos;re the blue line.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                  Goal distance
                </p>
                <p className="text-lg font-display font-bold text-ink-900">
                  {goalDeltaKg > 0
                    ? `${goalDeltaKg.toFixed(1)} kg to go`
                    : 'Goal hit · keep going!'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBmiOpen(true)}
                leftIcon={<Activity size={14} />}
              >
                BMI
              </Button>
            </div>
          </div>
          <div className="px-3 pb-5">
            <PersonalProgressChart
              participation={participation}
              weighIns={weighIns}
              weekIndex={weekIdx}
              totalWeeks={session.weeks}
            />
          </div>
        </Card>

        <Card className="flex flex-col" tone="ink">
          <p className="text-[11px] uppercase tracking-wider font-bold text-tangerine-300">
            Your private stats
          </p>
          <h3 className="font-display text-xl font-bold mt-1">Only you can see this</h3>
          <dl className="mt-6 space-y-4 flex-1">
            <PrivateRow label="Start weight" value={`${participation.startWeightKg.toFixed(1)} kg`} />
            <PrivateRow label="Current weight" value={`${currentWeight.toFixed(1)} kg`} highlight />
            <PrivateRow label="Goal weight" value={`${participation.goalWeightKg.toFixed(1)} kg`} />
            {currentBodyFat != null && (
              <PrivateRow
                label="Body fat"
                value={`${currentBodyFat.toFixed(1)} %`}
              />
            )}
            <PrivateRow
              label="Weeks logged"
              value={`${myStats.weeksLogged} / ${session.weeks}`}
            />
            <PrivateRow
              label="Journal entries"
              value={`${journalCount}`}
              icon={<NotebookPen size={12} />}
            />
          </dl>
          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full !bg-transparent !text-cream-50 !border-cream-50 hover:!bg-cream-50/10 hover:!text-cream-50"
            onClick={() => setEditOpen(true)}
            leftIcon={<Pencil size={14} />}
          >
            Edit start / goal weight
          </Button>
        </Card>
      </section>

      {hasEnoughDataForBoard && (
        <section className="grid lg:grid-cols-2 gap-4">
          <RivalCard
            rival={rivalInfo?.rival ?? null}
            gap={rivalInfo?.gap ?? 0}
            userRank={rivalInfo?.userRank ?? null}
            totalParticipants={leaderboard.length}
            hasRival={!!rivalInfo}
            youTotalPct={myStats.cumulativePct}
          />
          <PursuerCard
            pursuer={pursuerInfo?.pursuer ?? null}
            gap={pursuerInfo?.gap ?? 0}
            userRank={pursuerInfo?.userRank ?? null}
            totalParticipants={leaderboard.length}
            hasPursuer={!!pursuerInfo}
            youTotalPct={myStats.cumulativePct}
          />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Crown size={20} className="text-tangerine-500" />
              The leaderboard
            </h2>
            <p className="text-sm text-ink-500">
              You&apos;re currently {myRank ? `#${myRank} of ${leaderboard.length}` : 'unranked'}. No pressure.
            </p>
          </div>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1 text-sm font-semibold text-tangerine-500 hover:text-tangerine-600"
          >
            Full comparison
            <ArrowRight size={14} />
          </Link>
        </div>

        {!hasEnoughDataForBoard ? (
          <Card>
            <div className="text-center py-6">
              <CalendarClock size={28} className="mx-auto text-ink-500" />
              <p className="mt-3 font-display text-lg font-semibold">
                Leaderboard wakes up after a few weigh-ins
              </p>
              <p className="text-sm text-ink-500 max-w-md mx-auto">
                We hide rankings until enough people have logged a weight. Be the spark — log yours.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink-900/10 bg-cream-100/60">
                    <th className="text-left px-5 py-3 font-bold text-[11px] uppercase tracking-wider text-ink-500">
                      #
                    </th>
                    <th className="text-left px-3 py-3 font-bold text-[11px] uppercase tracking-wider text-ink-500">
                      Participant
                    </th>
                    <th className="text-right px-3 py-3 font-bold text-[11px] uppercase tracking-wider text-ink-500">
                      Cumulative
                    </th>
                    <th className="text-right px-3 py-3 font-bold text-[11px] uppercase tracking-wider text-ink-500 hidden sm:table-cell">
                      This week
                    </th>
                    <th className="text-right px-5 py-3 font-bold text-[11px] uppercase tracking-wider text-ink-500 hidden md:table-cell">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 6).map((row, idx) => {
                    const isMe = row.userId === user.id;
                    const isTop = row.userId === topUserId;
                    const justOvertook = recentMovers.has(row.userId);
                    return (
                      <tr
                        key={row.userId}
                        className={
                          'border-b border-ink-900/5 last:border-0 ' +
                          (isMe ? 'bg-tangerine-50/60' : '')
                        }
                      >
                        <td className="px-5 py-3 font-bold text-ink-700">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={row.userName}
                              color={row.avatarColor}
                              size="sm"
                            />
                            <span className="font-semibold text-ink-900 inline-flex items-center gap-1.5">
                              {isMe ? `${row.userName} (you)` : row.userName}
                              {justOvertook && (
                                <span
                                  title="Recently overtook someone"
                                  className="inline-flex items-center gap-0.5 rounded-full bg-tangerine-500 text-cream-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                >
                                  <Flame size={9} /> Mover
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-lime-600">
                            {isTop && <Crown size={14} className="text-tangerine-500" />}
                            {formatPct(row.cumulativePct)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums hidden sm:table-cell">
                          <span
                            className={
                              row.weeklyDelta >= 0
                                ? 'text-lime-600 font-semibold'
                                : 'text-rose-bright font-semibold'
                            }
                          >
                            {formatPct(row.weeklyDelta)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
                            <Flame size={12} className="text-tangerine-500" />
                            {row.currentLossStreak}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {hasEnoughDataForBoard && (
        <section>
          <ActivityFeed
            entries={activityFeed}
            users={users}
            currentUserId={user.id}
            sessionId={session.id}
            max={6}
          />
        </section>
      )}

      {lastJournal && (
        <section>
          <Card tone="grape">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 text-grape-700">
                <NotebookPen size={18} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider font-bold text-grape-700">
                  Your private journal · Week {weekIdx + 1}
                </p>
                <p className="mt-2 text-ink-900 italic">&ldquo;{lastJournal.content}&rdquo;</p>
                <p className="mt-2 text-xs text-ink-500">
                  Logged {format(parseISO(lastJournal.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      <WeighInModal
        open={weighInOpen}
        onClose={() => setWeighInOpen(false)}
        onSuccess={handleWeighInSuccess}
      />

      <EditDataDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        startWeight={participation.startWeightKg}
        goalWeight={participation.goalWeightKg}
        onSave={async (s, g) => {
          await updateParticipation(participation.id, { startWeightKg: s, goalWeightKg: g });
          setEditOpen(false);
        }}
      />

      <BmiDialog
        open={bmiOpen}
        onClose={() => setBmiOpen(false)}
        user={user}
        currentWeightKg={currentWeight}
        participation={participation}
        weighIns={weighIns}
        weekIndex={weekIdx}
        sessionStartDate={session.startDate}
      />
    </div>
  );
};

interface StatTileProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: 'tangerine' | 'lime' | 'grape' | 'sunny';
  positive: boolean;
}

const StatTile = ({ label, value, sub, icon, tone, positive }: StatTileProps) => {
  const toneBg = {
    tangerine: 'bg-tangerine-50 border-tangerine-300/40',
    lime: 'bg-lime-300/20 border-lime-500/40',
    grape: 'bg-grape-50 border-grape-300/40',
    sunny: 'bg-cream-100 border-tangerine-300/40',
  }[tone];

  return (
    <div className={`rounded-2xl border-2 px-4 py-4 ${toneBg}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-ink-700">{label}</p>
        <span className="text-ink-500">{icon}</span>
      </div>
      <p
        className={`font-display text-2xl sm:text-3xl font-bold mt-1 tabular-nums ${
          positive ? 'text-ink-900' : 'text-rose-bright'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-ink-500 font-medium mt-0.5">{sub}</p>
    </div>
  );
};

interface PrivateRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

const PrivateRow = ({ label, value, highlight, icon }: PrivateRowProps) => (
  <div className="flex items-center justify-between gap-3 border-b border-cream-50/10 pb-3 last:border-0 last:pb-0">
    <dt className="text-xs uppercase tracking-wider font-bold text-cream-200/80 inline-flex items-center gap-1">
      {icon}
      {label}
    </dt>
    <dd
      className={
        'font-display font-bold tabular-nums ' +
        (highlight ? 'text-tangerine-300 text-lg' : 'text-cream-50 text-base')
      }
    >
      {value}
    </dd>
  </div>
);

interface EditDataDialogProps {
  open: boolean;
  onClose: () => void;
  startWeight: number;
  goalWeight: number;
  onSave: (s: number, g: number) => void;
}

const EditDataDialog = ({ open, onClose, startWeight, goalWeight, onSave }: EditDataDialogProps) => {
  const [sw, setSw] = useState(startWeight.toFixed(1));
  const [gw, setGw] = useState(goalWeight.toFixed(1));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSw(startWeight.toFixed(1));
      setGw(goalWeight.toFixed(1));
      setError('');
    }
  }, [open, startWeight, goalWeight]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(sw);
    const g = Number(gw);
    if (!s || !g || s < 30 || s > 300 || g <= 0 || g >= s) {
      setError('Goal must be less than start. Both weights between 30–300 kg.');
      return;
    }
    onSave(+s.toFixed(1), +g.toFixed(1));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit your inputs"
      description="Only you and the Admin see these numbers."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Starting weight</Label>
          <Input
            type="number"
            step="0.1"
            value={sw}
            onChange={(e) => setSw(e.target.value)}
            suffix="kg"
          />
        </div>
        <div>
          <Label>Goal weight</Label>
          <Input
            type="number"
            step="0.1"
            value={gw}
            onChange={(e) => setGw(e.target.value)}
            suffix="kg"
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-rose-bright">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Dialog>
  );
};

export default DashboardPage;
