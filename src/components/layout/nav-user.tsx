'use client';

import { ChevronsUpDownIcon, ExternalLinkIcon, LogOutIcon, UserRoundIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { logout } from '@/features/auth/actions';

type NavUserProps = {
  email: string;
  portfolioUrl: string;
};

export function NavUser({ email, portfolioUrl }: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="View portfolio">
          <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon />
            <span>View portfolio</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={email} aria-label={`Account menu for ${email}`}>
              <UserRoundIcon />
              <span className="truncate">{email}</span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end" className="min-w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-xs text-muted-foreground">Logged in as</span>
              <span className="block truncate">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOutIcon />
                  Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
