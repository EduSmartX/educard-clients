import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuthActionButtonsProps {
  secondaryLabel: string;
  primaryLabel: string;
  onSecondaryClick?: () => void;
  secondaryType?: 'button' | 'submit';
  primaryType?: 'button' | 'submit';
  secondaryIcon?: ReactNode;
  primaryIcon?: ReactNode;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  primaryLoading?: boolean;
  containerClassName?: string;
  secondaryClassName?: string;
  primaryClassName?: string;
  secondaryVariant?: ComponentProps<typeof Button>['variant'];
  primaryVariant?: ComponentProps<typeof Button>['variant'];
  secondarySize?: ComponentProps<typeof Button>['size'];
  primarySize?: ComponentProps<typeof Button>['size'];
}

export function AuthActionButtons({
  secondaryLabel,
  primaryLabel,
  onSecondaryClick,
  secondaryType = 'button',
  primaryType = 'submit',
  secondaryIcon,
  primaryIcon,
  primaryDisabled = false,
  secondaryDisabled = false,
  primaryLoading = false,
  containerClassName,
  secondaryClassName,
  primaryClassName,
  secondaryVariant = 'brandOutline',
  primaryVariant = 'brand',
  secondarySize = 'xl',
  primarySize = 'xl',
}: AuthActionButtonsProps) {
  return (
    <div className={cn('flex gap-3 pt-6', containerClassName)}>
      <Button
        type={secondaryType}
        variant={secondaryVariant}
        size={secondarySize}
        className={cn('flex-1 font-semibold', secondaryClassName)}
        onClick={onSecondaryClick}
        disabled={secondaryDisabled}
      >
        {secondaryIcon}
        {secondaryLabel}
      </Button>
      <Button
        type={primaryType}
        variant={primaryVariant}
        size={primarySize}
        className={cn('flex-1 font-semibold', primaryClassName)}
        disabled={primaryDisabled}
        isLoading={primaryLoading}
      >
        {primaryLabel}
        {primaryIcon}
      </Button>
    </div>
  );
}
