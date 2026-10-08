import { z } from 'zod';

import { yearMonthSchema } from './common-schemas';

// The form side of a start / end month pair with an "ongoing" checkbox (current job, still studying, no expiry).
export const dateRangeFields = {
  startDate: yearMonthSchema.nullable(),
  endDate: yearMonthSchema.nullable(),
  isOngoing: z.boolean(),
};

export interface DateRangeValues {
  startDate: string | null;
  endDate: string | null;
  isOngoing: boolean;
}

type DateRangeMessages = { missingStart: string; missingEnd: string };

// Adds the date errors next to the right field. `YYYY-MM` strings compare correctly as plain text.
export function checkDateRange(values: DateRangeValues, context: z.RefinementCtx, messages: DateRangeMessages): void {
  if (values.startDate === null) {
    context.addIssue({ code: 'custom', path: ['startDate'], message: messages.missingStart });
  }
  if (values.isOngoing) {
    return;
  }
  if (values.endDate === null) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: messages.missingEnd });
  } else if (values.startDate !== null && values.endDate < values.startDate) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'The end month cannot be before the start month' });
  }
}

// The saved dates: an ongoing range has no end. Only called after `checkDateRange` passed, so the start is set.
export function toSavedRange(values: DateRangeValues): { start: string; end: string | null } {
  return { start: values.startDate ?? '', end: values.isOngoing ? null : values.endDate };
}

export function toDateRangeValues(start: string, end: string | null | undefined): DateRangeValues {
  return { startDate: start, endDate: end ?? null, isOngoing: end === null || end === undefined };
}

export const EMPTY_DATE_RANGE: DateRangeValues = { startDate: null, endDate: null, isOngoing: false };
