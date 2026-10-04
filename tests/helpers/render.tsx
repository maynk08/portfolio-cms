import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UnsavedChangesProvider } from '@/components/navigation/unsaved-changes';
import { TooltipProvider } from '@/components/ui/tooltip';

import type { ReactElement } from 'react';

// Renders inside the providers the dashboard layout supplies.
export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup();
  const result = render(
    <TooltipProvider>
      <UnsavedChangesProvider>{ui}</UnsavedChangesProvider>
    </TooltipProvider>,
  );
  return { user, ...result };
}
