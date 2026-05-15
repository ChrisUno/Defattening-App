import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Crown, PartyPopper, ChevronLeft, HeartCrack } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { computeLeaderboard, formatPct } from '../lib/stats';
import { api } from '../lib/api';
import type { WeighIn } from '../types';

const ResultsPage = () => {
  const navigate = useNavigate();
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);

  const user = useAuthStore((s) => s.currentUser);

  const completed = useMemo(
    () => sessions.filter((s) => s.status === 'completed'),
    [sessions],
  );

  const [sessionId, setSessionId] = useState<string>(completed[0]?.id ?? '');
  const [confettiTick, setConfettiTick] = useState(1);
  const [completedWeighIns, setCompletedWeighIns] = useState<WeighIn[]>([]);

  const session = completed.find((s) => s.id === sessionId) ?? completed[0];

  useEffect(() => {
    if (!session) return;
    api.get<WeighIn[]>(`/api/weigh-ins?sessionId=${session.id}`).then(setCompletedWeighIns).catch(() => {});
  }, [session?.id]);

  const board = useMemo(() => {
    if (!session) return [];
    return computeLeaderboard(session, users, participations, completedWeighIns, session.weeks - 1);
  }, [session, users, participations, completedWeighIns]);

  if (!session) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display text-3xl font-bold">No completed sessions yet</h1>
        <p className="text-ink-500 mt-2">When a session wraps, results land here.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const winner = board[0];
  const gainers = board.filter((b) => b.cumulativePct < 0);
  const losers = board.filter((b) => b.cumulativePct >= 0);
  const youInBoard = user ? board.find((b) => b.userId === user.id) : null;
  const youAreWinner = winner && user && winner.userId === user.id;
  const youAreGainer = youInBoard && youInBoard.cumulativePct < 0;

  return (
    <div className="space-y-8">
      <ConfettiBurst trigger={confettiTick} count={80} />

      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft size={16} />
        Back to dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Badge tone="grape" className="mb-3">
            <PartyPopper size={12} /> Final results
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
            {session.name}: <span className="italic">that&apos;s a wrap.</span>
          </h1>
          <p className="mt-2 text-ink-700">
            {session.weeks} weeks of effort, {board.length} brave participants, and one official Complete Loser.
          </p>
        </div>
        {completed.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {completed.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSessionId(s.id);
                  setConfettiTick((t) => t + 1);
                }}
                className={
                  'shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold whitespace-nowrap ' +
                  (s.id === session.id
                    ? 'border-ink-900 bg-ink-900 text-cream-50'
                    : 'border-ink-900/10 bg-cream-50 text-ink-700 hover:bg-ink-900/5')
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="relative overflow-hidden rounded-[32px] border-2 border-tangerine-300/60 bg-gradient-to-br from-tangerine-100 via-cream-100 to-grape-50 p-8 sm:p-10"
        >
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-tangerine-300/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-grape-300/30 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <Avatar name={winner.userName} color={winner.avatarColor} size="xl" />
              <Crown
                size={32}
                className="absolute -top-4 -right-3 text-tangerine-500 fill-tangerine-300/80 rotate-12 animate-float-pop"
              />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider font-bold text-tangerine-700">
                Officially crowned
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink-900">
                {winner.userName} is A Complete Loser™
              </h2>
              <p className="mt-2 text-ink-700 max-w-2xl">
                {youAreWinner
                  ? 'Yes, that\'s you. Congrats — your dedication, discipline, and slightly maniacal calorie tracking paid off. Take a bow.'
                  : `${winner.userName.split(' ')[0]} put in the work and the leaderboard noticed. Send a high-five.`}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                Total lost
              </p>
              <p className="font-display text-5xl font-bold text-tangerine-600 tabular-nums">
                {formatPct(winner.cumulativePct)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <Card tone="lime">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <PartyPopper size={18} className="text-lime-600" />
            Everyone who lost weight
          </h3>
          <p className="text-sm text-ink-700 mt-1">
            You showed up. You weighed in. You made the team proud — thank you for joining the
            session.
          </p>
          <ul className="mt-4 space-y-2">
            {losers.length === 0 ? (
              <li className="text-sm text-ink-500">…well, this is awkward.</li>
            ) : (
              losers.map((p) => (
                <li
                  key={p.userId}
                  className="flex items-center gap-3 rounded-2xl bg-cream-50 border-2 border-lime-500/30 px-3 py-2"
                >
                  <Avatar name={p.userName} color={p.avatarColor} size="sm" />
                  <span className="flex-1 font-semibold text-ink-900">
                    {p.userName}
                    {user && p.userId === user.id && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-tangerine-600">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="font-display font-bold tabular-nums text-lime-600">
                    {formatPct(p.cumulativePct)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card tone="grape">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <HeartCrack size={18} className="text-grape-700" />
            And the… upward-trending crowd
          </h3>
          <p className="text-sm text-ink-700 mt-1">
            Hey {gainers.length === 1 ? gainers[0].userName.split(' ')[0] : 'team'} — do you know how
            this whole &ldquo;weight loss&rdquo; thing works? Asking for a friend.
          </p>
          <ul className="mt-4 space-y-2">
            {gainers.length === 0 ? (
              <li className="text-sm text-ink-500">
                Nobody! What a session. 🙌
              </li>
            ) : (
              gainers.map((p) => (
                <li
                  key={p.userId}
                  className="flex items-center gap-3 rounded-2xl bg-cream-50 border-2 border-rose-bright/30 px-3 py-2"
                >
                  <Avatar name={p.userName} color={p.avatarColor} size="sm" />
                  <span className="flex-1 font-semibold text-ink-900">
                    {p.userName}
                    {user && p.userId === user.id && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-rose-bright">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="font-display font-bold tabular-nums text-rose-bright">
                    {formatPct(p.cumulativePct)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </section>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b-2 border-ink-900/5">
          <h3 className="font-display text-xl font-bold">Final scoreboard</h3>
          <p className="text-sm text-ink-500">Cumulative %, weekly delta, best week, and streak.</p>
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
                <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Cumulative
                </th>
                <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 hidden sm:table-cell">
                  Last week Δ
                </th>
                <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 hidden md:table-cell">
                  Best week
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 hidden md:table-cell">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {board.map((row, idx) => {
                const isMe = user && row.userId === user.id;
                return (
                  <tr
                    key={row.userId}
                    className={
                      'border-b border-ink-900/5 last:border-0 ' +
                      (isMe ? 'bg-tangerine-50' : '')
                    }
                  >
                    <td className="px-5 py-3 font-bold tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.userName} color={row.avatarColor} size="sm" />
                        <span className="font-semibold">
                          {row.userName}
                          {idx === 0 && (
                            <Crown size={14} className="inline ml-1 text-tangerine-500 fill-tangerine-300/40" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td
                      className={
                        'px-3 py-3 text-right tabular-nums font-bold ' +
                        (row.cumulativePct >= 0 ? 'text-lime-600' : 'text-rose-bright')
                      }
                    >
                      {formatPct(row.cumulativePct)}
                    </td>
                    <td
                      className={
                        'px-3 py-3 text-right tabular-nums font-semibold hidden sm:table-cell ' +
                        (row.weeklyDelta >= 0 ? 'text-lime-600' : 'text-rose-bright')
                      }
                    >
                      {formatPct(row.weeklyDelta)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold hidden md:table-cell">
                      {formatPct(row.bestWeekLoss)}
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell font-semibold">
                      {row.currentLossStreak}wk
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {youAreGainer && (
        <Card tone="sunny">
          <p className="font-display text-lg font-semibold">
            Personal note for {user?.name.split(' ')[0]}:
          </p>
          <p className="mt-1 text-ink-700">
            We&apos;re all rooting for you. Next session is a fresh start — new numbers, new goals,
            same encouraging team. You got this.
          </p>
        </Card>
      )}
    </div>
  );
};

export default ResultsPage;
