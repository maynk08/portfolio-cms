// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ActionForm } from '@/components/forms/action-form';
import { ListField } from '@/components/forms/list-field';
import { MarkdownField } from '@/components/forms/markdown-field';
import { MonthField } from '@/components/forms/month-field';
import { NumberField } from '@/components/forms/number-field';
import { SwitchField } from '@/components/forms/switch-field';
import { TagsField } from '@/components/forms/tags-field';
import { TextField } from '@/components/forms/text-field';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';

import { resetNavigationMocks, routerMock } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { ActionResult } from '@/lib/actions/action-result';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const schema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(20, 'Use at most 20 characters'),
  years: z.number().int().min(0, 'Use 0 or more').nullable(),
  summary: z.string().max(10, 'Use at most 10 characters'),
  about: z.string(),
  isFeatured: z.boolean(),
  startDate: z
    .string()
    .nullable()
    .refine((value) => value !== null, 'Pick the month you started'),
  techStack: z.array(z.string()).max(3),
  highlights: z.array(z.string().trim().min(1, 'Write the highlight or remove it')),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const emptyValues: FormInput = {
  title: '',
  years: null,
  summary: '',
  about: '',
  isFeatured: false,
  startDate: null,
  techStack: [],
  highlights: [],
};

function TestForm({ action, onSuccess }: { action: (values: FormOutput) => Promise<ActionResult>; onSuccess?: () => void }) {
  const actionForm = useActionForm({ schema, defaultValues: emptyValues, action, onSuccess });
  const { control } = actionForm.form;
  return (
    <ActionForm actionForm={actionForm} cancelHref="/projects" submitLabel="Save project">
      <TextField control={control} name="title" label="Title" isRequired />
      <NumberField control={control} name="years" label="Years" />
      <TextareaField control={control} name="summary" label="Summary" maxLength={10} />
      <MarkdownField control={control} name="about" label="About" maxLength={1000} />
      <SwitchField control={control} name="isFeatured" label="Featured" description="Shown on the home page" />
      <MonthField control={control} name="startDate" label="Start date" isRequired />
      <TagsField control={control} name="techStack" label="Tech stack" maxItems={3} />
      <ListField control={control} name="highlights" label="Highlights" itemNoun="highlight" maxItems={5} />
    </ActionForm>
  );
}

function renderForm(action = vi.fn<(values: FormOutput) => Promise<ActionResult>>(), onSuccess = vi.fn()) {
  return { action, onSuccess, ...renderWithProviders(<TestForm action={action} onSuccess={onSuccess} />) };
}

async function pickMonth(user: ReturnType<typeof renderForm>['user'], label: string, year: number, monthName: string) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
  const dialog = await screen.findByRole('dialog');
  for (let shown = new Date().getFullYear(); shown > year; shown -= 1) {
    await user.click(within(dialog).getByRole('button', { name: 'Previous year' }));
  }
  await user.click(within(dialog).getByRole('button', { name: `${monthName} ${year}` }));
}

beforeEach(() => {
  resetNavigationMocks();
  vi.mocked(toast.success).mockClear();
});

