import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  suffix?: ReactNode;
  prefix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, ...rest }, ref) => {
    if (prefix || suffix) {
      return (
        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl border-2 border-ink-900/15 bg-cream-50 px-3 py-2.5 transition focus-within:border-tangerine-500 focus-within:ring-4 focus-within:ring-tangerine-300/30',
            className,
          )}
        >
          {prefix && <span className="text-ink-500 text-sm">{prefix}</span>}
          <input
            ref={ref}
            {...rest}
            className="flex-1 bg-transparent outline-none placeholder:text-ink-300 text-ink-900"
          />
          {suffix && <span className="text-ink-500 text-sm font-medium">{suffix}</span>}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        {...rest}
        className={cn(
          'w-full rounded-2xl border-2 border-ink-900/15 bg-cream-50 px-4 py-2.5 outline-none transition placeholder:text-ink-300 text-ink-900 focus:border-tangerine-500 focus:ring-4 focus:ring-tangerine-300/30',
          className,
        )}
      />
    );
  },
);

Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        {...rest}
        className={cn(
          'w-full rounded-2xl border-2 border-ink-900/15 bg-cream-50 px-4 py-3 outline-none transition placeholder:text-ink-300 text-ink-900 resize-none focus:border-tangerine-500 focus:ring-4 focus:ring-tangerine-300/30',
          className,
        )}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = ({ className, children, ...rest }: LabelProps) => (
  <label
    {...rest}
    className={cn(
      'block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5',
      className,
    )}
  >
    {children}
  </label>
);
