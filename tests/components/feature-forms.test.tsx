// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileForm } from '@/features/profile/components/profile-form';
import { toProfileFormValues } from '@/features/profile/schemas';
import { RenameSectionDialog } from '@/features/sections/components/rename-section-dialog';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';

import { resetNavigationMocks } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { ProfileResponse } from '@/features/profile/schemas';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/profile/actions', () => ({ saveProfile: vi.fn() }));
vi.mock('@/features/sections/actions', () => ({ renameSection: vi.fn(), setSectionVisibility: vi.fn() }));
vi.mock('@/features/settings/actions', () => ({ changePassword: vi.fn(), saveSettings: vi.fn() }));

const { saveProfile } = await import('@/features/profile/actions');
const { renameSection } = await import('@/features/sections/actions');
const { changePassword } = await import('@/features/settings/actions');

const profile: ProfileResponse = {
  name: 'Ada',
  headline: 'Engineer',
  heroPhrases: [],
  about: '',
  photo: null,
  resume: null,
  socialLinks: [],
  location: { value: null, isVisible: false },
  publicEmail: { value: null, isVisible: false },
  isOpenToWork: { value: false, isVisible: false },
  yearsOfExperience: { value: null, isVisible: false },
  languages: { value: [], isVisible: false },
};

beforeEach(() => {
  resetNavigationMocks();
  vi.mocked(toast.success).mockClear();
});

describe('ProfileForm', () => {
  it('asks for an email address or a URL depending on the platform, and a label only for "Other"', async () => {
    const { user } = renderWithProviders(<ProfileForm initialValues={toProfileFormValues(profile)} knownMedia={{}} />);

    await user.click(screen.getByRole('button', { name: 'Add social link' }));
    const link = screen.getByRole('listitem', { name: 'Social link 1' });
    expect(within(link).getByLabelText(/^URL/)).toHaveAttribute('type', 'url');
    expect(within(link).getByLabelText(/^Label/)).not.toHaveAttribute('aria-required', 'true');

    await user.click(within(link).getByRole('combobox', { name: /^Platform/ }));
    await user.click(await screen.findByRole('option', { name: 'Email' }));
    expect(within(link).getByLabelText(/^Email address/)).toHaveAttribute('type', 'email');

    await user.click(within(link).getByRole('combobox', { name: /^Platform/ }));
    await user.click(await screen.findByRole('option', { name: 'Other' }));
    expect(within(link).getByLabelText(/^Label/)).toHaveAttribute('aria-required', 'true');
  });

  it('discards unsaved changes only after confirming, and only when there are some', async () => {
    const { user } = renderWithProviders(<ProfileForm initialValues={toProfileFormValues(profile)} knownMedia={{}} />);
    const discard = screen.getByRole('button', { name: 'Discard changes' });
    expect(discard).toBeDisabled();

    await user.clear(screen.getByLabelText(/^Headline/));
    await user.type(screen.getByLabelText(/^Headline/), 'Something else');
    await user.click(discard);
    const dialog = await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    await user.click(within(dialog).getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Headline/)).toHaveValue('Engineer');
    });
    expect(discard).toBeDisabled();
    expect(saveProfile).not.toHaveBeenCalled();
  });
});

describe('RenameSectionDialog', () => {
  const section = { key: 'about' as const, heading: 'About', isVisible: true, order: 1 };

  it('asks before closing with unsaved changes', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<RenameSectionDialog section={section} onClose={onClose} />);

    await user.type(screen.getByLabelText(/^Heading/), ' me');
    await user.keyboard('{Escape}');
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    expect(onClose).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole('button', { name: 'Discard changes' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves and closes', async () => {
    vi.mocked(renameSection).mockResolvedValue({ ok: true, message: 'About section renamed to "About me"', data: null });
    const onClose = vi.fn();
    const { user } = renderWithProviders(<RenameSectionDialog section={section} onClose={onClose} />);

    await user.type(screen.getByLabelText(/^Heading/), ' me');
    await user.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(renameSection).toHaveBeenCalledWith('about', { heading: 'About me' });
    expect(toast.success).toHaveBeenCalledWith('About section renamed to "About me"');
  });
});

describe('ChangePasswordForm', () => {
  it('empties the fields after a successful change', async () => {
    vi.mocked(changePassword).mockResolvedValue({ ok: true, message: 'Password changed.', data: null });
    const { user } = renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/^Current password/), 'old password 1');
    await user.type(screen.getByLabelText(/^New password/), 'a brand new pass');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'a brand new pass');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Current password/)).toHaveValue('');
    });
    expect(screen.getByLabelText(/^New password/)).toHaveValue('');
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'old password 1',
      newPassword: 'a brand new pass',
      confirmNewPassword: 'a brand new pass',
    });
  });
});
