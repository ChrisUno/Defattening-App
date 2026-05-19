import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NotebookPen,
  Clock,
  Lightbulb,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  PartyPopper,
} from 'lucide-react';
import {
  parseISO,
  addWeeks,
  differenceInCalendarDays,
  format,
} from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { JoinSessionDialog } from '../components/JoinSessionDialog';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { currentWeekIndex, formatWeekLabel } from '../lib/stats';
import {
  TIPS,
  RECIPES,
  FOOD_ALTERNATIVES,
  DIET_KEYWORDS,
  GUIDED_PROMPTS,
  getDayOfYearIndex,
} from '../data/wellnessTips';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_CHARS = 5000;
const WARN_THRESHOLD = 4500;
const DEBOUNCE_MS = 2000;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SessionCountdown({ session }: { session: { startDate: string; weeks: number } }) {
  const endDate = addWeeks(parseISO(session.startDate), session.weeks);
  const daysLeft = differenceInCalendarDays(endDate, new Date());

  if (daysLeft <= 0) {
    return (
      <Badge tone="grape">
        <PartyPopper size={12} /> Session complete
      </Badge>
    );
  }

  const progress = Math.max(
    0,
    Math.min(
      100,
      ((differenceInCalendarDays(new Date(), parseISO(session.startDate))) /
        (session.weeks * 7)) *
        100,
    ),
  );

  return (
    <div className="flex items-center gap-3">
      <Badge tone="tangerine">
        <Clock size={12} /> {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
      </Badge>
      <div className="hidden sm:block flex-1 max-w-[180px] h-2 rounded-full bg-ink-900/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-tangerine-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function CurrentWeekEditor({
  sessionId,
  weekIndex,
  existing,
}: {
  sessionId: string;
  weekIndex: number;
  existing: string;
}) {
  const saveJournal = useDataStore((s) => s.saveJournal);
  const [content, setContent] = useState(existing);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  // Sync external changes (e.g. hydration) into local state
  useEffect(() => {
    setContent(existing);
  }, [existing]);

  const flush = useCallback(async () => {
    if (!pendingRef.current) return;
    if (contentRef.current.length > MAX_CHARS) return;
    if (!contentRef.current.trim()) return;
    pendingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSaveStatus('saving');
    try {
      await saveJournal({ sessionId, weekIndex, content: contentRef.current });
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setSaveStatus('error');
    }
  }, [saveJournal, sessionId, weekIndex]);

  // Debounced save
  useEffect(() => {
    if (content === existing && saveStatus === 'idle') return;
    if (content.length > MAX_CHARS) return;
    if (!content.trim()) return;

    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, flush, existing, saveStatus]);

  // Flush on unmount / beforeunload
  useEffect(() => {
    const onBeforeUnload = () => flush();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      flush();
    };
  }, [flush]);

  const overLimit = content.length > MAX_CHARS;
  const nearLimit = content.length >= WARN_THRESHOLD;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-tangerine-100 text-tangerine-600">
          <NotebookPen size={16} />
        </span>
        <h3 className="font-display text-lg font-bold">This Week's Entry</h3>
        <div className="ml-auto">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && lastSavedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-lime-600">
              <CheckCircle2 size={12} /> Saved at {format(lastSavedAt, 'h:mm a')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-bright">
              <AlertCircle size={12} /> Save failed
            </span>
          )}
        </div>
      </div>

      {/* Guided prompts */}
      <div className="mb-3 flex flex-wrap gap-2">
        {GUIDED_PROMPTS.map((prompt) => (
          <span
            key={prompt}
            className="inline-block rounded-full bg-grape-50 px-3 py-1 text-xs font-medium text-grape-700"
          >
            {prompt}
          </span>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (saveStatus === 'saved' || saveStatus === 'error') setSaveStatus('idle');
        }}
        maxLength={MAX_CHARS + 1} // allow paste to show error, but we block save
        placeholder="Start writing about your week…"
        className="w-full min-h-[200px] rounded-2xl border-2 border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-tangerine-400 focus:outline-none focus:ring-2 focus:ring-tangerine-300/40 resize-y"
      />

      <div className="flex items-center justify-between mt-2">
        <div>
          {overLimit && (
            <span className="text-xs font-semibold text-rose-bright">
              <AlertCircle size={12} className="inline mr-1" />
              Entry exceeds {MAX_CHARS.toLocaleString()} characters — save blocked.
            </span>
          )}
        </div>
        {nearLimit && (
          <span className={`text-xs font-semibold ${overLimit ? 'text-rose-bright' : 'text-ink-500'}`}>
            {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function JournalHistory({
  session,
  currentWeek,
  journals,
}: {
  session: { id: string; weeks: number; startDate: string };
  currentWeek: number;
  journals: { weekIndex: number; content: string; createdAt: string }[];
}) {
  const weeks = Array.from({ length: session.weeks }, (_, i) => i)
    .filter((i) => i !== currentWeek)
    .reverse();

  if (weeks.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold">Past Entries</h3>
      {weeks.map((weekIdx) => {
        const entry = journals.find((j) => j.weekIndex === weekIdx);
        const label = formatWeekLabel(session as any, weekIdx);

        return (
          <Card key={weekIdx} className="relative">
            <p className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-2">
              {label}
            </p>
            {entry ? (
              <>
                <p className="text-sm text-ink-900 whitespace-pre-wrap">{entry.content}</p>
                <p className="mt-2 text-xs text-ink-400">
                  Logged {format(parseISO(entry.createdAt), 'MMM d, h:mm a')}
                </p>
              </>
            ) : (
              <p className="text-sm italic text-ink-400">
                You didn't write anything for {label}. That's okay — every week is a fresh start.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function TipsSidebar({
  userJournals,
  currentEntryText,
  weighIns,
  userId,
  sessionId,
}: {
  userJournals: { content: string; weekIndex: number }[];
  currentEntryText: string;
  weighIns: { userId: string; sessionId: string; weekIndex: number; weightKg: number }[];
  userId: string;
  sessionId: string;
}) {
  const dayIdx = getDayOfYearIndex();

  // --- Diet detection ---
  const allText = useMemo(() => {
    return userJournals.map((j) => j.content).join(' ').toLowerCase();
  }, [userJournals]);

  const detectedDiet = useMemo(() => {
    for (const kw of DIET_KEYWORDS) {
      if (allText.includes(kw)) return kw;
    }
    return null;
  }, [allText]);

  // --- Daily tip ---
  const dailyTip = useMemo(() => {
    const pool = detectedDiet
      ? TIPS.filter((t) => t.dietTags.includes(detectedDiet) || t.dietTags.includes('general'))
      : TIPS;
    return pool[dayIdx % pool.length];
  }, [detectedDiet, dayIdx]);

  // --- Food alternatives ---
  const alternatives = useMemo(() => {
    const lower = currentEntryText.toLowerCase();
    return FOOD_ALTERNATIVES.filter((fa) => lower.includes(fa.trigger));
  }, [currentEntryText]);

  // --- Recipe suggestion (2+ consecutive weeks of weight loss) ---
  const showRecipe = useMemo(() => {
    const userWI = weighIns
      .filter((w) => w.userId === userId && w.sessionId === sessionId)
      .sort((a, b) => a.weekIndex - b.weekIndex);
    if (userWI.length < 2) return false;
    for (let i = 1; i < userWI.length; i++) {
      if (userWI[i].weightKg < userWI[i - 1].weightKg) {
        // Check next consecutive pair too
        if (i >= 2 && userWI[i - 1].weightKg < userWI[i - 2].weightKg) return true;
        if (i + 1 < userWI.length && userWI[i + 1]?.weightKg < userWI[i].weightKg) return true;
      }
    }
    return false;
  }, [weighIns, userId, sessionId]);

  const recipe = useMemo(() => {
    if (!showRecipe) return null;
    const pool = detectedDiet
      ? RECIPES.filter((r) => r.dietTags.includes(detectedDiet) || r.dietTags.includes('general'))
      : RECIPES;
    return pool[dayIdx % pool.length];
  }, [showRecipe, detectedDiet, dayIdx]);

  return (
    <div className="space-y-4">
      {/* Daily tip */}
      <Card tone="sunny">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-tangerine-200 text-tangerine-700">
            <Lightbulb size={16} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-tangerine-700 mb-1">
              Tip of the Day
              {detectedDiet && (
                <Badge tone="tangerine" className="ml-2 normal-case text-[10px]">
                  {detectedDiet}
                </Badge>
              )}
            </p>
            <p className="text-sm text-ink-900">{dailyTip.text}</p>
          </div>
        </div>
      </Card>

      {/* Food alternatives */}
      {alternatives.length > 0 && (
        <Card>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-grape-100 text-grape-600">
              <RefreshCw size={16} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-grape-700 mb-2">
                Healthier Swaps
              </p>
              <ul className="space-y-2">
                {alternatives.slice(0, 4).map((alt) => (
                  <li key={alt.trigger} className="text-sm">
                    <span className="font-semibold text-ink-900">{alt.trigger}</span>
                    <ArrowRight size={12} className="inline mx-1 text-ink-400" />
                    <span className="text-grape-700 font-medium">{alt.suggestion}</span>
                    <p className="text-xs text-ink-500 mt-0.5">{alt.tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Recipe suggestion */}
      {recipe && (
        <Card tone="lime">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lime-300/40 text-lime-600">
              <ChefHat size={16} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-lime-600 mb-1">
                Recipe Idea 🎉
              </p>
              <p className="text-sm text-ink-900">
                You've had consecutive weeks of progress — keep it up! Try this:
              </p>
              <p className="mt-1 text-sm font-medium text-ink-900">{recipe.text}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const JournalPage = () => {
  const user = useAuthStore((s) => s.currentUser);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const weighIns = useDataStore((s) => s.weighIns);
  const journals = useDataStore((s) => s.journals);
  const activeSessionId = useDataStore((s) => s.activeSessionId);

  const [joinOpen, setJoinOpen] = useState(false);

  const session = sessions.find((s) => s.id === activeSessionId);
  const participation = session
    ? participations.find((p) => p.userId === user?.id && p.sessionId === session.id)
    : undefined;

  const weekIdx = session ? currentWeekIndex(session) : 0;

  const userJournals = useMemo(() => {
    if (!user || !session) return [];
    return journals.filter((j) => j.userId === user.id && j.sessionId === session.id);
  }, [journals, user, session]);

  const currentEntry = useMemo(() => {
    return userJournals.find((j) => j.weekIndex === weekIdx);
  }, [userJournals, weekIdx]);

  if (!user) return null;

  // --- Empty state: no participation ---
  if (!session || !participation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <NotebookPen size={40} className="text-ink-400 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">No Active Session</h2>
        <p className="text-sm text-ink-500 max-w-md mb-6">
          Journal entries are tied to an active session. Join the current session to start writing.
        </p>
        <Button
          variant="primary"
          rightIcon={<ArrowRight size={18} />}
          onClick={() => setJoinOpen(true)}
        >
          Join a session
        </Button>
        <JoinSessionDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
      </div>
    );
  }

  // --- Active session: full layout ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Journal</h1>
          <p className="text-sm text-ink-500">
            {formatWeekLabel(session, weekIdx)} · {session.name}
          </p>
        </div>
        <SessionCountdown session={session} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <CurrentWeekEditor
            sessionId={session.id}
            weekIndex={weekIdx}
            existing={currentEntry?.content ?? ''}
          />
          <JournalHistory
            session={session}
            currentWeek={weekIdx}
            journals={userJournals}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24">
          <TipsSidebar
            userJournals={userJournals}
            currentEntryText={currentEntry?.content ?? ''}
            weighIns={weighIns}
            userId={user.id}
            sessionId={session.id}
          />
        </aside>
      </div>
    </div>
  );
};

export default JournalPage;
