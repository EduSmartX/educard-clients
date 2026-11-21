/**
 * One product attribute on the order page: pills for choices, a text box otherwise.
 */
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  type CartItemConfiguration,
  type ProductAttribute,
} from '@educard/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { OptionPill } from './order-step';

function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface AttributeFieldProps {
  attribute: ProductAttribute;
  value: CartItemConfiguration[string] | undefined;
  onChange: (value: string | string[]) => void;
}

export function AttributeField({ attribute, value, onChange }: AttributeFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {attribute.display_name}
        {attribute.is_required ? (
          <span className="text-destructive">*</span>
        ) : (
          <span className="text-muted-foreground text-xs font-normal">(optional)</span>
        )}
      </Label>

      {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={attribute.display_name}>
          {attribute.options.map((option) => (
            <OptionPill
              key={option.value}
              selected={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.image_url && (
                <img
                  src={getMediaUrl(option.image_url)}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              )}
              {option.display_label}
            </OptionPill>
          ))}
        </div>
      )}

      {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST && (
        <>
          <Textarea
            rows={3}
            placeholder="Separate entries with commas, spaces or new lines"
            onChange={(event) => onChange(parseListValue(event.target.value))}
          />
          <p className="text-muted-foreground text-xs">
            {(value as string[] | undefined)?.length ?? 0} entered
          </p>
        </>
      )}

      {(attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.TEXT ||
        attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER) && (
        <Input
          className="max-w-sm"
          type={attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

interface CompactValueInputProps {
  attribute: ProductAttribute;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

/** Dense input for table cells: a dropdown for choices, a small text box otherwise. */
export function CompactValueInput({
  attribute,
  value,
  onChange,
  label,
  placeholder,
}: CompactValueInputProps) {
  if (attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-28" aria-label={label}>
          <SelectValue placeholder={placeholder ?? 'Choose'} />
        </SelectTrigger>
        <SelectContent>
          {attribute.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.display_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      className="h-8 min-w-24"
      aria-label={label}
      placeholder={placeholder}
      type={attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
