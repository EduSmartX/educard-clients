import { Search, Bell, Building2, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/branding';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { authApi } from '@/lib/api/auth-api';
import { cn } from '@/lib/utils';
import { getThemeConfig } from '@/lib/utils/theme-utils';

interface DashboardHeaderProps {
  organizationName?: string;
  organizationLogo?: string;
  userName?: string;
  username?: string;
  userAvatar?: string;
  userRole?: string;
  notificationCount?: number;
}

export function DashboardHeader({
  organizationName = 'Your Organization',
  organizationLogo,
  userName = 'User',
  username,
  userAvatar,
  userRole = 'Administrator',
  notificationCount = 0,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const theme = getThemeConfig(userRole);

  const handleLogout = async () => {
    await authApi.logout();

    // Broadcast logout to all other tabs
    window.localStorage.setItem('logout-event', Date.now().toString());
    window.localStorage.removeItem('logout-event');

    // Navigate to login & prevent back-button returning to this page
    window.location.href = ROUTES.AUTH.LOGIN;
  };

  return (
    <header className={cn('sticky top-0 z-30', theme.headerBg, theme.headerShadow)}>
      <div className="flex h-16 items-center sm:h-18">
        {/* Logo (desktop only) */}
        <div className="hidden w-64 flex-shrink-0 items-center gap-3 px-6 lg:flex">
          <LogoWithText
            size="md"
            textClassName="!text-white"
            className="[&_.text-gray-600]:!text-white/70 [&_.text-gray-800]:!text-white [&_.text-teal-600]:!text-white"
          />
        </div>

        {/* Organization Info */}
        <div className="flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          {organizationLogo ? (
            <img
              src={organizationLogo}
              alt={organizationName}
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-white object-cover shadow-lg ring-2 ring-white/30 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-lg ring-2 ring-white/20 backdrop-blur-sm sm:h-11 sm:w-11 lg:h-12 lg:w-12">
              <Building2 className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={1.5} />
            </div>
          )}

          {/* Organization Info - Compact on mobile */}
          <div className="flex min-w-0 flex-col">
            <span
              className={cn(
                'hidden text-[10px] font-semibold tracking-widest uppercase sm:block sm:text-xs',
                theme.subtitleText
              )}
            >
              Organization
            </span>
            <span className="truncate text-sm font-bold text-white sm:text-base lg:text-lg">
              {organizationName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 px-4 sm:gap-3 sm:px-6">
          {/* Search (large screens only) */}
          <div className="relative hidden xl:block">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="h-11 w-72 rounded-xl border-0 bg-white/95 pr-4 pl-11 text-sm shadow-lg backdrop-blur-sm transition-all placeholder:text-slate-400 hover:bg-white focus:ring-4 focus:ring-white/30 focus:outline-none"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-xl text-white/90 transition-colors hover:bg-white/15 hover:text-white"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {notificationCount > 0 && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold text-white shadow-lg ring-2',
                  theme.notificationRing
                )}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-2 py-2 transition-all hover:bg-white/15 sm:gap-3 sm:px-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-9 w-9 rounded-xl object-cover shadow-lg ring-2 ring-white/30 sm:h-10 sm:w-10"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/10 shadow-lg ring-2 ring-white/30 backdrop-blur-sm sm:h-10 sm:w-10">
                    <span className="text-sm font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className={cn('text-xs', theme.subtitleText)}>{userRole}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-white/70 sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"
            >
              <DropdownMenuLabel className="px-2 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br',
                      theme.avatarGradient
                    )}
                  >
                    <span className="text-sm font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    {!!username && <p className="font-mono text-xs text-slate-400">@{username}</p>}
                    <p className="text-xs text-slate-500">{userRole}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="-mx-2 bg-slate-100" />
              <DropdownMenuItem
                onClick={() => navigate(ROUTES.PROFILE)}
                className="mx-0 my-1 cursor-pointer rounded-xl px-3 py-2.5"
              >
                <Settings className="mr-3 h-4 w-4 text-slate-500" />
                <span className="font-medium">Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-2 bg-slate-100" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="mx-0 my-1 cursor-pointer rounded-xl px-3 py-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
