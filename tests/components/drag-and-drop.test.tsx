// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectTable } from '@/features/projects/components/project-table';
import { SectionsTable } from '@/features/sections/components/sections-table';
import { SECTION_KEYS } from '@/features/sections/schemas';

import { resetNavigationMocks } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { Project } from '@/features/projects/schemas';
import type { Section } from '@/features/sections/schemas';

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
vi.mock('@/features/sections/actions', () => ({
  reorderSections: vi.fn(),
  renameSection: vi.fn(),
  setSectionVisibility: vi.fn(),
}));

const { reorderProjects } = await import('@/features/projects/actions');
const { reorderSections } = await import('@/features/sections/actions');

const ROW_HEIGHT = 40;

function project(id: string, title: string): Project {
  return { id: id.repeat(24), title, slug: title.toLowerCase(), techStack: [], gallery: [], isFeatured: false, isVisible: true };
}

const projects = [project('a', 'Alpha'), project('b', 'Beta'), project('c', 'Gamma')];

const sections: Section[] = SECTION_KEYS.map((key, order) => ({
  key,
  heading: key === 'hero' ? 'Home' : key.charAt(0).toUpperCase() + key.slice(1),
  isVisible: true,
  order,
}));

// jsdom does no layout; the keyboard drag measures rows, so each table row gets a place by its position.
function layOutRows(): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const row = this.closest('tr');
    const index = row?.parentElement === null || row === null ? 0 : [...row.parentElement.children].indexOf(row);
    const top = index * ROW_HEIGHT;
    return { x: 0, y: top, top, left: 0, right: 600, bottom: top + ROW_HEIGHT, width: 600, height: ROW_HEIGHT, toJSON: () => ({}) };
  });
}

function rowTitles(): string[] {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[2]?.textContent ?? '');
}

beforeEach(() => {
  resetNavigationMocks();
  vi.mocked(reorderProjects).mockResolvedValue({ ok: true, message: 'Order saved', data: null });
  vi.mocked(reorderSections).mockResolvedValue({ ok: true, message: 'Order saved', data: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dragging rows', () => {
  it('gives every row a named drag handle with instructions for screen readers', () => {
    renderWithProviders(<ProjectTable projects={projects} />);

    const handle = screen.getByRole('button', { name: 'Reorder "Beta"' });
    expect(handle).toHaveAttribute('aria-roledescription', 'sortable');
    const instructions = document.getElementById(handle.getAttribute('aria-describedby') ?? '');
    expect(instructions).toHaveTextContent(/press Space or Enter to pick up the row/);
  });

  it('moves a row with the keyboard and saves the new order', async () => {
    layOutRows();
    const { user } = renderWithProviders(<ProjectTable projects={projects} />);

    screen.getByRole('button', { name: 'Reorder "Alpha"' }).focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');

    await waitFor(() => {
      expect(reorderProjects).toHaveBeenCalledWith(['b'.repeat(24), 'a'.repeat(24), 'c'.repeat(24)]);
    });
    expect(rowTitles()).toEqual(['Beta/projects/beta', 'Alpha/projects/alpha', 'Gamma/projects/gamma']);
  });

  it('leaves the order alone when the move is cancelled with Escape', async () => {
    layOutRows();
    const { user } = renderWithProviders(<ProjectTable projects={projects} />);

    screen.getByRole('button', { name: 'Reorder "Alpha"' }).focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');

    expect(reorderProjects).not.toHaveBeenCalled();
    expect(rowTitles()).toEqual(['Alpha/projects/alpha', 'Beta/projects/beta', 'Gamma/projects/gamma']);
  });
});

describe('section order', () => {
  it('keeps the hero in place: no handle, and its move actions say why', () => {
    renderWithProviders(<SectionsTable sections={sections} />);

    expect(screen.queryByRole('button', { name: 'Reorder "Home"' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder "About"' })).toBeInTheDocument();
    expect(screen.getByLabelText('Move up "Home": The hero stays at the top')).toBeInTheDocument();
    expect(screen.getByLabelText('Move down "Home": The hero stays at the top')).toBeInTheDocument();
    // Nothing moves above the hero, so the section after it is already first.
    expect(screen.getByLabelText('Move up "About": Already first')).toBeInTheDocument();
  });

  it('saves the order by section key when a section moves down', async () => {
    const { user } = renderWithProviders(<SectionsTable sections={sections} />);

    await user.click(screen.getByRole('button', { name: 'Move down "About"' }));

    expect(reorderSections).toHaveBeenCalledWith([
      'hero',
      'experience',
      'about',
      'projects',
      'skills',
      'education',
      'certifications',
      'contact',
    ]);
  });
});
