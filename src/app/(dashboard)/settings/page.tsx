import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { ThemeForm } from '@/features/settings/components/theme-form';
import { getSettings } from '@/features/settings/queries';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

// Two independent forms, each saved from its own card.
export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Portfolio theme</h2>
            </CardTitle>
            <CardDescription>How the public portfolio looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeForm initialValues={{ theme: settings.theme }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Change password</h2>
            </CardTitle>
            <CardDescription>Changing it logs out any other sessions; this one stays logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
