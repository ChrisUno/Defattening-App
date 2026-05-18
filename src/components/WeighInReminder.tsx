import { useMemo } from 'react';
import { Scale, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import { cn } from '../lib/cn';

export const WeighInReminder = () => {
  const user = useAuthStore((s) => s.currentUser);
  const sessions = useDataStore((s) => s.sessions);
  const weighInStatuses = useDataStore((s) => s.weighInStatuses);
  const setActiveSession = useDataStore((s) => s.setActiveSession);
  const seenBanners = useUiStore((s) => s.seenBanners);
  const markBannerSeen = useUiStore((s) => s.markBannerSeen);

  const reminders = useMemo(() => {
    if (!user) return [];

    const today = new Date().getDay();
    const items: {
      sessionId: string;
      sessionName: string;
      weekIndex: number;
      totalWeeks: number;
      isUrgent: boolean; // today IS weigh-in day
      bannerKey: string;
    }[] = [];

    for (const status of weighInStatuses) {
      if (status.hasWeighedIn) continue;

      const session = sessions.find((s) => s.id === status.sessionId);
      if (!session || session.status !== 'active') continue;

      const bannerKey = `reminder-${status.sessionId}-week-${status.weekIndex}`;
      if (seenBanners[bannerKey]) continue;

      const isWeighInDay = today === status.weighInDayOfWeek;
      // Check if weigh-in day has passed this week (overdue)
      // We consider it overdue if today is after the weigh-in day but within 6 days
      const daysSinceWeighIn = (today - status.weighInDayOfWeek + 7) % 7;
      const isOverdue = daysSinceWeighIn > 0 && daysSinceWeighIn <= 5;

      if (isWeighInDay || isOverdue) {
        items.push({
          sessionId: status.sessionId,
          sessionName: session.name,
          weekIndex: status.weekIndex,
          totalWeeks: session.weeks,
          isUrgent: isWeighInDay,
          bannerKey,
        });
      }
    }

    // Urgent first
    return items.sort((a, b) => (a.isUrgent === b.isUrgent ? 0 : a.isUrgent ? -1 : 1));
  }, [user, weighInStatuses, sessions, seenBanners]);

  if (reminders.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-3 space-y-2">
      {reminders.map((r) => (
        <div
          key={r.bannerKey}
          className={cn(
            'relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm',
            r.isUrgent
              ? 'bg-tangerine-500 text-cream-50 border-tangerine-700 animate-pulse-subtle'
              : 'bg-cream-100 text-ink-900 border-tangerine-300/50',
          )}
        >
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-xl shrink-0',
              r.isUrgent
                ? 'bg-cream-50/15 text-cream-50'
                : 'bg-tangerine-50 text-tangerine-700',
            )}
          >
            <Scale size={16} />
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {r.isUrgent
                ? `⏰ Step on the scale! Weigh-in day for ${r.sessionName}`
                : `Don't forget to log your weigh-in for ${r.sessionName}`}
            </p>
            <p
              className={cn(
                'text-xs mt-0.5',
                r.isUrgent ? 'text-cream-50/80' : 'text-ink-500',
              )}
            >
              Week {r.weekIndex + 1} of {r.totalWeeks}
            </p>
          </div>

          <button
            onClick={() => {
              setActiveSession(r.sessionId);
              // Dispatch custom event that DashboardPage can listen to for opening WeighInModal
              window.dispatchEvent(new CustomEvent('open-weigh-in', { detail: { sessionId: r.sessionId } }));
            }}
            className={cn(
              'shrink-0 text-xs font-bold underline underline-offset-4 hover:opacity-80',
              r.isUrgent ? 'text-cream-50' : 'text-tangerine-700',
            )}
          >
            Log it now →
          </button>

          <button
            onClick={() => markBannerSeen(r.bannerKey)}
            className={cn(
              'shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full hover:opacity-80',
              r.isUrgent
                ? 'text-cream-50/80 hover:bg-cream-50/10'
                : 'text-ink-500 hover:bg-ink-900/5',
            )}
            aria-label="Dismiss reminder"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
