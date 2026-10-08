import { PlusIcon } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';

type ListPageHeaderProps = {
  title: string;
  description: string;
  // "Add project", linking to `/projects/new`.
  addLabel: string;
  addHref: string;
};

export function ListPageHeader({ title, description, addLabel, addHref }: ListPageHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        <Button asChild>
          <GuardedLink href={addHref}>
            <PlusIcon aria-hidden />
            {addLabel}
          </GuardedLink>
        </Button>
      }
    />
  );
}
