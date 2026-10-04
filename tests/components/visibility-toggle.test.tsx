// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisibilityToggle } from '@/components/data-table/visibility-toggle';

import { renderWithProviders } from '../helpers/render';

import type { ActionResult } from '@/lib/actions/action-result';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function deferred() {
  let resolve: (result: ActionResult<unknown>) => void = () => undefined;
  const promise = new Promise<ActionResult<unknown>>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe('VisibilityToggle', () => {
  it('moves at once, saves, and confirms with a toast', async () => {
    const save = deferred();
    const onChange = vi.fn(() => save.promise);
    const { user } = renderWithProviders(<VisibilityToggle isVisible itemLabel="Portfolio CMS" onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Show "Portfolio CMS" on the portfolio' });

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(onChange).toHaveBeenCalledWith(false);
    save.resolve({ ok: true, message: 'Project "Portfolio CMS" hidden', data: null });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Project "Portfolio CMS" hidden');
    });
  });

  it('snaps back and explains when saving fails', async () => {
    const onChange = vi.fn(() => Promise.resolve<ActionResult<unknown>>({ ok: false, formError: 'Can’t reach the server.' }));
    const { user } = renderWithProviders(<VisibilityToggle isVisible itemLabel="Portfolio CMS" onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Show "Portfolio CMS" on the portfolio' });

    await user.click(toggle);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Can’t reach the server.');
    });
    expect(toggle).toBeChecked();
  });
});
