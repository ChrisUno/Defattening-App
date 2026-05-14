import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, PartyPopper, AlertTriangle, Bell, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/cn';

const variantIcon = {
  default: Bell,
  success: CheckCircle2,
  celebrate: PartyPopper,
  warning: AlertTriangle,
};

const variantStyles = {
  default: 'bg-cream-50 border-ink-900/10 text-ink-900',
  success: 'bg-lime-300/40 border-lime-500/50 text-ink-900',
  celebrate: 'bg-gradient-to-br from-tangerine-100 to-grape-50 border-tangerine-300/60 text-ink-900',
  warning: 'bg-tangerine-100 border-tangerine-300 text-ink-900',
};

export const ToastViewport = () => {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const timer = window.setTimeout(() => dismiss(last.id), 4200);
    return () => window.clearTimeout(timer);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-full -translate-x-1/2 flex-col items-center gap-2 px-4 sm:bottom-8 sm:max-w-md">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = variantIcon[t.variant ?? 'default'];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 shadow-lg',
                variantStyles[t.variant ?? 'default'],
              )}
            >
              <Icon className="mt-0.5 shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t.title}</p>
                {t.description && <p className="text-xs text-ink-700 mt-0.5">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-ink-500 hover:text-ink-900"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
