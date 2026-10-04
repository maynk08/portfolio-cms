// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';

import { navigationState, resetNavigationMocks, routerMock } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));

const itemNoun = { singular: 'message', plural: 'messages' };

beforeEach(() => {
  resetNavigationMocks();
  navigationState.pathname = '/messages';
  navigationState.searchParams = new URLSearchParams('status=unread&page=2');
});

describe('DataTablePagination', () => {
  it('shows the range and links to the neighbouring pages, keeping other filters', () => {
    renderWithProviders(<DataTablePagination pagination={{ page: 2, pageSize: 20, totalItems: 57, totalPages: 3 }} itemNoun={itemNoun} />);

    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toHaveTextContent('Showing 21–40 of 57 messages');
    expect(nav).toHaveTextContent('Page 2 of 3');
    expect(within(nav).getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '/messages?status=unread');
    expect(within(nav).getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/messages?status=unread&page=3');
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = renderWithProviders(
      <DataTablePagination pagination={{ page: 1, pageSize: 20, totalItems: 57, totalPages: 3 }} itemNoun={itemNoun} />,
    );
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument();

    rerender(<DataTablePagination pagination={{ page: 3, pageSize: 20, totalItems: 57, totalPages: 3 }} itemNoun={itemNoun} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('shows only the count when everything fits on one small page', () => {
    renderWithProviders(<DataTablePagination pagination={{ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }} itemNoun={itemNoun} />);

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('1 message');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty list', () => {
    renderWithProviders(<DataTablePagination pagination={{ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }} itemNoun={itemNoun} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('goes back to the first page when the page size changes', async () => {
    const { user } = renderWithProviders(
      <DataTablePagination pagination={{ page: 2, pageSize: 20, totalItems: 57, totalPages: 3 }} itemNoun={itemNoun} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Per page' }));
    await user.click(await screen.findByRole('option', { name: '50' }));

    expect(routerMock.push).toHaveBeenCalledWith('/messages?status=unread&pageSize=50');
  });
});
