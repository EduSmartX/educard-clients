/**
 * Fee Components Editor
 * For editing fee structure components (tuition, transport, lab, etc.)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { FeeComponent, ComponentType } from '@educard/shared';
import { FeeAmount } from './fee-amount';

const COMPONENT_TYPE_OPTIONS = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional', label: 'Optional' },
];

export interface ComponentEntry {
  name: string;
  amount: number;
  component_type: ComponentType;
}

interface FeeComponentsEditorProps {
  value: FeeComponent;
  onChange: (components: FeeComponent) => void;
  /** Track component types externally - map of component name to type */
  componentTypes?: Record<string, ComponentType>;
  onComponentTypesChange?: (types: Record<string, ComponentType>) => void;
  disabled?: boolean;
  errors?: string[];
  className?: string;
}

export function FeeComponentsEditor({
  value,
  onChange,
  componentTypes = {},
  onComponentTypesChange,
  disabled = false,
  errors,
  className,
}: FeeComponentsEditorProps) {
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentAmount, setNewComponentAmount] = useState('');
  const [newComponentType, setNewComponentType] = useState<ComponentType>('mandatory');

  const components = Object.entries(value || {});
  const totalAmount = components.reduce((sum, [, amount]) => sum + amount, 0);

  const handleAddComponent = () => {
    const name = newComponentName.trim();
    const amount = parseFloat(newComponentAmount);

    if (!name || isNaN(amount) || amount <= 0) {
      return;
    }

    onChange({
      ...value,
      [name]: amount,
    });

    // Track the component type
    onComponentTypesChange?.({
      ...componentTypes,
      [name]: newComponentType,
    });

    setNewComponentName('');
    setNewComponentAmount('');
    setNewComponentType('mandatory');
  };

  const handleRemoveComponent = (componentName: string) => {
    const newComponents = { ...value };
    delete newComponents[componentName];
    onChange(newComponents);

    // Remove from types
    const newTypes = { ...componentTypes };
    delete newTypes[componentName];
    onComponentTypesChange?.(newTypes);
  };

  const handleUpdateAmount = (componentName: string, amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return;
    }

    onChange({
      ...value,
      [componentName]: numAmount,
    });
  };

  const handleUpdateType = (componentName: string, type: ComponentType) => {
    onComponentTypesChange?.({
      ...componentTypes,
      [componentName]: type,
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        {/* Existing Components */}
        <div className="space-y-2">
          {components.map(([name, amount]) => (
            <div key={name} className="flex items-center gap-2 rounded-md border p-2">
              <span className="flex-1 text-sm font-medium capitalize">
                {name.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <SearchableSelect
                  options={COMPONENT_TYPE_OPTIONS}
                  value={componentTypes[name] || 'mandatory'}
                  onValueChange={(val: string) => handleUpdateType(name, val as ComponentType)}
                  disabled={disabled}
                  className="h-8 w-28 text-xs"
                />
                <span className="text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleUpdateAmount(name, e.target.value)}
                  disabled={disabled}
                  className="w-40"
                  min={0}
                  step={0.01}
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveComponent(name)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Component */}
        {!disabled && (
          <div className="flex items-end gap-2 pt-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="new-component-name" className="text-xs">
                Component Name
              </Label>
              <Input
                id="new-component-name"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="e.g., Library Fee"
                className="mt-1"
              />
            </div>
            <div className="w-28 shrink-0">
              <Label htmlFor="new-component-type" className="text-xs">
                Type
              </Label>
              <SearchableSelect
                options={COMPONENT_TYPE_OPTIONS}
                value={newComponentType}
                onValueChange={(val: string) => setNewComponentType(val as ComponentType)}
                className="mt-1"
              />
            </div>
            <div className="w-40 shrink-0">
              <Label htmlFor="new-component-amount" className="text-xs">
                Amount (₹)
              </Label>
              <Input
                id="new-component-amount"
                type="number"
                value={newComponentAmount}
                onChange={(e) => setNewComponentAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                min={0}
                step={0.01}
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleAddComponent}
              disabled={!newComponentName.trim() || !newComponentAmount}
              className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="text-destructive text-sm">
            {errors.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-muted flex items-center justify-between rounded-md p-3">
        <span className="font-medium">Total Amount</span>
        <FeeAmount amount={totalAmount} size="lg" />
      </div>
    </div>
  );
}

/**
 * Fee Components Display - Read-only view of components
 */
interface FeeComponentsDisplayProps {
  components: FeeComponent;
  className?: string;
}

export function FeeComponentsDisplay({ components, className }: FeeComponentsDisplayProps) {
  const entries = Object.entries(components || {});
  const totalAmount = entries.reduce((sum, [, amount]) => sum + amount, 0);

  if (entries.length === 0) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>No components defined</div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map(([name, amount]) => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground capitalize">{name.replace(/_/g, ' ')}</span>
          <FeeAmount amount={amount} />
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-2 font-medium">
        <span>Total</span>
        <FeeAmount amount={totalAmount} size="lg" />
      </div>
    </div>
  );
}
