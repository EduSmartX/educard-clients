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
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl p-6 mb-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        {/* Left Side - Page Title */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-indigo-100 text-sm">{subtitle}</p>}
        </div>

        {/* Right Side - Organization Info */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
          {/* Organization Logo Placeholder */}
          <div className="flex-shrink-0">
            {organizationLogo ? (
              <img
                src={organizationLogo}
                alt={organizationName}
                className="h-12 w-12 rounded-lg object-cover ring-2 ring-white/50"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center ring-2 ring-white/50">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Organization Name */}
          <div>
            <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">
              Organization
            </p>
            <p className="text-white font-semibold text-lg">{organizationName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
