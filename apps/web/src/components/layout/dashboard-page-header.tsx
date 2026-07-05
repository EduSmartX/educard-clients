import { Building2 } from 'lucide-react';

interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  organizationName?: string;
  organizationLogo?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function DashboardPageHeader({
  title,
  subtitle,
  organizationName = 'Springfield High School',
  organizationLogo,
  gradientFrom = 'from-indigo-600',
  gradientTo = 'to-purple-600',
}: DashboardPageHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} mb-6 rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        {/* Left Side - Page Title */}
        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-indigo-100">{subtitle}</p>}
        </div>

        {/* Right Side - Organization Info */}
        <div className="flex items-center gap-4 rounded-lg border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-sm">
          {/* Organization Logo Placeholder */}
          <div className="flex-shrink-0">
            {organizationLogo ? (
              <img
                src={organizationLogo}
                alt={organizationName}
                className="h-12 w-12 rounded-lg object-cover ring-2 ring-white/50"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 ring-2 ring-white/50">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Organization Name */}
          <div>
            <p className="text-xs font-medium tracking-wider text-indigo-100 uppercase">
              Organization
            </p>
            <p className="text-lg font-semibold text-white">{organizationName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
