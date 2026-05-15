import { Flame } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-tangerine-300 animate-pulse">
        <Flame size={24} />
      </span>
      <p className="text-sm font-semibold text-ink-500">Loading…</p>
    </div>
  </div>
);
