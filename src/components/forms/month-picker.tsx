'use client';

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';
import { MONTH_LABELS, formatYearMonth, parseYearMonth, toYearMonth } from '@/lib/utils/format-date';

import type { KeyboardEvent, Ref } from 'react';

const MONTH_NAMES_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const MIN_YEAR = 1970;
const YEARS_AHEAD = 10;
const MONTHS_PER_ROW = 3;

// How many months each key moves the focus within the month grid; Home and End are handled separately.
const MONTH_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -MONTHS_PER_ROW,
  ArrowDown: MONTHS_PER_ROW,
  PageUp: -12,
  PageDown: 12,
};

export type MonthPickerProps = {
  // The field's id; its label must have the id `<id>-label`.
  id: string;
  // `YYYY-MM`, or null when empty.
  value: string | null;
  onChange: (value: string | null) => void;
  // Called when the picker closes, so validation runs like it does when a text field loses focus.
  onClose?: () => void;
  canClear: boolean;
  // Where to open while empty, e.g. the start month for an end month; the current month when null too.
  openNear?: string | null;
  triggerRef?: Ref<HTMLButtonElement>;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * The one date picker of the CMS: calendar dates are months (`YYYY-MM`), picked from a year page of 12 months. The
 * months work as a keyboard grid: arrows move by month and row, Page Up / Page Down by year, Home / End to the row's
 * ends of the year; only the focused month is in the Tab order, so Tab leaves the grid in one step.
 */
export function MonthPicker({
  id,
  value,
  onChange,
  onClose,
  canClear,
  openNear = null,
  triggerRef,
  ariaInvalid,
  ariaDescribedBy,
}: MonthPickerProps) {
  const selected = value === null ? null : parseYearMonth(value);
  const today = currentYearMonth();
  const maxYear = today.year + YEARS_AHEAD;
  const [isOpen, setIsOpen] = useState(false);
  const [shownYear, setShownYear] = useState(selected?.year ?? today.year);
  const [focusedMonth, setFocusedMonth] = useState(selected?.month ?? today.month);
  const monthButtons = useRef<(HTMLButtonElement | null)[]>([]);
  // Set by a key press, so focus follows the keyboard but never jumps on its own.
  const shouldMoveFocus = useRef(false);

  useEffect(() => {
    if (shouldMoveFocus.current) {
      shouldMoveFocus.current = false;
      monthButtons.current[focusedMonth - 1]?.focus();
    }
  }, [focusedMonth, shownYear]);

  const changeOpen = (open: boolean): void => {
    if (open) {
      const start = selected ?? (openNear === null ? null : parseYearMonth(openNear)) ?? today;
      setShownYear(start.year);
      setFocusedMonth(start.month);
    } else {
      onClose?.();
    }
    setIsOpen(open);
  };

  const moveFocus = (months: number): void => {
    const target = shownYear * 12 + (focusedMonth - 1) + months;
    const year = Math.floor(target / 12);
    if (year < MIN_YEAR || year > maxYear) {
      return;
    }
    shouldMoveFocus.current = true;
    setShownYear(year);
    setFocusedMonth((target % 12) + 1);
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const step = event.key === 'Home' ? 1 - focusedMonth : event.key === 'End' ? 12 - focusedMonth : MONTH_STEPS[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    moveFocus(step);
  };

  const pick = (month: number): void => {
    onChange(toYearMonth({ year: shownYear, month }));
    changeOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={triggerRef}
          type="button"
          variant="outline"
          className={cn('w-full max-w-56 justify-between font-normal', value === null && 'text-muted-foreground')}
          // Announces the label and the chosen month: "Start date, Mar 2024".
          aria-labelledby={`${id}-label ${id}-value`}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <span id={`${id}-value`}>{value === null ? 'Select month' : formatYearMonth(value)}</span>
          <CalendarIcon aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64"
        align="start"
        onOpenAutoFocus={(event) => {
          // Start on the focused month (selected, near the related month, or current) rather than on "previous year".
          const target = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLButtonElement>('[data-initial-focus="true"]');
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous year"
            disabled={shownYear <= MIN_YEAR}
            onClick={() => {
              setShownYear((year) => year - 1);
            }}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <span aria-live="polite" className="text-sm font-medium tabular-nums">
            {shownYear}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next year"
            disabled={shownYear >= maxYear}
            onClick={() => {
              setShownYear((year) => year + 1);
            }}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>
        <div role="group" aria-label={`Months of ${shownYear}`} className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((label, index) => {
            const month = index + 1;
            const isSelected = selected?.year === shownYear && selected.month === month;
            const isFocusTarget = month === focusedMonth;
            return (
              <Button
                key={label}
                ref={(button) => {
                  monthButtons.current[index] = button;
                }}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                aria-label={`${MONTH_NAMES_LONG[index] ?? label} ${shownYear}`}
                aria-pressed={isSelected}
                tabIndex={isFocusTarget ? 0 : -1}
                onKeyDown={handleGridKeyDown}
                data-initial-focus={isFocusTarget}
                onClick={() => {
                  pick(month);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
        {canClear && value !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              onChange(null);
              changeOpen(false);
            }}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
