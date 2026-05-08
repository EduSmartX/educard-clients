/**
 * Reusable Page Header Component
 * Provides consistent header styling across all pages with title, description, and action buttons
 * Includes smart icon mapping based on page title/context and entrance animation
 */

import type { ReactNode } from 'react';
import {
  type LucideIcon,
  Calendar,
  CalendarDays,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  UserCircle,
  Building2,
  ClipboardList,
  FileText,
  BarChart3,
  Shield,
  Bell,
  Briefcase,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Icon mapper based on page title keywords
const PAGE_ICON_MAP: Record<string, LucideIcon> = {
  // Holiday & Calendar
  holiday: Calendar,
  calendar: Calendar,
  'working day': CalendarDays,
  'exceptional work': AlertTriangle,
  exception: AlertTriangle,

  // Leave Management
  'leave allocation': Briefcase,
  leave: Briefcase,
  absence: ClipboardList,

  // Organization & Settings
  'organization settings': Settings,
  'organization preferences': Settings,
  preferences: Settings,
  settings: Settings,

  // Academic
  academic: BookOpen,
  'academic year': BookOpen,
  semester: BookOpen,
  curriculum: BookOpen,

  // Users & Roles
  student: GraduationCap,
  students: GraduationCap,
  teacher: UserCircle,
  teachers: UserCircle,
  staff: Users,
  user: Users,
  users: Users,

  // Organization Structure
  class: Building2,
  classes: Building2,
  section: Building2,
  department: Building2,
  branch: Building2,

  // Reports & Analytics
  report: BarChart3,
  reports: BarChart3,
  analytics: BarChart3,
  dashboard: Home,

  // Timetable
  timetable: Calendar,

  // Other
  attendance: ClipboardList,
  notification: Bell,
  security: Shield,
  document: FileText,
};

/**
 * Automatically selects an icon based on the page title
 */
function getIconForTitle(title: string): LucideIcon | undefined {
  const lowerTitle = title.toLowerCase();

  // Check for exact or partial matches in the title
  for (const [keyword, icon] of Object.entries(PAGE_ICON_MAP)) {
    if (lowerTitle.includes(keyword)) {
      return icon;
    }
  }

  return undefined;
}

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'brand'
    | 'brandOutline';
  className?: string;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon; // Manual override - if not provided, will auto-detect
  actions?: PageHeaderAction[];
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions = [],
  children,
  className,
}: PageHeaderProps) {
  // Use provided icon or auto-detect from title
  const Icon = icon || getIconForTitle(title);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Title and Description Section */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3 sm:gap-4">
            {Icon && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', bounce: 0.35 }}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 sm:h-12 sm:w-12"
              >
                <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={2} />
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              {title}
            </motion.h1>
          </div>
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Actions and Children Section - Right Side */}
        {(actions.length > 0 || children) && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:gap-3"
          >
            {/* Render action buttons */}
            {actions.length > 0 &&
              actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || 'brand'}
                    disabled={action.disabled}
                    className={cn(
                      'transition-all duration-200',
                      action.className
                    )}
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4" strokeWidth={2} />}
                    <span>{action.label}</span>
                  </Button>
                );
              })}

            {/* Render custom children (e.g., dialog components with their own triggers) */}
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
