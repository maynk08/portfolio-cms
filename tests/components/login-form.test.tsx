// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/features/auth/components/login-form';

import type { ActionFailure } from '@/lib/actions/action-result';

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn<(values: unknown, next: unknown) => Promise<ActionFailure>>() }));

vi.mock('@/features/auth/actions', () => ({ login: loginMock }));

function renderForm(next: string | null = null) {
  const user = userEvent.setup();
  render(<LoginForm next={next} />);
  return {
    user,
    email: screen.getByLabelText('Email'),
    password: screen.getByLabelText('Password'),
    submit: screen.getByRole('button', { name: 'Log in' }),
  };
}

beforeEach(() => {
  loginMock.mockReset();
});

describe('LoginForm', () => {
  it('checks a field when it loses focus and clears the error once it is fixed', async () => {
    const { user, email } = renderForm();

    await user.click(email);
    await user.tab();
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');

    await user.type(email, 'not-an-email');
    expect(await screen.findByText('Enter a valid email address, like name@example.com')).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, 'admin@example.com');
    await waitFor(() => {
      expect(screen.queryByText(/valid email address/)).not.toBeInTheDocument();
    });
    expect(email).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not submit empty fields and focuses the first error', async () => {
    const { user, email, submit } = renderForm();

    await user.click(submit);

    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('sends the details and the return path, and stays disabled while logging in', async () => {
    let finishLogin: (failure: ActionFailure) => void = () => undefined;
    loginMock.mockReturnValue(
      new Promise((resolve) => {
        finishLogin = resolve;
      }),
    );
    const { user, email, password, submit } = renderForm('/projects');

    await user.type(email, '  admin@example.com ');
    await user.type(password, 'correct horse battery');
    await user.click(submit);

    expect(loginMock).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'correct horse battery' }, '/projects');
    expect(await screen.findByRole('button', { name: 'Logging in…' })).toBeDisabled();

    finishLogin({ ok: false, formError: 'Email or password is incorrect.' });
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('shows a failed login as an alert', async () => {
    loginMock.mockResolvedValue({ ok: false, formError: 'Email or password is incorrect.' });
    const { user, email, password, submit } = renderForm();

    await user.type(email, 'admin@example.com');
    await user.type(password, 'wrong password');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(password).toHaveValue('wrong password');
  });

  it('puts server field errors next to the field and focuses it', async () => {
    loginMock.mockResolvedValue({ ok: false, fieldErrors: { password: 'Password must be at most 72 bytes' } });
    const { user, email, password, submit } = renderForm();

    await user.type(email, 'admin@example.com');
    await user.type(password, 'x');
    await user.click(submit);

    expect(await screen.findByText('Password must be at most 72 bytes')).toBeInTheDocument();
    expect(password).toHaveFocus();
    expect(password).toHaveAccessibleDescription('Password must be at most 72 bytes');
  });

  it('shows a general message when the request itself fails', async () => {
    loginMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { user, email, password, submit } = renderForm();

    await user.type(email, 'admin@example.com');
    await user.type(password, 'secret');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
  });

  it('shows and hides the password', async () => {
    const { user, password } = renderForm();
    const toggle = screen.getByRole('button', { name: 'Show password' });

    await user.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
