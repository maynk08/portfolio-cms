import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';
import { getSafeRedirectPath } from '@/features/auth/safe-redirect';
import { hasValidSession } from '@/features/auth/session';
import { LOGIN_REASONS } from '@/lib/session/login-paths';

import type { LoginReason } from '@/lib/session/login-paths';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Log in' };

const REASON_NOTICES: Record<LoginReason, string> = {
  expired: 'Your session has ended. Log in again to continue.',
  'logged-out': 'You have been logged out.',
};

function firstValue(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function isLoginReason(value: string | null): value is LoginReason {
  return LOGIN_REASONS.some((reason) => reason === value);
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const query = await searchParams;
  const next = firstValue(query.next);
  const reason = firstValue(query.reason);

  if (await hasValidSession()) {
    redirect(getSafeRedirectPath(next));
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Log in to the CMS</h1>
          </CardTitle>
          <CardDescription>Manage the content of your portfolio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {isLoginReason(reason) && (
            <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
              {REASON_NOTICES[reason]}
            </p>
          )}
          <LoginForm next={next} />
          <p className="text-sm text-muted-foreground">
            Forgot your password? Reset it by running <code className="font-mono text-xs whitespace-nowrap">npm run seed:admin</code> in the
            backend.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
