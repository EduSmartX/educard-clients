import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSidebar, type SidebarSection } from './dashboard-sidebar';
import { getThemeConfig } from '@/lib/utils/theme-utils';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarSections: SidebarSection[];
  userRole?: string;
  /** Whether the user is a supervisor (can manage subordinates) */
  isSupervisor?: boolean;
}

/**
 * DashboardLayout - Provides sidebar navigation for dashboard pages
 * Note: Header is rendered once in ProtectedLayout, not here
 */
export function DashboardLayout({
  children,
  sidebarSections,
  userRole,
  isSupervisor = false,
}: Readonly<DashboardLayoutProps>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme = getThemeConfig(userRole);

  return (
    <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside
        className={`shadow-soft fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-100 bg-white transition-transform duration-300 ease-in-out lg:static lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} mt-[64px] overflow-y-auto sm:mt-[72px] lg:mt-0`}
      >
        <DashboardSidebar
          sections={sidebarSections}
          onNavigate={() => setIsSidebarOpen(false)}
          userRole={userRole}
          isSupervisor={isSupervisor}
        />
      </aside>

      {/* Mobile Menu Button - Top Left Corner */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'fixed top-3 left-3 z-[60] h-10 w-10 rounded-xl text-white sm:top-4 sm:left-4 lg:hidden',
          theme.mobileMenuBg,
          theme.mobileMenuHover,
          theme.mobileMenuShadow
        )}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2} />
        )}
      </Button>

      {/* Main Content - Responsive padding */}
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
