import { useMemo, useState } from 'react';
import {
  Crown,
  Search,
  Flame,
  Trophy,
  ChartLine,
  ArrowUpDown,
  Filter,
  TrendingDown,
  Users as UsersIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useCurrentUser } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  computeLeaderboard,
  computeParticipantStats,
  currentWeekIndex,
  formatPct,
  weeklyPointsFor,
} from '../lib/stats';
import { cn } from '../lib/cn';
import { useChartTokens } from '../lib/chartTheme';

type SortKey = 'cumulative' | 'weekly' | 'best' | 'streak';

const sortLabels: Record<SortKey, string> = {
  cumulative: 'Cumulative %',
  weekly: 'This week %',
  best: 'Best week %',
  streak: 'Loss streak',
};

type FilterMode = 'all' | 'losers' | 'streakers' | 'me-vs-top';

const LeaderboardPage = () => {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const weighIns = useDataStore((s) => s.weighIns);
  const activityFeed = useDataStore((s) => s.activityFeed);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const user = useCurrentUser(users);
  const tokens = useChartTokens();

  const session = sessions.find((s) => s.id === activeSessionId)!;
  const weekIdx = currentWeekIndex(session);

  const [sortKey, setSortKey] = useState<SortKey>('cumulative');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const board = useMemo(
    () => computeLeaderboard(session, users, participations, weighIns, weekIdx),
    [session, users, participations, weighIns, weekIdx],
  );

  const recentMovers = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const ids = new Set<string>();
    for (const entry of activityFeed) {
      if (entry.sessionId !== session.id) continue;
      if (Date.parse(entry.occurredAt) < cutoff) continue;
      ids.add(entry.actorUserId);
    }
    return ids;
  }, [activityFeed, session.id]);

  const filtered = useMemo(() => {
    let rows = [...board];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((r) => r.userName.toLowerCase().includes(q));
    }
    if (filter === 'losers') rows = rows.filter((r) => r.cumulativePct > 0);
    if (filter === 'streakers') rows = rows.filter((r) => r.currentLossStreak >= 2);
    if (filter === 'me-vs-top' && user) {
      const topId = board[0]?.userId;
      rows = rows.filter((r) => r.userId === user.id || r.userId === topId);
    }
    rows.sort((a, b) => {
      const av =
        sortKey === 'cumulative'
          ? a.cumulativePct
          : sortKey === 'weekly'
            ? a.weeklyDelta
            : sortKey === 'best'
              ? a.bestWeekLoss
              : a.currentLossStreak;
      const bv =
        sortKey === 'cumulative'
          ? b.cumulativePct
          : sortKey === 'weekly'
            ? b.weeklyDelta
            : sortKey === 'best'
              ? b.bestWeekLoss
              : b.currentLossStreak;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [board, query, filter, sortKey, sortDir, user]);

  const topUserId = board[0]?.userId;
  const meStats = user
    ? board.find((b) => b.userId === user.id) ??
      (participations.find((p) => p.userId === user.id && p.sessionId === session.id)
        ? computeParticipantStats(
            user,
            participations.find((p) => p.userId === user.id && p.sessionId === session.id)!,
            weighIns,
            weekIdx,
          )
        : null)
    : null;

  const chartData = useMemo(() => {
    const visible = filtered.slice(0, 6);
    const series: { week: string; [userId: string]: number | string }[] = [];
    for (let w = 0; w <= weekIdx; w += 1) {
      const row: { week: string; [k: string]: number | string } = { week: `Wk ${w + 1}` };
      visible.forEach((stat) => {
        const part = participations.find(
          (p) => p.userId === stat.userId && p.sessionId === session.id,
        );
        if (!part) return;
        const points = weeklyPointsFor(part, weighIns, w);
        const latest = points[points.length - 1];
        row[stat.userName] = +(latest?.pctFromStart ?? 0).toFixed(2);
      });
      series.push(row);
    }
    return { series, visible };
  }, [filtered, weekIdx, participations, weighIns, session.id]);

  if (!user) return null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Badge tone="grape" className="mb-3">
          <Trophy size={12} /> {session.name} · Week {weekIdx + 1}
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
          The leaderboard, in <span className="text-grape-500">technicolor</span>.
        </h1>
        <p className="mt-2 text-ink-700 max-w-2xl">
          Percentages only — nobody&apos;s sharing their actual weight here. Sort, filter, search,
          and compare yourself against the team without giving up the goods.
        </p>
      </div>

      <section className="grid lg:grid-cols-3 gap-4">
        <PodiumCard
          rank={1}
          stat={board[0]}
          accent="bg-tangerine-500 text-cream-50"
          glow
        />
        <PodiumCard rank={2} stat={board[1]} accent="bg-grape-500 text-cream-50" />
        <PodiumCard rank={3} stat={board[2]} accent="bg-lime-500 text-cream-50" />
      </section>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <ChartLine size={18} className="text-grape-500" />
              Cumulative % lost over time
            </h2>
            <p className="text-sm text-ink-500">Top 6 by current sort · positive means weight lost.</p>
          </div>
        </div>
        <div className="px-3 pb-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.series} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={tokens.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                stroke={tokens.axisLabel}
                tick={{ fontSize: 11, fontWeight: 600, fill: tokens.axisLabel }}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                stroke={tokens.axisLabel}
                tick={{ fontSize: 11, fontWeight: 600, fill: tokens.axisLabel }}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: tokens.surface,
                  border: `2px solid ${tokens.border}`,
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 6 }}
              />
              {chartData.visible.map((stat) => (
                <Line
                  key={stat.userId}
                  type="monotone"
                  dataKey={stat.userName}
                  stroke={stat.avatarColor}
                  strokeWidth={stat.userId === user.id ? 3.5 : 2}
                  dot={{ r: 3, fill: stat.avatarColor }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-5 border-b-2 border-ink-900/5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                prefix={<Search size={14} />}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 sm:overflow-visible">
              <FilterPill
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                icon={<UsersIcon size={12} />}
              >
                Everyone
              </FilterPill>
              <FilterPill
                active={filter === 'losers'}
                onClick={() => setFilter('losers')}
                icon={<TrendingDown size={12} />}
              >
                Lost weight
              </FilterPill>
              <FilterPill
                active={filter === 'streakers'}
                onClick={() => setFilter('streakers')}
                icon={<Flame size={12} />}
              >
                Hot streaks
              </FilterPill>
              <FilterPill
                active={filter === 'me-vs-top'}
                onClick={() => setFilter('me-vs-top')}
                icon={<Crown size={12} />}
              >
                Me vs leader
              </FilterPill>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-500 font-semibold">
            <Filter size={12} />
            Sort:
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 transition',
                  sortKey === k
                    ? 'border-ink-900 bg-ink-900 text-cream-50'
                    : 'border-ink-900/10 bg-cream-50 hover:bg-ink-900/5 text-ink-700',
                )}
              >
                {sortLabels[k]}
                {sortKey === k && <ArrowUpDown size={10} />}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100/40 border-b-2 border-ink-900/10">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  #
                </th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Participant
                </th>
                <th
                  className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 cursor-pointer"
                  onClick={() => toggleSort('cumulative')}
                >
                  Cumulative
                </th>
                <th
                  className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 cursor-pointer hidden sm:table-cell"
                  onClick={() => toggleSort('weekly')}
                >
                  Weekly Δ
                </th>
                <th
                  className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 cursor-pointer hidden md:table-cell"
                  onClick={() => toggleSort('best')}
                >
                  Best week
                </th>
                <th
                  className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 cursor-pointer hidden md:table-cell"
                  onClick={() => toggleSort('streak')}
                >
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-500">
                    Nobody matches that search yet.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const isMe = row.userId === user.id;
                  const isTop = row.userId === topUserId;
                  const justOvertook = recentMovers.has(row.userId);
                  return (
                    <tr
                      key={row.userId}
                      className={cn(
                        'border-b border-ink-900/5 last:border-0 transition',
                        isMe ? 'bg-tangerine-50' : 'hover:bg-cream-100/50',
                      )}
                    >
                      <td className="px-5 py-3.5 font-bold text-ink-700 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.userName} color={row.avatarColor} size="sm" />
                          <div>
                            <p className="font-semibold text-ink-900 inline-flex items-center gap-1.5 flex-wrap">
                              {row.userName}
                              {isMe && (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-tangerine-600">
                                  (you)
                                </span>
                              )}
                              {justOvertook && (
                                <span
                                  title="Recently overtook someone"
                                  className="inline-flex items-center gap-0.5 rounded-full bg-tangerine-500 text-cream-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                >
                                  <Flame size={9} /> Mover
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 font-bold',
                            row.cumulativePct >= 0 ? 'text-lime-600' : 'text-rose-bright',
                          )}
                        >
                          {isTop && (
                            <Crown
                              size={16}
                              className="text-tangerine-500 fill-tangerine-300/40"
                            />
                          )}
                          {formatPct(row.cumulativePct)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums hidden sm:table-cell">
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
                      <td className="px-3 py-3.5 text-right tabular-nums hidden md:table-cell font-semibold text-ink-700">
                        {formatPct(row.bestWeekLoss)}
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
                          <Flame size={12} className="text-tangerine-500" />
                          {row.currentLossStreak}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {meStats && (
        <Card tone="sunny">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <p className="text-[11px] uppercase tracking-wider font-bold text-tangerine-700">
                You vs the team
              </p>
              <h3 className="font-display text-xl font-bold mt-0.5">Quick benchmark</h3>
            </div>
            <CompareTile
              label="Your cumulative"
              value={formatPct(meStats.cumulativePct)}
              note={`Rank ${board.findIndex((b) => b.userId === user.id) + 1} of ${board.length}`}
            />
            <CompareTile
              label="Team average"
              value={formatPct(
                board.reduce((a, b) => a + b.cumulativePct, 0) / Math.max(board.length, 1),
              )}
              note="All session participants"
            />
            <CompareTile
              label="Leader is at"
              value={formatPct(board[0]?.cumulativePct ?? 0)}
              note={board[0] ? board[0].userName : '—'}
              crown
            />
          </div>
        </Card>
      )}
    </div>
  );
};

interface PodiumCardProps {
  rank: number;
  stat: ReturnType<typeof computeLeaderboard>[number] | undefined;
  accent: string;
  glow?: boolean;
}

const PodiumCard = ({ rank, stat, accent, glow }: PodiumCardProps) => {
  if (!stat) {
    return (
      <Card className="opacity-40">
        <p className="text-sm text-ink-500">Waiting for #{rank}…</p>
      </Card>
    );
  }
  return (
    <div
      className={cn(
        'relative rounded-3xl border-2 border-ink-900/10 bg-cream-50 p-6 overflow-hidden',
        glow && 'shadow-[0_10px_0_0_rgba(255,122,26,0.18)]',
      )}
    >
      {glow && (
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-tangerine-300/30 blur-2xl" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-2xl font-display font-bold text-base',
              accent,
            )}
          >
            #{rank}
          </span>
          {rank === 1 && <Crown size={24} className="text-tangerine-500 fill-tangerine-300/40 animate-float-pop" />}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={stat.userName} color={stat.avatarColor} size="lg" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">{stat.userName}</p>
            <p className="text-xs text-ink-500 font-semibold">
              Streak · {stat.currentLossStreak}wk · Best · {formatPct(stat.bestWeekLoss)}
            </p>
          </div>
        </div>
        <p
          className={cn(
            'font-display text-4xl font-bold mt-4 tabular-nums',
            stat.cumulativePct >= 0 ? 'text-ink-900' : 'text-rose-bright',
          )}
        >
          {formatPct(stat.cumulativePct)}
        </p>
        <p className="text-xs text-ink-500 font-semibold mt-1 uppercase tracking-wider">
          Cumulative loss
        </p>
      </div>
    </div>
  );
};

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const FilterPill = ({ active, onClick, children, icon }: FilterPillProps) => (
  <button
    onClick={onClick}
    className={cn(
      'shrink-0 inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold whitespace-nowrap transition',
      active
        ? 'border-tangerine-500 bg-tangerine-500 text-cream-50'
        : 'border-ink-900/10 bg-cream-50 text-ink-700 hover:border-ink-900/30',
    )}
  >
    {icon}
    {children}
  </button>
);

interface CompareTileProps {
  label: string;
  value: string;
  note: string;
  crown?: boolean;
}

const CompareTile = ({ label, value, note, crown }: CompareTileProps) => (
  <div className="rounded-2xl border-2 border-tangerine-300/40 bg-cream-50 p-4">
    <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{label}</p>
    <p className="font-display text-2xl font-bold mt-1 tabular-nums inline-flex items-center gap-1.5">
      {crown && <Crown size={16} className="text-tangerine-500" />}
      {value}
    </p>
    <p className="text-xs text-ink-500 font-medium mt-0.5">{note}</p>
  </div>
);

export default LeaderboardPage;
