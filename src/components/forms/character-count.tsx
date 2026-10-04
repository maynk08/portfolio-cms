import { cn } from '@/lib/utils/cn';

// "120 / 1,000 characters"; turns red past the limit, which the schema then reports as an error.
export function CharacterCount({ length, maxLength }: { length: number; maxLength: number }) {
  const isOver = length > maxLength;
  return (
    <span className={cn('tabular-nums', isOver && 'text-destructive')}>
      {`${length.toLocaleString('en')} / ${maxLength.toLocaleString('en')} characters`}
    </span>
  );
}
