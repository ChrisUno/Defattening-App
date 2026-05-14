import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'default' | 'sunny' | 'grape' | 'lime' | 'ink';
}

const toneClasses = {
  default: 'bg-cream-50 border-ink-900/10',
  sunny: 'bg-tangerine-50 border-tangerine-300/40',
  grape: 'bg-grape-50 border-grape-300/40',
  lime: 'bg-lime-300/20 border-lime-500/40',
  ink: 'bg-ink-900 text-cream-50 border-ink-900',
};

export const Card = ({ children, tone = 'default', className, ...rest }: CardProps) => {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-3xl border-2 p-6 shadow-[0_2px_0_0_rgba(27,20,16,0.06)]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
};
