'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/features/auth/actions';
import { loginSchema } from '@/features/auth/schemas';

import type { LoginFailure } from '@/features/auth/login-failure';
import type { LoginInput } from '@/features/auth/schemas';

const LOGIN_FIELDS = ['email', 'password'] as const;

type LoginFormProps = {
  // Where to go after logging in; checked again on the server.
  next: string | null;
};

export function LoginForm({ next }: LoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Validate a field when it loses focus, then on every change once it shows an error.
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const submit = (values: LoginInput): void => {
    // A transition keeps the form pending until the redirect after a successful login has finished.
    startTransition(async () => {
      let failure: LoginFailure;
      try {
        failure = await login(values, next);
      } catch (error) {
        // A successful login ends in a redirect, which Next.js signals by throwing; let it through.
        unstable_rethrow(error);
        setError('root.server', { message: 'Something went wrong while logging in. Try again.' });
        return;
      }

      const fieldsWithErrors = LOGIN_FIELDS.filter((field) => failure.fieldErrors?.[field] !== undefined);
      fieldsWithErrors.forEach((field, index) => {
        setError(field, { message: failure.fieldErrors?.[field] }, { shouldFocus: index === 0 });
      });
      if (failure.formError !== undefined) {
        setError('root.server', { message: failure.formError });
      }
    });
  };

  const formError = errors.root?.server?.message;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {formError !== undefined && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          aria-invalid={errors.email !== undefined}
          aria-describedby={errors.email === undefined ? undefined : 'email-error'}
          {...register('email')}
        />
        {errors.email?.message !== undefined && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            className="pr-10"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password === undefined ? undefined : 'password-error'}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            onClick={() => {
              setIsPasswordVisible((isVisible) => !isVisible);
            }}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        {errors.password?.message !== undefined && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
