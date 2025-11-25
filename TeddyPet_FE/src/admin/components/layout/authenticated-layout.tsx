import { Outlet } from 'react-router-dom'
import { getCookie } from '@/admin/lib/cookies'
import { cn } from '@/admin/lib/utils'
import { LayoutProvider } from '@/admin/context/layout-provider'
import { SearchProvider } from '@/admin/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/admin/components/ui/sidebar'
import { AppSidebar } from '@/admin/components/layout/app-sidebar'
import { SkipToMain } from '../skip-to-main'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              'min-h-screen bg-background'
            )}
          >
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
