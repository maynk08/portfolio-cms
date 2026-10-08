'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { findNavLocation } from '@/components/layout/nav-items';
import { GuardedLink } from '@/components/navigation/guarded-link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Crumb {
  label: string;
  href?: string;
}

// "Content › Projects", and one level deeper on item pages: "Content › Projects › New" / "… › Edit".
export function AppBreadcrumbs() {
  const pathname = usePathname();
  const location = findNavLocation(pathname);
  if (location === null) {
    return null;
  }
  const isItemPage = pathname !== location.item.href;
  const trail: Crumb[] = [
    ...(location.group.label === null ? [] : [{ label: location.group.label }]),
    isItemPage ? { label: location.item.title, href: location.item.href } : { label: location.item.title },
    ...(isItemPage ? [{ label: pathname.endsWith('/new') ? 'New' : 'Edit' }] : []),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === trail.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href === undefined ? (
                <span>{crumb.label}</span>
              ) : (
                <BreadcrumbLink asChild>
                  <GuardedLink href={crumb.href}>{crumb.label}</GuardedLink>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
