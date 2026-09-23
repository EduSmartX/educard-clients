import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeConfig, type ThemeConfig } from '@/lib/utils/theme-utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  path?: string;
  badge?: string | number;
  children?: SidebarItem[];
  requiresSupervisor?: boolean;
  matchPaths?: string[];
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
  defaultCollapsed?: boolean;
}

interface DashboardSidebarProps {
  sections: SidebarSection[];
  footer?: React.ReactNode;
  onNavigate?: () => void;
  userRole?: string;
  /** Whether the user is a supervisor (can manage subordinates) */
  isSupervisor?: boolean;
}

function SidebarNavItem({
  item,
  siblingPaths,
  onNavigate,
  theme,
}: {
  item: SidebarItem;
  siblingPaths?: string[];
  onNavigate?: () => void;
  theme: ThemeConfig;
}) {
  const { pathname } = useLocation();

  // Check if any child is currently active
  const isChildActive =
    item.children?.some((child) => child.path && pathname.startsWith(child.path)) ?? false;
  const [isOpen, setIsOpen] = useState(isChildActive);

  // Item with children — collapsible group
  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isChildActive
              ? cn(theme.accentColor, theme.accentBg)
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon
              className={cn(
                'h-5 w-5 transition-colors',
                isChildActive ? theme.accentColor : 'text-slate-400'
              )}
              strokeWidth={2}
            />
            <span>{item.label}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
        {isOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l-2 border-slate-200/60 pl-3">
            {item.children.map((child) => (
              <SidebarNavItem
                key={child.id}
                item={child}
                siblingPaths={item
                  .children!.filter((s) => s.id !== child.id)
                  .flatMap((s) => [s.path, ...(s.matchPaths || [])].filter(Boolean) as string[])}
                onNavigate={onNavigate}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular leaf item with a path
  if (!item.path) {
    return null;
  }

  const matchesMainPath = pathname === item.path || pathname.startsWith(`${item.path}/`);
  const matchesExtraPaths = item.matchPaths?.some(
    (mp) => pathname === mp || pathname.startsWith(`${mp}/`)
  );

  const isHomeworkSubmissionsItem = item.id === 'homework-submissions';
  const isHomeworkItem = item.id === 'homework';
  const isOnSubmissionsReviewPage = /^\/homework\/[^/]+\/submissions\//.test(pathname);
  const matchesSubmissionsPattern = isHomeworkSubmissionsItem && isOnSubmissionsReviewPage;
  const excludeHomeworkOnSubmissions = isHomeworkItem && isOnSubmissionsReviewPage;

  const isItemActive =
    (matchesMainPath || matchesExtraPaths || matchesSubmissionsPattern) &&
    !excludeHomeworkOnSubmissions &&
    !(siblingPaths ?? []).some((sp) => sp.length > item.path!.length && pathname.startsWith(sp));

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={() =>
        cn(
          'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isItemActive
            ? cn(theme.sidebarActiveBg, theme.sidebarActiveText, theme.sidebarActiveShadow)
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        )
      }
    >
      {() => (
        <>
          <div className="flex items-center gap-3">
            <item.icon
              className={cn('h-5 w-5', isItemActive ? 'text-white' : 'text-slate-400')}
              strokeWidth={2}
            />
            <span>{item.label}</span>
          </div>
          {!!item.badge && (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                isItemActive ? 'bg-white/20 text-white' : cn(theme.accentBg, theme.accentColor)
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function DashboardSidebar({
  sections,
  footer,
  onNavigate,
  userRole,
  isSupervisor = false,
}: DashboardSidebarProps) {
  const theme = getThemeConfig(userRole);

  // Filter sections and items based on supervisor status
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requiresSupervisor && !isSupervisor) {
          return false;
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0); // Remove empty sections

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {filteredSections.map((section, index) => (
          <CollapsibleSection
            key={`${section.title ?? 'section'}-${index}`}
            section={section}
            onNavigate={onNavigate}
            theme={theme}
          />
        ))}
      </nav>

      {/* Footer */}
      {footer && <div className="border-t border-slate-100 p-4">{footer}</div>}
    </div>
  );
}

function CollapsibleSection({
  section,
  onNavigate,
  theme,
}: {
  section: SidebarSection;
  onNavigate?: () => void;
  theme: ThemeConfig;
}) {
  const { pathname } = useLocation();

  // Check if any item in this section is active
  const isAnyItemActive = section.items.some((item) => {
    if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) {
      return true;
    }
    // Check children too
    if (item.children) {
      return item.children.some(
        (child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`))
      );
    }
    return false;
  });

  // Default to expanded if any item is active, or if no title (top-level items), or based on defaultCollapsed
  const [isExpanded, setIsExpanded] = useState(() => {
    if (!section.title) {
      return true;
    } // No title means always expanded
    if (isAnyItemActive) {
      return true;
    } // Expand if active item
    return !section.defaultCollapsed; // Otherwise use default
  });

  // Sections without titles are always expanded (Dashboard, Calendar, Analytics)
  if (!section.title) {
    return (
      <div className="mb-6">
        <div className="space-y-1">
          {section.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              siblingPaths={section.items
                .filter((s) => s.id !== item.id)
                .flatMap((s) => [s.path, ...(s.matchPaths || [])].filter(Boolean) as string[])}
              onNavigate={onNavigate}
              theme={theme}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="group mb-2 flex w-full items-center justify-between rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-50"
      >
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-slate-600">
          {section.title}
        </h3>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:text-slate-600',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      {isExpanded && (
        <div className="space-y-1">
          {section.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              siblingPaths={section.items
                .filter((s) => s.id !== item.id)
                .flatMap((s) => [s.path, ...(s.matchPaths || [])].filter(Boolean) as string[])}
              onNavigate={onNavigate}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}
