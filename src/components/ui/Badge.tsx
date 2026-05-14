import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface BadgeProps {
  children: ReactNode;
  tone?: 'tangerine' | 'grape' | 'lime' | 'ink' | 'cream' | 'rose';
  className?: string;
}

const toneClasses = {
  tangerine: 'bg-tangerine-100 text-tangerine-700 border-tangerine-300',
  grape: 'bg-grape-50 text-grape-700 border-grape-300',
  lime: 'bg-lime-300/40 text-lime-600 border-lime-500/50',
  ink: 'bg-ink-900 text-cream-50 border-ink-900',
  cream: 'bg-cream-100 text-ink-700 border-ink-900/15',
  rose: 'bg-rose-bright/15 text-rose-bright border-rose-bright/40',
};

export const Badge = ({ children, tone = 'cream', className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);
