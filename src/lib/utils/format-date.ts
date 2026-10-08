const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const MONTH_LABELS = MONTH_NAMES;

export interface YearMonth {
  year: number;
  // 1–12
  month: number;
}

// Calendar dates are `YYYY-MM` strings and are read from the text, never through `Date`, so time zones cannot shift them.
export function parseYearMonth(value: string): YearMonth | null {
  const match = YEAR_MONTH_PATTERN.exec(value);
  if (match === null) {
    return null;
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function toYearMonth({ year, month }: YearMonth): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

// "Mar 2024"
export function formatYearMonth(value: string): string {
  const parsed = parseYearMonth(value);
  return parsed === null ? value : `${MONTH_NAMES[parsed.month - 1] ?? ''} ${parsed.year}`;
}

// "Mar 2024 – Present"; `openEndLabel` names a missing end ("Present", "No expiry").
export function formatYearMonthRange(start: string, end: string | null, openEndLabel = 'Present'): string {
  return `${formatYearMonth(start)} – ${end === null ? openEndLabel : formatYearMonth(end)}`;
}

// A moment in time ("message received"), in the given or the viewer's own time zone: "4 Oct 2026, 18:05".
export function formatTimestamp(value: string | Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}

// The current calendar month as `YYYY-MM`, for comparing with stored months.
export function currentYearMonth(now = new Date()): string {
  return toYearMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
}
