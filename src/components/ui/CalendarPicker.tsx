import { useEffect, useRef, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isBefore,
  isSameDay,
  format,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface CalendarPickerProps {
  value: string;
  onChange: (iso: string) => void;
  minDate?: Date;
  placeholder?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarPicker = ({
  value,
  onChange,
  minDate,
  placeholder = 'Pick date',
}: CalendarPickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? startOfMonth(new Date(value)) : startOfMonth(new Date()),
  );
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (value) setViewMonth(startOfMonth(new Date(value)));
  }, [value]);

  const selectedDate = value ? new Date(value) : null;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectDay = (d: Date) => {
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors',
          'border-ink-900/10 bg-white hover:border-grape-300',
          open && 'border-grape-400 ring-2 ring-grape-200',
        )}
      >
        <Calendar size={14} className="text-grape-500" />
        <span className={value ? 'text-ink-900' : 'text-ink-400'}>
          {value ? format(new Date(value), 'MMM d, yyyy') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-2xl border-2 border-ink-900/10 bg-white p-3 shadow-xl">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-lg p-1 hover:bg-cream-100 text-ink-500"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-ink-900">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-lg p-1 hover:bg-cream-100 text-ink-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-ink-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const disabled = minDate ? isBefore(day, minDate) && !isSameDay(day, minDate) : false;
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-8 w-full rounded-lg text-xs font-semibold transition-colors',
                    !inMonth && 'text-ink-200',
                    inMonth && !selected && !disabled && 'text-ink-700 hover:bg-grape-50',
                    disabled && 'text-ink-200 cursor-not-allowed',
                    selected && 'bg-grape-500 text-white hover:bg-grape-600',
                    today && !selected && inMonth && 'ring-1 ring-grape-300',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="mt-2 w-full text-xs text-ink-400 hover:text-ink-600 font-semibold py-1"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
};
