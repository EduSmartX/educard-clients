/**
 * Styled Button Components
 * Pre-configured buttons with consistent styling using BUTTON_STYLES
 * Import these components for uniform look and feel across the app
 */

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  ArrowLeft,
  Trash2,
  Edit,
  Eye,
  Check,
  Send,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BUTTON_STYLES, type ButtonStyleType } from '@/constants/button-styles';

// ============================================================================
// Base Styled Button
// ============================================================================

interface StyledButtonProps extends Omit<ButtonProps, 'variant'> {
  /** Style preset from BUTTON_STYLES */
  styleType?: ButtonStyleType;
  /** Icon to display */
  icon?: LucideIcon;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Button label */
  children: React.ReactNode;
}

export const StyledButton = forwardRef<HTMLButtonElement, StyledButtonProps>(
  ({ styleType = 'primary', icon: Icon, isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn('gap-2 font-medium', BUTTON_STYLES[styleType], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {children}
      </Button>
    );
  }
);
StyledButton.displayName = 'StyledButton';

// ============================================================================
// Animated Button (with hover effects)
// ============================================================================

interface AnimatedButtonProps extends StyledButtonProps {
  /** Animation on hover */
  hoverScale?: number;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ hoverScale = 1.02, className, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <StyledButton ref={ref} className={className} {...props} />
      </motion.div>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

// ============================================================================
// Pre-configured Action Buttons
// ============================================================================

type QuickButtonProps = Omit<StyledButtonProps, 'icon' | 'styleType' | 'children'> & {
  label?: string;
};

/** Primary Create/Add button */
export function CreateButton({ label = 'Create', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="primary" icon={Plus} {...props}>
      {label}
    </StyledButton>
  );
}

/** Primary Save button */
export function SaveButton({ label = 'Save', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="primary" icon={Save} {...props}>
      {label}
    </StyledButton>
  );
}

/** Submit button */
export function SubmitButton({ label = 'Submit', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="success" icon={Send} {...props}>
      {label}
    </StyledButton>
  );
}

/** Secondary Cancel button */
export function CancelButton({ label = 'Cancel', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="secondary" icon={X} {...props}>
      {label}
    </StyledButton>
  );
}

/** Back navigation button */
export function BackButton({ label = 'Back', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="secondaryOutline" icon={ArrowLeft} {...props}>
      {label}
    </StyledButton>
  );
}

/** Danger Delete button */
export function DeleteButton({ label = 'Delete', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="danger" icon={Trash2} {...props}>
      {label}
    </StyledButton>
  );
}

/** Edit button */
export function EditButton({ label = 'Edit', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="info" icon={Edit} {...props}>
      {label}
    </StyledButton>
  );
}

/** View button */
export function ViewButton({ label = 'View', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="secondaryOutline" icon={Eye} {...props}>
      {label}
    </StyledButton>
  );
}

/** Confirm button */
export function ConfirmButton({ label = 'Confirm', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="success" icon={Check} {...props}>
      {label}
    </StyledButton>
  );
}

/** Download button */
export function DownloadButton({ label = 'Download', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="info" icon={Download} {...props}>
      {label}
    </StyledButton>
  );
}

/** Upload button */
export function UploadButton({ label = 'Upload', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="info" icon={Upload} {...props}>
      {label}
    </StyledButton>
  );
}

/** Refresh button */
export function RefreshButton({ label = 'Refresh', ...props }: QuickButtonProps) {
  return (
    <StyledButton styleType="secondary" icon={RefreshCw} {...props}>
      {label}
    </StyledButton>
  );
}

// ============================================================================
// Icon-only Buttons
// ============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  styleType?: ButtonStyleType;
  /** Accessible label */
  'aria-label': string;
}

export function IconButton({ icon: Icon, styleType = 'ghost', className, ...props }: IconButtonProps) {
  return (
    <Button
      size="icon"
      className={cn('h-9 w-9', BUTTON_STYLES[styleType], className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// ============================================================================
// Button Group
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

export function ButtonGroup({ children, className, align = 'left' }: ButtonGroupProps) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', alignClass[align], className)}>
      {children}
    </div>
  );
}