describe('form behaviour', () => {
  it('marks required fields and checks a field when it loses focus, clearing the error once fixed', async () => {
    const { user } = renderForm();
    const title = screen.getByLabelText(/^Title/);

    expect(title).toHaveAttribute('aria-required', 'true');
    await user.click(title);
    await user.tab();
    expect(await screen.findByText('Enter a title')).toBeInTheDocument();
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveAccessibleDescription('Enter a title');

    await user.type(title, 'Site');
    await waitFor(() => {
      expect(screen.queryByText('Enter a title')).not.toBeInTheDocument();
    });
  });

  it('does not send an invalid form and focuses the first error', async () => {
    const { user, action } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Save project' }));

    expect(await screen.findByText('Enter a title')).toBeInTheDocument();
    expect(screen.getByText('Pick the month you started')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title/)).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });

  it('sends the parsed values, confirms with a toast and is no longer "unsaved"', async () => {
    const { user, action, onSuccess } = renderForm(
      vi.fn(() => Promise.resolve<ActionResult>({ ok: true, message: 'Project "Site" saved', data: null })),
    );

    await user.type(screen.getByLabelText(/^Title/), '  Site ');
    await user.type(screen.getByLabelText('Years'), '5');
    await user.click(screen.getByRole('switch', { name: 'Featured' }));
    await pickMonth(user, 'Start date', 2024, 'March');
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');

    await user.click(screen.getByRole('button', { name: 'Save project' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Project "Site" saved');
    });
    expect(action).toHaveBeenCalledWith({ ...emptyValues, title: 'Site', years: 5, isFeatured: true, startDate: '2024-03' });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('puts server errors next to their fields and anything else above the form', async () => {
    const { user } = renderForm(
      vi.fn(() =>
        Promise.resolve<ActionResult>({
          ok: false,
          fieldErrors: { title: 'This title is already used', unknownField: 'Something about the request' },
        }),
      ),
    );
    await user.type(screen.getByLabelText(/^Title/), 'Site');
    await pickMonth(user, 'Start date', 2024, 'March');

    await user.click(screen.getByRole('button', { name: 'Save project' }));

    expect(await screen.findByText('This title is already used')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title/)).toHaveFocus();
    expect(screen.getByText('Something about the request')).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Site');
  });
});

describe('unsaved changes', () => {
  it('asks before leaving through a link and leaves only after discarding', async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText(/^Title/), 'Draft');

    await user.click(screen.getByRole('link', { name: 'Cancel' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    expect(routerMock.push).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Discard changes' }));
    expect(routerMock.push).toHaveBeenCalledWith('/projects');
  });

  it('leaves without asking when nothing changed', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('link', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(routerMock.push).toHaveBeenCalledWith('/projects');
  });

  it('makes the browser warn before reloading or closing the tab', async () => {
    const { user } = renderForm();
    const cleanEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);

    await user.type(screen.getByLabelText(/^Title/), 'Draft');
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    fireEvent(window, dirtyEvent);

    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});

describe('fields', () => {
  it('counts characters in long text', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Summary'), 'Hello');

    expect(screen.getByLabelText('Summary')).toHaveAccessibleDescription('5 / 10 characters');
  });

  it('previews Markdown with unsafe HTML removed', async () => {
    const { user, container } = renderForm();

    await user.click(screen.getByLabelText('About'));
    await user.paste('**Bold** <script>alert(1)</script> [x](javascript:alert(1))');
    await user.click(screen.getByRole('tab', { name: 'Preview' }));

    const preview = await screen.findByRole('tabpanel', { name: 'Preview' });
    expect(within(preview).getByText('Bold').tagName).toBe('STRONG');
    expect(container.querySelector('script')).toBeNull();
    expect(within(preview).getByText('x').closest('a')?.getAttribute('href') ?? '').not.toMatch(/javascript/i);
  });

  it('picks and clears months only when optional', async () => {
    const { user } = renderForm();

    await pickMonth(user, 'Start date', 2023, 'November');

    expect(screen.getByRole('button', { name: 'Start date Nov 2023' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start date Nov 2023' }));
    expect(within(await screen.findByRole('dialog')).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'November 2023' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds tags with Enter or a comma, ignores duplicates and removes them', async () => {
    const { user } = renderForm();
    const input = screen.getByLabelText('Tech stack');

    await user.type(input, 'Node.js{Enter}React,node.js{Enter}');
    const tags = screen.getByRole('list', { name: 'Tech stack (added)' });
    expect(
      within(tags)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Node.js', 'React']);

    await user.click(screen.getByRole('button', { name: 'Remove Node.js' }));
    await user.type(input, '{Backspace}');
    expect(screen.queryByRole('list', { name: 'Tech stack (added)' })).not.toBeInTheDocument();
  });

  it('stops adding tags at the limit', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Tech stack'), 'A{Enter}B{Enter}C{Enter}');

    expect(screen.getByLabelText('Tech stack')).toBeDisabled();
    expect(screen.getByLabelText('Tech stack')).toHaveAttribute('placeholder', 'Limit of 3 reached');
  });

  it('adds, edits, reorders and removes list entries', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add highlight' }));
    expect(screen.getByRole('textbox', { name: 'Highlight 1' })).toHaveFocus();
    await user.keyboard('First');
    await user.click(screen.getByRole('button', { name: 'Add highlight' }));
    await user.keyboard('Second');

    await user.click(screen.getByRole('button', { name: 'Move highlight 2 up' }));
    expect(screen.getByRole('textbox', { name: 'Highlight 1' })).toHaveValue('Second');
    expect(screen.getByRole('textbox', { name: 'Highlight 2' })).toHaveValue('First');

    await user.click(screen.getByRole('button', { name: 'Remove highlight 1' }));
    expect(screen.getAllByRole('textbox', { name: /^Highlight/ })).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Highlight 1' })).toHaveValue('First');
  });

  it('shows an error next to an invalid list entry', async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText(/^Title/), 'Site');
    await pickMonth(user, 'Start date', 2024, 'March');
    await user.click(screen.getByRole('button', { name: 'Add highlight' }));

    await user.click(screen.getByRole('button', { name: 'Save project' }));

    expect(await screen.findByText('Write the highlight or remove it')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Highlight 1' })).toHaveAttribute('aria-invalid', 'true');
  });
});
