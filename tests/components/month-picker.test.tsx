// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { DateRangeFields } from '@/components/forms/date-range-fields';
import { MonthPicker } from '@/components/forms/month-picker';

import { renderWithProviders } from '../helpers/render';

import type { DateRangeValues } from '@/lib/validation/date-range';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);

function Picker({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <span id="field-start-label">Start date</span>
      <MonthPicker id="field-start" value={value} onChange={setValue} canClear={false} />
    </>
  );
}

function DateRangeForm({ startDate }: { startDate: string | null }) {
  const { control } = useForm<DateRangeValues>({ defaultValues: { startDate, endDate: null, isOngoing: false } });
  return <DateRangeFields control={control} startLabel="Started" endLabel="Left" ongoingLabel="I currently work here" />;
}

async function openPicker(user: ReturnType<typeof renderWithProviders>['user'], label: RegExp) {
  await user.click(screen.getByRole('button', { name: label }));
  return within(await screen.findByRole('dialog'));
}

describe('MonthPicker keyboard', () => {
  it('opens on the chosen month and moves by month, row and year with the keys', async () => {
    const { user } = renderWithProviders(<Picker initial="2024-06" />);
    await openPicker(user, /^Start date/);

    expect(screen.getByRole('button', { name: 'June 2024' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'May 2024' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'February 2024' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('button', { name: 'August 2024' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'December 2024' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'January 2024' })).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(screen.getByRole('button', { name: 'January 2023' })).toHaveFocus();
  });

  it('crosses into the next or previous year at the edges of the grid', async () => {
    const { user } = renderWithProviders(<Picker initial="2024-12" />);
    await openPicker(user, /^Start date/);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'January 2025' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'November 2024' })).toHaveFocus();
  });

  it('keeps only one month in the Tab order and picks the focused month with Enter', async () => {
    const { user } = renderWithProviders(<Picker initial="2024-06" />);
    const dialog = await openPicker(user, /^Start date/);

    const tabbable = dialog
      .getAllByRole('button')
      .filter((button) => /\d{4}$/.test(button.getAttribute('aria-label') ?? '') && button.tabIndex === 0);
    expect(tabbable.map((button) => button.getAttribute('aria-label'))).toEqual(['June 2024']);

    await user.keyboard('{ArrowRight}{Enter}');

    expect(screen.getByRole('button', { name: /^Start date/ })).toHaveTextContent('Jul 2024');
  });
});

describe('DateRangeFields', () => {
  it('opens an empty end month near the start month', async () => {
    const { user } = renderWithProviders(<DateRangeForm startDate="2019-03" />);
    await openPicker(user, /^Left/);

    expect(screen.getByRole('button', { name: 'March 2019' })).toHaveFocus();
  });

  it('opens on the current month when there is no start month yet', async () => {
    const { user } = renderWithProviders(<DateRangeForm startDate={null} />);
    await openPicker(user, /^Left/);

    const today = new Date();
    const monthName = today.toLocaleString('en', { month: 'long' });
    expect(screen.getByRole('button', { name: `${monthName} ${today.getFullYear()}` })).toHaveFocus();
  });
});
