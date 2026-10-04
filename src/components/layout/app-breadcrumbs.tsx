'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { findNavLocation } from '@/components/layout/nav-items';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export function AppBreadcrumbs() {
  const location = findNavLocation(usePathname());
  if (location === null) {
    return null;
  }
  const trail = location.group.label === null ? [location.item.title] : [location.group.label, location.item.title];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((label, index) => (
          <Fragment key={label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>{index === trail.length - 1 ? <BreadcrumbPage>{label}</BreadcrumbPage> : <span>{label}</span>}</BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
