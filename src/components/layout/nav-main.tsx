'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_GROUPS, findNavLocation } from '@/components/layout/nav-items';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavMain() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const activeHref = findNavLocation(pathname)?.item.href;

  return NAV_GROUPS.map((group) => (
    <SidebarGroup key={group.items[0]?.href}>
      {group.label !== null && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      // On phones the sidebar is an overlay; close it once a page is chosen.
                      setOpenMobile(false);
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
