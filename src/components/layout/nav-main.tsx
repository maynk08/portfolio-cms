'use client';

import { usePathname } from 'next/navigation';

import { NAV_GROUPS, findNavLocation } from '@/components/layout/nav-items';
import { GuardedLink } from '@/components/navigation/guarded-link';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

type NavMainProps = {
  // Small counters next to nav items, keyed by href, such as unread messages.
  badges?: Record<string, number>;
};

export function NavMain({ badges = {} }: NavMainProps) {
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
                  <GuardedLink
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      // On phones the sidebar is an overlay; close it once a page is chosen.
                      setOpenMobile(false);
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {(badges[item.href] ?? 0) > 0 && <span className="sr-only">({badges[item.href]} unread)</span>}
                  </GuardedLink>
                </SidebarMenuButton>
                {(badges[item.href] ?? 0) > 0 && <SidebarMenuBadge aria-hidden>{badges[item.href]}</SidebarMenuBadge>}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
