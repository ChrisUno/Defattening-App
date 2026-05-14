import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Crown,
  Trophy,
  NotebookPen,
  Calendar,
  Flame,
  Sparkles,
  Ruler,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useCurrentUser } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import {
  carryForwardWeights,
  computeLeaderboard,
  computeParticipantStats,
  currentWeekIndex,
  formatPct,
} from '../lib/stats';
import { calculateBmi, categoryForBmi, categoryLabel } from '../lib/bmi';

const ProfilePage = () => {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const weighIns = useDataStore((s) => s.weighIns);
  const journals = useDataStore((s) => s.journals);
  const updateUser = useDataStore((s) => s.updateUser);
  const pushToast = useUiStore((s) => s.pushToast);
  const user = useCurrentUser(users);

  const [editingHeight, setEditingHeight] = useState(false);
  const [heightDraft, setHeightDraft] = useState('');
  const [heightError, setHeightError] = useState('');

  useEffect(() => {
    setHeightDraft(user?.heightCm?.toString() ?? '');
  }, [user?.heightCm]);

  const myParts = useMemo(
    () => (user ? participations.filter((p) => p.userId === user.id) : []),
    [participations, user],
  );

  const myJournalCount = useMemo(
    () => (user ? journals.filter((j) => j.userId === user.id).length : 0),
    [journals, user],
  );

  const currentWeightKg = useMemo<number | null>(() => {
    if (!user) return null;
    const active = myParts.find((p) => {
      const s = sessions.find((x) => x.id === p.sessionId);
      return s?.status === 'active';
    });
    if (!active) return null;
    const session = sessions.find((s) => s.id === active.sessionId);
    if (!session) return null;
    const week = currentWeekIndex(session);
    const carry = carryForwardWeights(active, weighIns, week);
    return carry[carry.length - 1] ?? active.startWeightKg;
  }, [user, myParts, sessions, weighIns]);

  const currentBmi = useMemo<number | null>(() => {
    if (!user?.heightCm || currentWeightKg == null) return null;
    return calculateBmi(currentWeightKg, user.heightCm);
  }, [user?.heightCm, currentWeightKg]);

  if (!user) return null;

  const saveHeight = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cm = Number(heightDraft);
    if (!cm || cm < 100 || cm > 230) {
      setHeightError('Height should be between 100 and 230 cm.');
      return;
    }
    updateUser(user.id, { heightCm: Math.round(cm) });
    setEditingHeight(false);
    setHeightError('');
    pushToast({ title: 'Height saved', variant: 'success' });
  };

  const sessionEntries = myParts
    .map((part) => {
      const session = sessions.find((s) => s.id === part.sessionId)!;
      const lastWeek = session.status === 'completed' ? session.weeks - 1 : currentWeekIndex(session);
      const stats = computeParticipantStats(user, part, weighIns, lastWeek);
      const board = computeLeaderboard(session, users, participations, weighIns, lastWeek);
      const rank = board.findIndex((b) => b.userId === user.id) + 1;
      const totalLogged = weighIns.filter(
        (w) => w.userId === user.id && w.sessionId === session.id,
      ).length;
      return { session, part, stats, rank, total: board.length, totalLogged, lastWeek };
    })
    .sort((a, b) => parseISO(b.session.startDate).getTime() - parseISO(a.session.startDate).getTime());

  const completed = sessionEntries.filter((e) => e.session.status === 'completed');
  const allTimeBest = completed.reduce((acc, e) => Math.max(acc, e.stats.cumulativePct), 0);
  const allTimeCrowns = completed.filter((e) => e.rank === 1).length;

  const heightFeet = user.heightCm ? Math.floor(user.heightCm / 30.48) : 0;
  const heightInches = user.heightCm
    ? Math.round((user.heightCm - heightFeet * 30.48) / 2.54)
    : 0;

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Avatar name={user.name} color={user.avatarColor} size="xl" />
        <div className="flex-1">
          <Badge tone={user.role === 'admin' ? 'grape' : 'tangerine'} className="mb-2">
            {user.role === 'admin' ? 'Admin' : 'Challenger'}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
            {user.name}
          </h1>
          <p className="text-ink-500 font-medium">{user.email}</p>
          <p className="text-xs text-ink-500 mt-1">
            Joined the platform {format(parseISO(user.createdAt), 'MMMM yyyy')}
          </p>
        </div>
      </section>

      <section>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-tangerine-50 text-tangerine-700 shrink-0">
                <Ruler size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-bold text-ink-500">
                  Height
                </p>
                {editingHeight ? (
                  <form onSubmit={saveHeight} className="mt-2 flex items-center gap-2 max-w-sm">
                    <Input
                      autoFocus
                      type="number"
                      inputMode="numeric"
                      min="100"
                      max="230"
                      value={heightDraft}
                      onChange={(e) => setHeightDraft(e.target.value)}
                      suffix="cm"
                      placeholder="172"
                    />
                    <button
                      type="submit"
                      aria-label="Save height"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500 text-cream-50 hover:bg-lime-600 shrink-0"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel"
                      onClick={() => {
                        setEditingHeight(false);
                        setHeightDraft(user.heightCm?.toString() ?? '');
                        setHeightError('');
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cream-100 text-ink-700 hover:bg-cream-200 shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : user.heightCm ? (
                  <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {user.heightCm} cm
                    </p>
                    <span className="text-ink-500 font-medium text-sm">
                      ({heightFeet}&apos;{heightInches}&quot;)
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-ink-500 mt-1">
                    Not set yet — add it to unlock BMI insights.
                  </p>
                )}
                {heightError && editingHeight && (
                  <p className="text-xs text-rose-bright font-medium mt-1.5">{heightError}</p>
                )}
              </div>
            </div>

            {!editingHeight && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingHeight(true)}
                leftIcon={<Pencil size={13} />}
              >
                {user.heightCm ? 'Edit' : 'Add height'}
              </Button>
            )}

            {!editingHeight && user.heightCm && currentBmi != null && (
              <div className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 px-4 py-3 sm:min-w-44">
                <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                  Current BMI
                </p>
                <p className="font-display text-2xl font-bold tabular-nums mt-0.5">
                  {currentBmi.toFixed(1)}
                </p>
                <p className="text-xs text-ink-500 font-semibold">
                  {categoryLabel(categoryForBmi(currentBmi))}
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryTile
          label="Sessions"
          value={`${myParts.length}`}
          icon={<Calendar size={16} />}
        />
        <SummaryTile
          label="All-time best %"
          value={formatPct(allTimeBest)}
          icon={<Sparkles size={16} />}
        />
        <SummaryTile label="Crowns" value={`${allTimeCrowns}`} icon={<Crown size={16} />} />
        <SummaryTile
          label="Journal entries"
          value={`${myJournalCount}`}
          icon={<NotebookPen size={16} />}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Trophy size={20} className="text-tangerine-500" />
          Session history
        </h2>
        <p className="text-sm text-ink-500">Every session you&apos;ve been part of.</p>

        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          {sessionEntries.map(({ session, stats, rank, total, totalLogged, part }) => {
            const status = session.status;
            const isCrowned = rank === 1 && status === 'completed';
            return (
              <Card key={session.id} tone={status === 'completed' ? 'grape' : status === 'active' ? 'sunny' : 'default'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge
                      tone={
                        status === 'active' ? 'lime' : status === 'completed' ? 'grape' : 'cream'
                      }
                      className="mb-2"
                    >
                      {status}
                    </Badge>
                    <h3 className="font-display text-lg font-bold">{session.name}</h3>
                    <p className="text-xs text-ink-500">
                      {format(parseISO(session.startDate), 'MMM d, yyyy')} · {session.weeks} weeks
                    </p>
                  </div>
                  {isCrowned && (
                    <div className="flex items-center gap-1 text-tangerine-700 font-bold text-xs animate-float-pop">
                      <Crown size={20} className="fill-tangerine-300/60" /> #1 finisher
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ProfileStat label="Final %" value={formatPct(stats.cumulativePct)} highlight />
                  <ProfileStat label="Best week" value={formatPct(stats.bestWeekLoss)} />
                  <ProfileStat label="Rank" value={`#${rank || '—'} / ${total}`} />
                  <ProfileStat
                    label="Logged"
                    value={`${totalLogged} / ${session.weeks}`}
                    icon={<Flame size={12} />}
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-cream-50 border-2 border-ink-900/5 p-3 text-xs text-ink-500">
                  Start{' '}
                  <span className="font-bold text-ink-900 tabular-nums">
                    {part.startWeightKg.toFixed(1)} kg
                  </span>{' '}
                  · Goal{' '}
                  <span className="font-bold text-ink-900 tabular-nums">
                    {part.goalWeightKg.toFixed(1)} kg
                  </span>{' '}
                  · Current{' '}
                  <span className="font-bold text-ink-900 tabular-nums">
                    {stats.currentWeightKg?.toFixed(1)} kg
                  </span>
                </div>
              </Card>
            );
          })}
          {sessionEntries.length === 0 && (
            <Card className="lg:col-span-2 text-center py-10">
              <p className="font-display text-lg">No sessions yet.</p>
              <p className="text-sm text-ink-500">Join the active session from the dashboard.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

interface SummaryTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const SummaryTile = ({ label, value, icon }: SummaryTileProps) => (
  <div className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 px-4 py-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{label}</p>
      <span className="text-tangerine-500">{icon}</span>
    </div>
    <p className="font-display text-2xl font-bold mt-1 tabular-nums">{value}</p>
  </div>
);

interface ProfileStatProps {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

const ProfileStat = ({ label, value, highlight, icon }: ProfileStatProps) => (
  <div className="rounded-2xl bg-cream-50 border-2 border-ink-900/5 px-3 py-2.5">
    <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500 inline-flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p
      className={
        'font-display font-bold tabular-nums ' +
        (highlight ? 'text-2xl text-tangerine-600' : 'text-lg text-ink-900')
      }
    >
      {value}
    </p>
  </div>
);

export default ProfilePage;
