import { Swords, Crown, Trophy } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import type { ParticipantStats } from '../types';
import { formatPct } from '../lib/stats';

interface RivalCardProps {
  rival: ParticipantStats | null;
  gap: number;
  userRank: number | null;
  totalParticipants: number;
  hasRival: boolean;
  youTotalPct: number;
}

const tauntFor = (gap: number, rivalFirst: string) => {
  if (gap < 0.3) return `${rivalFirst} is breathing down your neck — or you're breathing down theirs. Same thing.`;
  if (gap < 0.8) return `Catchable. Skip one snack, win one battle.`;
  if (gap < 1.5) return `Tighten the diet a little this week and you've got 'em.`;
  if (gap < 3) return `Some ground to cover. Pick one workout, one veggie. Repeat.`;
  return `Big climb, but stranger things have happened.`;
};

export const RivalCard = ({
  rival,
  gap,
  userRank,
  totalParticipants,
  hasRival,
  youTotalPct,
}: RivalCardProps) => {
  if (!hasRival) {
    return (
      <Card tone="sunny">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-500 text-cream-50 shrink-0 animate-float-pop">
            <Crown size={22} />
          </span>
          <div className="flex-1">
            <Badge tone="tangerine" className="mb-1">
              <Trophy size={11} /> You&apos;re #1
            </Badge>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
              No rival — you&apos;re the one to beat.
            </h3>
            <p className="text-sm text-ink-700 mt-1">
              Cumulative loss is sitting at{' '}
              <span className="font-bold text-ink-900 tabular-nums">{formatPct(youTotalPct)}</span>{' '}
              and the rest of the team is in your dust. Don&apos;t look back.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!rival) return null;

  const rivalFirst = rival.userName.split(' ')[0];

  return (
    <Card tone="grape" className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-grape-300/30 blur-2xl" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={rival.userName} color={rival.avatarColor} size="lg" />
            <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-grape-500 text-cream-50 border-2 border-cream-50">
              <Swords size={13} />
            </span>
          </div>
          <div className="min-w-0">
            <Badge tone="grape" className="mb-1">
              <Swords size={11} /> Your rival
            </Badge>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900 truncate">
              {rival.userName}
            </h3>
            <p className="text-xs text-ink-500 font-semibold">
              Rank #{(userRank ?? 0) - 1} of {totalParticipants} · best week {formatPct(rival.bestWeekLoss)} · streak {rival.currentLossStreak}wk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-72 shrink-0">
          <div className="rounded-2xl border-2 border-grape-300/40 bg-cream-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
              {rivalFirst}&apos;s loss
            </p>
            <p className="font-display text-xl font-bold tabular-nums text-lime-600">
              {formatPct(rival.cumulativePct)}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-tangerine-300/50 bg-cream-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
              Gap to close
            </p>
            <p className="font-display text-xl font-bold tabular-nums text-tangerine-500">
              {gap.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-sm text-ink-700 font-medium">
        {tauntFor(gap, rivalFirst)}
      </p>
    </Card>
  );
};
