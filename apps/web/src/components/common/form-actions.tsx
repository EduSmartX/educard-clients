/**
 * Form Actions Component
 * Standardized form submit/cancel buttons with consistent styling
 * Supports floating and inline modes with color-coded buttons
 */

import { motion } from 'framer-motion';
import { Save, X, Loader2, ArrowLeft, Plus, Trash2, Check, Send, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BUTTON_STYLES, type ButtonStyleType } from '@/constants/button-styles';

// ============================================================================
// Icon Mapping
// ============================================================================

const ACTION_ICONS = {
  save: Save,
  create: Plus,
  submit: Send,
  confirm: Check,
  cancel: X,
  back: ArrowLeft,
  delete: Trash2,
} as const;

type ActionIconType = keyof typeof ACTION_ICONS;

// ============================================================================
// Form Action Button Component
// ============================================================================

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: ButtonStyleType;
  icon?: ActionIconType | LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  label,
  onClick,
  type = 'button',
  style = 'primary',
  icon,
  isLoading = false,
  disabled = false,
  className,
}: ActionButtonProps) {
  // Get the icon component
  const IconComponent = typeof icon === 'string' ? ACTION_ICONS[icon] : icon;
  
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'gap-2 font-medium',
        BUTTON_STYLES[style],
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : IconComponent ? (
        <IconComponent className="h-4 w-4" />
      ) : null}
      {label}
    </Button>
  );
}

// ============================================================================
// Form Actions Container Component
// ============================================================================

interface FormActionsProps {
  /** Primary action config (e.g., Save, Create) */
  primaryAction: {
    label: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    icon?: ActionIconType | LucideIcon;
    isLoading?: boolean;
    disabled?: boolean;
    style?: ButtonStyleType;
  };
  /** Secondary action config (e.g., Cancel, Back) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ActionIconType | LucideIcon;
    style?: ButtonStyleType;
  };
  /** Additional actions */
  additionalActions?: ActionButtonProps[];
  /** Layout mode: 'inline' or 'floating' */
  mode?: 'inline' | 'floating';
  /** Alignment: 'left', 'center', 'right' */
  align?: 'left' | 'center' | 'right';
  /** Custom class name */
  className?: string;
}

export function FormActions({
  primaryAction,
  secondaryAction,
  additionalActions = [],
  mode = 'inline',
  align = 'left',
  className,
}: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const containerClasses = cn(
    'flex items-center gap-3',
    alignmentClasses[align],
    mode === 'floating' && 'fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-4 shadow-lg',
    mode === 'inline' && 'pt-4 border-t border-gray-100',
    className
  );

  const content = (
    <>
      {/* Primary Action */}
      <ActionButton
        label={primaryAction.label}
        onClick={primaryAction.onClick}
        type={primaryAction.type || 'submit'}
        style={primaryAction.style || 'primary'}
        icon={primaryAction.icon || 'save'}
        isLoading={primaryAction.isLoading}
        disabled={primaryAction.disabled}
      />
      
      {/* Secondary Action */}
      {secondaryAction && (
        <ActionButton
          label={secondaryAction.label}
          onClick={secondaryAction.onClick}
          type="button"
          style={secondaryAction.style || 'secondary'}
          icon={secondaryAction.icon || 'cancel'}
        />
      )}
      
      {/* Additional Actions */}
      {additionalActions.map((action, index) => (
        <ActionButton key={index} {...action} />
      ))}
    </>
  );

  if (mode === 'floating') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={containerClasses}
      >
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          {content}
        </div>
      </motion.div>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}

// ============================================================================
// Quick Access Button Presets
// ============================================================================

interface QuickButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Pre-configured Save button */
export function SaveButton({ onClick, isLoading, disabled, className }: QuickButtonProps) {
  return (
    <ActionButton
      label="Save"
      onClick={onClick}
      type="submit"
      style="primary"
      icon="save"
      isLoading={isLoading}
      disabled={disabled}
      className={className}
    />
  );
}

/** Pre-configured Create button */
export function CreateButton({ onClick, isLoading, disabled, className }: QuickButtonProps & { label?: string }) {
  return (
    <ActionButton
      label="Create"
      onClick={onClick}
      type="submit"
      style="primary"
      icon="create"
      isLoading={isLoading}
      disabled={disabled}
      className={className}
    />
  );
}

/** Pre-configured Cancel button */
export function CancelButton({ onClick, className }: Pick<QuickButtonProps, 'onClick' | 'className'>) {
  return (
    <ActionButton
      label="Cancel"
      onClick={onClick}
      type="button"
      style="secondary"
      icon="cancel"
      className={className}
    />
  );
}

/** Pre-configured Back button */
export function BackButton({ onClick, className }: Pick<QuickButtonProps, 'onClick' | 'className'>) {
  return (
    <ActionButton
      label="Back"
      onClick={onClick}
      type="button"
      style="secondaryOutline"
      icon="back"
      className={className}
    />
  );
}

/** Pre-configured Delete button */
export function DeleteButton({ onClick, isLoading, disabled, className }: QuickButtonProps) {
  return (
    <ActionButton
      label="Delete"
      onClick={onClick}
      type="button"
      style="danger"
      icon="delete"
      isLoading={isLoading}
      disabled={disabled}
      className={className}
    />
  );
}

export default FormActions;
