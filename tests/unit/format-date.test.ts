import { describe, expect, it } from 'vitest';

import { formatTimestamp, formatYearMonth, formatYearMonthRange, parseYearMonth, toYearMonth } from '@/lib/utils/format-date';

describe('calendar months', () => {
  it('formats YYYY-MM without going through a time zone', () => {
    expect(formatYearMonth('2024-03')).toBe('Mar 2024');
    expect(formatYearMonth('2024-12')).toBe('Dec 2024');
  });

  it('leaves values it does not understand unchanged', () => {
    expect(formatYearMonth('March 2024')).toBe('March 2024');
    expect(parseYearMonth('2024-13')).toBeNull();
  });

  it('formats ranges, naming an open end', () => {
    expect(formatYearMonthRange('2022-01', '2024-06')).toBe('Jan 2022 – Jun 2024');
    expect(formatYearMonthRange('2022-01', null)).toBe('Jan 2022 – Present');
    expect(formatYearMonthRange('2025-01', null, 'No expiry')).toBe('Jan 2025 – No expiry');
  });

  it('round-trips between text and parts', () => {
    expect(toYearMonth({ year: 2024, month: 3 })).toBe('2024-03');
    expect(parseYearMonth('2024-03')).toEqual({ year: 2024, month: 3 });
  });
});

describe('formatTimestamp', () => {
  it('shows a moment in the requested time zone', () => {
    expect(formatTimestamp('2026-10-04T12:30:00.000Z', 'UTC')).toBe('4 Oct 2026, 12:30');
    expect(formatTimestamp('2026-10-04T12:30:00.000Z', 'Asia/Kolkata')).toBe('4 Oct 2026, 18:00');
  });
});
