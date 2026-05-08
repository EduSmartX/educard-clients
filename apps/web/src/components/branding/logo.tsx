import { cn } from '@/lib/utils';
import { BRANDING } from '@/constants/branding';

interface LogoProps {
  /**
   * Logo variant to display
   * - 'main': Full logo with text (default)
   * - 'icon': Icon only
   * - 'text': Text fallback (EC)
   */
  variant?: 'main' | 'icon' | 'text';

  /**
   * Logo size
   * - 'sm': Small (h-8)
   * - 'md': Medium (h-12) - default
   * - 'lg': Large (h-16)
   * - 'xl': Extra Large (h-20)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Additional className for the container
   */
  className?: string;

  /**
   * Whether to show glow effect
   */
  withGlow?: boolean;

  /**
   * Whether to show ring effect
   */
  withRing?: boolean;
}

const sizeClasses = {
  sm: 'h-12 w-12 text-lg',
  md: 'h-16 w-16 text-2xl',
  lg: 'h-20 w-20 text-3xl',
  xl: 'h-24 w-24 text-4xl',
};

export function Logo({
  variant = 'main',
  size = 'md',
  className,
  withGlow = false,
  withRing = false,
}: LogoProps) {
  // Text fallback logo (circular badge with initials)
  if (variant === 'text') {
    return (
      <div className={cn('relative inline-flex', className)}>
        {withGlow && (
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-xl opacity-50',
              `bg-gradient-to-br ${BRANDING.LOGO_FALLBACK.BG_GRADIENT}`
            )}
          />
        )}
        <div
          className={cn(
            'relative rounded-full flex items-center justify-center font-bold shadow-lg',
            `bg-gradient-to-br ${BRANDING.LOGO_FALLBACK.BG_GRADIENT}`,
            BRANDING.LOGO_FALLBACK.TEXT_COLOR,
            sizeClasses[size],
            withRing && 'ring-4 ring-white/50'
          )}
        >
          {BRANDING.LOGO_FALLBACK.TEXT}
        </div>
      </div>
    );
  }

  // Image logo
  const logoSrc = variant === 'icon' ? BRANDING.LOGO.ICON : BRANDING.LOGO.MAIN;

  return (
    <div className={cn('relative inline-flex', className)}>
      {withGlow && (
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-2xl opacity-60',
            'bg-gradient-to-br from-teal-400/80 to-cyan-400/80'
          )}
        />
      )}
      <div
        className={cn(
          'relative rounded-full overflow-hidden shadow-xl',
          sizeClasses[size],
          withRing && 'ring-4 ring-white/50',
          'bg-white'
        )}
      >
        <img
          src={logoSrc}
          alt={`${BRANDING.APP_NAME} Logo`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to text logo if image fails to load
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center font-bold bg-gradient-to-br ${BRANDING.LOGO_FALLBACK.BG_GRADIENT} ${BRANDING.LOGO_FALLBACK.TEXT_COLOR}">
                  ${BRANDING.LOGO_FALLBACK.TEXT}
                </div>
              `;
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * Logo with App Name Text
 * Displays logo icon with app name beside it
 */
export function LogoWithText({
  size = 'md',
  className,
  iconClassName,
  textClassName,
  withGlow = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  withGlow?: boolean;
}) {
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo variant="icon" size={size} withGlow={withGlow} className={iconClassName} />
      <div className="flex flex-col">
        <span className={cn('font-bold leading-none', textSizeClasses[size], textClassName)}>
          <span className="text-teal-600">Edu</span>
          <span className="text-gray-800">Card</span>
        </span>
        <span className="text-xs text-gray-600 font-medium">Unlock Knowledge</span>
      </div>
    </div>
  );
}
