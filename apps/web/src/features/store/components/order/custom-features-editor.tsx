/**
 * Free-form "feature: value" rows for anything the catalog does not cover.
 */
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CustomFeatureRow {
  id: number;
  name: string;
  value: string;
}

/** Rows with both a name and a value, as `{ name: value }`. */
export function customFeaturesPayload(rows: CustomFeatureRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const name = row.name.trim();
    const value = row.value.trim();
    if (name && value) {
      acc[name] = value;
    }
    return acc;
  }, {});
}

/** A row with only one half filled in. */
export function hasHalfFilledRow(rows: CustomFeatureRow[]): boolean {
  return rows.some((row) => Boolean(row.name.trim()) !== Boolean(row.value.trim()));
}

interface CustomFeaturesEditorProps {
  rows: CustomFeatureRow[];
  onChange: (rows: CustomFeatureRow[]) => void;
}

export function CustomFeaturesEditor({ rows, onChange }: CustomFeaturesEditorProps) {
  const update = (id: number, patch: Partial<CustomFeatureRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            placeholder="Feature, e.g. Embroidery"
            value={row.name}
            onChange={(event) => update(row.id, { name: event.target.value })}
          />
          <Input
            placeholder="Value, e.g. School crest on pocket"
            value={row.value}
            onChange={(event) => update(row.id, { value: event.target.value })}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            aria-label="Remove feature"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-dashed"
        onClick={() => onChange([...rows, { id: Date.now(), name: '', value: '' }])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add a detail
      </Button>
    </div>
  );
}
