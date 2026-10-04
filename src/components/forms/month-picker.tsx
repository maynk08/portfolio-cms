'use client';

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';
import { MONTH_LABELS, formatYearMonth, parseYearMonth, toYearMonth } from '@/lib/utils/format-date';

import type { Ref } from 'react';

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

export type MonthPickerProps = {
  // The field's id; its label must have the id `<id>-label`.
  id: string;
  // `YYYY-MM`, or null when empty.
  value: string | null;
  onChange: (value: string | null) => void;
  // Called when the picker closes, so validation runs like it does when a text field loses focus.
  onClose?: () => void;
  canClear: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// The one date picker of the CMS: calendar dates are months (`YYYY-MM`), picked from a year page of 12 months.
export function MonthPicker({ id, value, onChange, onClose, canClear, triggerRef, ariaInvalid, ariaDescribedBy }: MonthPickerProps) {
  const selected = value === null ? null : parseYearMonth(value);
  const today = currentYearMonth();
  const maxYear = today.year + YEARS_AHEAD;
  const [isOpen, setIsOpen] = useState(false);
  const [shownYear, setShownYear] = useState(selected?.year ?? today.year);

  const changeOpen = (open: boolean): void => {
    if (open) {
      setShownYear(selected?.year ?? today.year);
    } else {
      onClose?.();
    }
    setIsOpen(open);
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
          // Start on the selected month (or the current one) rather than on the "previous year" button.
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
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((label, index) => {
            const month = index + 1;
            const isSelected = selected?.year === shownYear && selected.month === month;
            const isInitialFocus = isSelected || (selected === null && shownYear === today.year && month === today.month);
            return (
              <Button
                key={label}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                aria-label={`${MONTH_NAMES_LONG[index] ?? label} ${shownYear}`}
                aria-pressed={isSelected}
                data-initial-focus={isInitialFocus}
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
