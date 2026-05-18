import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { currentWeekIndex } from '../lib/stats';
import { Badge } from './ui/Badge';
import { JoinSessionDialog } from './JoinSessionDialog';
import { cn } from '../lib/cn';

export const SessionPicker = () => {
  const user = useAuthStore((s) => s.currentUser);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const setActiveSession = useDataStore((s) => s.setActiveSession);
  const weighInStatuses = useDataStore((s) => s.weighInStatuses);

  const [joinOpen, setJoinOpen] = useState(false);

  if (!user) return null;

  const mySessions = sessions.filter(
    (s) =>
      s.status !== 'completed' &&
      participations.some((p) => p.userId === user.id && p.sessionId === s.id),
  );

  const joinableSessions = sessions.filter(
    (s) =>
      s.status !== 'completed' &&
      !participations.some((p) => p.userId === user.id && p.sessionId === s.id),
  );

  if (mySessions.length === 0 && joinableSessions.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {mySessions.map((s) => {
          const isActive = s.id === activeSessionId;
          const weekIdx = currentWeekIndex(s);
          const status = weighInStatuses.find((st) => st.sessionId === s.id);
          const isDue = status ? !status.hasWeighedIn : false;

          return (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={cn(
                'relative flex-shrink-0 text-left rounded-2xl border-2 px-4 py-3 transition min-w-[180px] max-w-[240px]',
                isActive
                  ? 'border-tangerine-500 bg-tangerine-50 shadow-[0_4px_0_0_var(--color-tangerine-300)]'
                  : 'border-ink-900/10 bg-cream-50 hover:border-ink-900/30',
              )}
            >
              {isDue && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-bright opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-bright" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <p className="font-display text-sm font-bold truncate">{s.name}</p>
                <Badge tone={s.status === 'active' ? 'lime' : 'grape'} className="text-[9px] px-1.5 py-0">
                  {s.status}
                </Badge>
              </div>
              <p className="text-xs text-ink-500 font-semibold">
                Week {weekIdx + 1} of {s.weeks}
              </p>
              <div className="mt-2 w-full bg-ink-900/10 rounded-full h-1.5">
                <div
                  className="bg-tangerine-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round(((weekIdx + 1) / s.weeks) * 100)}%` }}
                />
              </div>
            </button>
          );
        })}

        {joinableSessions.length > 0 && (
          <button
            onClick={() => setJoinOpen(true)}
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-900/20 px-6 py-3 min-w-[160px] hover:border-tangerine-500 hover:bg-tangerine-50/50 transition group"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink-900/5 text-ink-500 group-hover:bg-tangerine-100 group-hover:text-tangerine-700 transition">
              <Plus size={16} />
            </span>
            <span className="mt-1 text-xs font-bold text-ink-500 group-hover:text-tangerine-700">
              Join another
            </span>
          </button>
        )}
      </div>

      <JoinSessionDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
};
