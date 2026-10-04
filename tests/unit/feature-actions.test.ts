import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveProfile } from '@/features/profile/actions';
import { emptySocialLink, toProfileFormValues } from '@/features/profile/schemas';
import { renameSection, setSectionVisibility } from '@/features/sections/actions';
import { changePassword } from '@/features/settings/actions';
import { apiRequest } from '@/lib/api/api-client';
import { ApiValidationError } from '@/lib/api/api-errors';
import { setSessionToken } from '@/lib/session/session-token';

import type { ProfileResponse } from '@/features/profile/schemas';

vi.mock('@/lib/api/api-client', () => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/session/session-token', () => ({ setSessionToken: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

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
  apiRequestMock.mockReset();
  vi.mocked(setSessionToken).mockReset();
});

describe('saveProfile', () => {
  it('validates the raw form values and sends the converted profile', async () => {
    apiRequestMock.mockResolvedValue(profile);
    const values = {
      ...toProfileFormValues(profile),
      socialLinks: [{ ...emptySocialLink(), platform: 'email' as const, url: 'ada@example.com' }],
    };

    const result = await saveProfile(values);

    expect(result).toEqual({ ok: true, message: 'Profile saved', data: null });
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/profile',
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({
          socialLinks: [{ platform: 'email', label: null, url: 'mailto:ada@example.com', isVisible: true }],
        }) as unknown,
      }),
    );
  });

  it('returns field errors without calling the backend', async () => {
    const result = await saveProfile({ ...toProfileFormValues(profile), name: '' });

    expect(result).toEqual({ ok: false, fieldErrors: { name: 'Enter your name' } });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

describe('section actions', () => {
  it('renames a section with a specific message', async () => {
    apiRequestMock.mockResolvedValue({});

    expect(await renameSection('about', { heading: ' About me ' })).toEqual({
      ok: true,
      message: 'About section renamed to "About me"',
      data: null,
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/sections/about',
      expect.objectContaining({ method: 'PATCH', body: { heading: 'About me' } }),
    );
  });

  it('refuses an unknown section without calling the backend', async () => {
    expect(await renameSection('../auth', { heading: 'x' })).toEqual({ ok: false, formError: 'This section does not exist.' });
    expect(await setSectionVisibility('skills', 'yes')).toEqual({ ok: false, formError: 'This section does not exist.' });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('describes a visibility change', async () => {
    apiRequestMock.mockResolvedValue({});

    expect(await setSectionVisibility('skills', false)).toMatchObject({ ok: true, message: 'Skills section hidden from the portfolio' });
  });
});

describe('changePassword', () => {
  const values = { currentPassword: 'old password 1', newPassword: 'a brand new pass', confirmNewPassword: 'a brand new pass' };

  it('keeps this session by storing the new token', async () => {
    const expiresAt = new Date('2026-10-12T00:00:00.000Z');
    apiRequestMock.mockResolvedValue({ token: 'new-token', expiresAt });

    const result = await changePassword(values);

    expect(result).toMatchObject({ ok: true, message: 'Password changed. Any other sessions have been logged out.' });
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/auth/password',
      expect.objectContaining({ method: 'PATCH', body: { currentPassword: 'old password 1', newPassword: 'a brand new pass' } }),
    );
    expect(setSessionToken).toHaveBeenCalledWith('new-token', expiresAt);
  });

  it('puts a wrong current password next to that field and keeps the session cookie', async () => {
    apiRequestMock.mockRejectedValue(
      new ApiValidationError('Validation failed', [{ field: 'currentPassword', message: 'Current password is incorrect' }]),
    );

    expect(await changePassword(values)).toEqual({ ok: false, fieldErrors: { currentPassword: 'Current password is incorrect' } });
    expect(setSessionToken).not.toHaveBeenCalled();
  });
});
