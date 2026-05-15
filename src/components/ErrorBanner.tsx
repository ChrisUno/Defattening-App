import { X, AlertTriangle } from 'lucide-react';
import { useUiStore } from '../store/uiStore';

export const ErrorBanner = () => {
  const globalError = useUiStore((s) => s.globalError);
  const setGlobalError = useUiStore((s) => s.setGlobalError);

  if (!globalError) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-rose-bright text-cream-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <p className="text-sm font-semibold">{globalError}</p>
        </div>
        <button
          onClick={() => setGlobalError(null)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-cream-50/20"
          aria-label="Dismiss error"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
