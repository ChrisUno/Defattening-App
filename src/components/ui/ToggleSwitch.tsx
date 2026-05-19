import { cn } from '../../lib/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch = ({ checked, onChange, label, disabled }: ToggleSwitchProps) => (
  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors',
        checked
          ? 'bg-grape-500 border-grape-500'
          : 'bg-ink-200 border-ink-200',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
    {label && <span className="text-sm font-semibold text-ink-700">{label}</span>}
  </label>
);
