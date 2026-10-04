import { cookies } from 'next/headers';

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SIDEBAR_COOKIE_NAME } from '@/components/layout/sidebar-state';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { env } from '@/config/env';
import { getCurrentAdmin } from '@/features/auth/session';

// Layouts do not re-run on every navigation, so this is not the auth check: every data read checks the session itself.
export default async function DashboardLayout({ children }: LayoutProps<'/'>) {
  const [admin, cookieStore] = await Promise.all([getCurrentAdmin(), cookies()]);
  const isSidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <AppSidebar adminEmail={admin.email} portfolioUrl={env.portfolioUrl} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-center" />
          <AppBreadcrumbs />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
