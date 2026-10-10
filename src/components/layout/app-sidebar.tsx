import { NavMain } from '@/components/layout/nav-main';
import { NavUser } from '@/components/layout/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';

type AppSidebarProps = {
  adminEmail: string;
  portfolioUrl: string;
  unreadMessageCount: number;
};

export function AppSidebar({ adminEmail, portfolioUrl, unreadMessageCount }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <span className="truncate px-2 py-1.5 font-mono text-sm font-semibold group-data-[collapsible=icon]:sr-only">Portfolio CMS</span>
      </SidebarHeader>
      <SidebarContent>
        <NavMain badges={{ '/messages': unreadMessageCount }} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser email={adminEmail} portfolioUrl={portfolioUrl} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
