import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ClassValue } from 'clsx';

// Joins conditional class names; later Tailwind classes override conflicting earlier ones.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
