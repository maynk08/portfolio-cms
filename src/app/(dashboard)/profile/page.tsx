import { PageHeader } from '@/components/layout/page-header';
import { getMediaByIds } from '@/features/media/queries';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { getProfile } from '@/features/profile/queries';
import { toProfileFormValues } from '@/features/profile/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const profile = await getProfile();
  const knownMedia = await getMediaByIds([profile.photo, profile.resume]);

  return (
    <>
      <PageHeader title="Profile" description="Your details for the hero, About and Contact sections of the portfolio." />
      <ProfileForm initialValues={toProfileFormValues(profile)} knownMedia={knownMedia} />
    </>
  );
}
