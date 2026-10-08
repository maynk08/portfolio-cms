'use client';

import { useWatch } from 'react-hook-form';

import { CheckboxField } from '@/components/forms/checkbox-field';
import { MonthField } from '@/components/forms/month-field';

import type { DateRangeValues } from '@/lib/validation/date-range';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

type DateRangeFieldsProps<T extends FieldValues & DateRangeValues, TTransformed extends FieldValues> = {
  control: Control<T, unknown, TTransformed>;
  startLabel: string;
  endLabel: string;
  // "I currently work here", "Still studying", "Does not expire"
  ongoingLabel: string;
};

// Start and end month, with a checkbox that removes the end month for ongoing items.
export function DateRangeFields<T extends FieldValues & DateRangeValues, TTransformed extends FieldValues>({
  control,
  startLabel,
  endLabel,
  ongoingLabel,
}: DateRangeFieldsProps<T, TTransformed>) {
  // The form type includes the date range fields (see the constraint on T); TypeScript cannot prove these paths generically.
  const startName = 'startDate' as FieldPath<T>;
  const endName = 'endDate' as FieldPath<T>;
  const ongoingName = 'isOngoing' as FieldPath<T>;
  const isOngoing = useWatch({ control, name: ongoingName }) === true;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <MonthField control={control} name={startName} label={startLabel} isRequired />
        {!isOngoing && <MonthField control={control} name={endName} label={endLabel} isRequired />}
      </div>
      <CheckboxField control={control} name={ongoingName} label={ongoingLabel} />
    </div>
  );
}
