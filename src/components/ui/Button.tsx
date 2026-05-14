import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-tangerine-500 text-cream-50 hover:bg-tangerine-600 active:translate-y-px shadow-[0_4px_0_0_var(--color-tangerine-700)] hover:shadow-[0_2px_0_0_var(--color-tangerine-700)] hover:translate-y-px',
  secondary:
    'bg-grape-500 text-cream-50 hover:bg-grape-700 shadow-[0_4px_0_0_var(--color-grape-700)] hover:shadow-[0_2px_0_0_var(--color-grape-700)] hover:translate-y-px',
  success:
    'bg-lime-500 text-cream-50 hover:bg-lime-600 shadow-[0_4px_0_0_var(--color-lime-600)] hover:shadow-[0_2px_0_0_var(--color-lime-600)] hover:translate-y-px',
  danger:
    'bg-rose-bright text-cream-50 hover:opacity-90 shadow-[0_4px_0_0_#9F1239] hover:shadow-[0_2px_0_0_#9F1239] hover:translate-y-px',
  outline:
    'bg-cream-50 text-ink-900 border-2 border-ink-900 hover:bg-ink-900 hover:text-cream-50',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-900/5',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-xl gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-2xl gap-2',
  lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
