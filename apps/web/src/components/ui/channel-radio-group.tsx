import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export interface ChannelOption {
  value: string;
  label: string;
}

export const DEFAULT_CHANNEL_OPTIONS: ChannelOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Both' },
];

interface ChannelRadioGroupProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly options?: ChannelOption[];
  readonly idPrefix?: string;
  readonly className?: string;
}

export function ChannelRadioGroup({
  value,
  onValueChange,
  options = DEFAULT_CHANNEL_OPTIONS,
  idPrefix = 'channel',
  className,
}: ChannelRadioGroupProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={cn('flex gap-3', className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          htmlFor={`${idPrefix}-${opt.value}`}
          className={cn(
            'flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all',
            value === opt.value
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} />
          <span className="text-sm font-medium">{opt.label}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
