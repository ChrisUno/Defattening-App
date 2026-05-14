import { Footprints, ShieldHalf, ShieldCheck } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import type { ParticipantStats } from '../types';
import { formatPct } from '../lib/stats';

interface PursuerCardProps {
  pursuer: ParticipantStats | null;
  gap: number;
  userRank: number | null;
  totalParticipants: number;
  hasPursuer: boolean;
  youTotalPct: number;
}

const tauntFor = (gap: number, first: string) => {
  if (gap < 0.3) return `${first} is right on your heels. One bad week and they're past you.`;
  if (gap < 0.8) return `Don't get comfortable — ${first} is within striking distance.`;
  if (gap < 1.5) return `You've got breathing room, but keep stacking weeks.`;
  return `Comfortable lead over ${first}. Don't squander it.`;
};

export const PursuerCard = ({
  pursuer,
  gap,
  userRank,
  totalParticipants,
  hasPursuer,
  youTotalPct,
}: PursuerCardProps) => {
  if (!hasPursuer) {
    return (
      <Card tone="default" className="border-ink-900/10">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-ink-700 shrink-0">
            <ShieldCheck size={22} />
          </span>
          <div className="flex-1">
            <Badge tone="cream" className="mb-1">
              <Footprints size={11} /> Pursuer
            </Badge>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
              Nobody&apos;s behind you on this leaderboard.
            </h3>
            <p className="text-sm text-ink-500 mt-1">
              Your{' '}
              <span className="font-bold text-ink-900 tabular-nums">{formatPct(youTotalPct)}</span>{' '}
              is the floor — keep showing up so it stays that way.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!pursuer) return null;

  const pursuerFirst = pursuer.userName.split(' ')[0];
  const pursuerRank = (userRank ?? 0) + 1;

  return (
    <Card tone="default" className="relative overflow-hidden border-tangerine-300/40">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-tangerine-300/25 blur-2xl" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={pursuer.userName} color={pursuer.avatarColor} size="lg" />
            <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-tangerine-500 text-cream-50 border-2 border-cream-50">
              <ShieldHalf size={13} />
            </span>
          </div>
          <div className="min-w-0">
            <Badge tone="tangerine" className="mb-1">
              <Footprints size={11} /> Pursuer
            </Badge>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900 truncate">
              {pursuer.userName}
            </h3>
            <p className="text-xs text-ink-500 font-semibold">
              Rank #{pursuerRank} of {totalParticipants} · best week {formatPct(pursuer.bestWeekLoss)} · streak {pursuer.currentLossStreak}wk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-72 shrink-0">
          <div className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
              {pursuerFirst}&apos;s loss
            </p>
            <p className="font-display text-xl font-bold tabular-nums text-lime-600">
              {formatPct(pursuer.cumulativePct)}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-tangerine-300/50 bg-tangerine-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
              Your lead
            </p>
            <p className="font-display text-xl font-bold tabular-nums text-tangerine-700">
              {gap.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-sm text-ink-700 font-medium">
        {tauntFor(gap, pursuerFirst)}
      </p>
    </Card>
  );
};
