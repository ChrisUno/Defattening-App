import { motion } from 'framer-motion';
import { PartyPopper, Hourglass, X } from 'lucide-react';
import type { Session } from '../types';
import { Button } from './ui/Button';
import { useUiStore } from '../store/uiStore';
import { useNavigate } from 'react-router';

interface SessionBannerProps {
  session: Session;
  weekIndex: number;
}

export const SessionBanner = ({ session, weekIndex }: SessionBannerProps) => {
  const navigate = useNavigate();
  const seen = useUiStore((s) => s.seenBanners);
  const markSeen = useUiStore((s) => s.markBannerSeen);

  const isFinalWeek = weekIndex === session.weeks - 1 && session.status === 'active';
  const isFinished = session.status === 'completed';

  const finalKey = `final-${session.id}`;
  const doneKey = `done-${session.id}`;

  if (isFinished && !seen[doneKey]) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border-2 border-grape-300/60 bg-gradient-to-br from-grape-50 via-tangerine-50 to-cream-100 p-5 sm:p-6"
      >
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-tangerine-300/30 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-grape-500 text-cream-50 shrink-0 animate-float-pop">
            <PartyPopper size={22} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-grape-700">
              Session complete
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-0.5">
              {session.name} is a wrap! Time to see who&apos;s A Complete Loser™.
            </h3>
            <p className="text-sm text-ink-700 mt-1">
              Final percentages are locked in. Crown someone, congratulate everyone, and side-eye the gainers.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/results')}>
                See the results
              </Button>
              <Button size="sm" variant="ghost" onClick={() => markSeen(doneKey)}>
                Maybe later
              </Button>
            </div>
          </div>
          <button
            onClick={() => markSeen(doneKey)}
            className="text-ink-500 hover:text-ink-900"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (isFinalWeek && !seen[finalKey]) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border-2 border-tangerine-300/60 bg-tangerine-50 p-5 sm:p-6"
      >
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-500 text-cream-50 shrink-0 animate-pulse-glow">
            <Hourglass size={22} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-tangerine-700">
              Final week
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-0.5">
              One week left. Make it count.
            </h3>
            <p className="text-sm text-ink-700 mt-1">
              Last weigh-in is coming. Hydrate, sleep, walk a bit more than usual, and finish strong. Future-you says thanks.
            </p>
          </div>
          <button
            onClick={() => markSeen(finalKey)}
            className="text-ink-500 hover:text-ink-900"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};
