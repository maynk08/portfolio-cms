// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs';
import { ExperienceForm } from '@/features/experience/components/experience-form';
import { EMPTY_EXPERIENCE } from '@/features/experience/schemas';
import { ProjectTable } from '@/features/projects/components/project-table';

import { navigationState, resetNavigationMocks, routerMock } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { Project } from '@/features/projects/schemas';
import type { ActionResult } from '@/lib/actions/action-result';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/projects/actions', () => ({
  reorderProjects: vi.fn(),
  deleteProject: vi.fn(),
  setProjectFeatured: vi.fn(),
  setProjectVisibility: vi.fn(),
}));
vi.mock('@/features/experience/actions', () => ({ createExperience: vi.fn(), updateExperience: vi.fn() }));

const { reorderProjects } = await import('@/features/projects/actions');
const { createExperience } = await import('@/features/experience/actions');

function project(id: string, title: string): Project {
  return { id: id.repeat(24), title, slug: title.toLowerCase(), techStack: [], gallery: [], isFeatured: false, isVisible: true };
}

const projects = [project('a', 'Alpha'), project('b', 'Beta'), project('c', 'Gamma')];

function titlesInOrder(): string[] {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1]?.textContent ?? '');
}

beforeEach(() => {
  resetNavigationMocks();
  vi.mocked(toast.error).mockClear();
  vi.mocked(reorderProjects).mockReset();
});

describe('reordering projects', () => {
  it('moves a row at once and saves the full new order', async () => {
    let finishSaving: (result: ActionResult) => void = () => undefined;
    vi.mocked(reorderProjects).mockReturnValue(
      new Promise((resolve) => {
        finishSaving = resolve;
      }),
    );
    const { user } = renderWithProviders(<ProjectTable projects={projects} />);

    await user.click(screen.getByRole('button', { name: 'Move down "Alpha"' }));

    expect(titlesInOrder()).toEqual(['Beta/projects/beta', 'Alpha/projects/alpha', 'Gamma/projects/gamma']);
    expect(reorderProjects).toHaveBeenCalledWith(['b'.repeat(24), 'a'.repeat(24), 'c'.repeat(24)]);
    finishSaving({ ok: true, message: 'Order saved', data: null });
  });

  it('puts the row back and explains when saving fails', async () => {
    vi.mocked(reorderProjects).mockResolvedValue({ ok: false, formError: 'Can’t reach the server.' });
    const { user } = renderWithProviders(<ProjectTable projects={projects} />);

    await user.click(screen.getByRole('button', { name: 'Move up "Gamma"' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Can’t reach the server.');
    });
    // The toast is shown inside the transition, a moment before React puts the row back.
    await waitFor(() => {
      expect(titlesInOrder()).toEqual(['Alpha/projects/alpha', 'Beta/projects/beta', 'Gamma/projects/gamma']);
    });
  });

  it('cannot move the first row up or the last row down, and says why', () => {
    renderWithProviders(<ProjectTable projects={projects} />);

    expect(screen.getByLabelText('Move up "Alpha": Already first')).toBeInTheDocument();
    expect(screen.getByLabelText('Move down "Gamma": Already last')).toBeInTheDocument();
  });
});

describe('ongoing dates', () => {
  it('hides the end month while "I currently work here" is ticked', async () => {
    const { user } = renderWithProviders(<ExperienceForm initialValues={EMPTY_EXPERIENCE} knownMedia={{}} />);
    expect(screen.getByRole('button', { name: /^Left/ })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'I currently work here' }));

    expect(screen.queryByRole('button', { name: /^Left/ })).not.toBeInTheDocument();
  });

  it('returns to the list after creating', async () => {
    vi.mocked(createExperience).mockResolvedValue({ ok: true, message: 'Experience "Engineer at Acme" created', data: { id: 'x' } });
    const { user } = renderWithProviders(
      <ExperienceForm initialValues={{ ...EMPTY_EXPERIENCE, startDate: '2022-03', isOngoing: true }} knownMedia={{}} />,
    );

    await user.type(screen.getByLabelText(/^Role/), 'Engineer');
    await user.type(screen.getByRole('textbox', { name: /^Company\b(?! website)/ }), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Create experience' }));

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/experience');
    });
  });
});

describe('breadcrumbs', () => {
  it('link back to the list from an item page', () => {
    navigationState.pathname = '/projects/new';
    renderWithProviders(<AppBreadcrumbs />);

    const trail = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(within(trail).getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    expect(trail).toHaveTextContent('ContentProjectsNew');
  });
});
