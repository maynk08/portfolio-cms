import { toast } from 'sonner';

import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { ActionResult } from '@/lib/actions/action-result';

// Every toast goes through here, so success and failure always look and read the same way.
export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}

// For actions without a form: a failure's field errors have nowhere to go, so the first one is shown.
export function notifyResult(result: ActionResult<unknown>): void {
  if (result.ok) {
    notifySuccess(result.message);
    return;
  }
  notifyError(result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? GENERIC_ERROR_MESSAGE);
}
