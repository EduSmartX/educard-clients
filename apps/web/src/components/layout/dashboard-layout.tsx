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
export function DashboardLayout({ children, sidebarSections, userRole, isSupervisor = false }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme = getThemeConfig(userRole);

  return (
    <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-slate-100 shadow-soft
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto mt-[64px] sm:mt-[72px] lg:mt-0
        `}
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
          "fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] text-white lg:hidden rounded-xl h-10 w-10",
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
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
