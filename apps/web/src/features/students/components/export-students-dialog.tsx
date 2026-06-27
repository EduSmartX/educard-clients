/**
 * Export Students Dialog
 * Allows users to export student data as Excel with optional email delivery.
 * Supports multi-class selection and filter options.
 */

import { useState } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GENDER_OPTIONS_WITH_ALL, API_CONFIG } from '@educard/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { exportStudents } from '../api/students-api';
import type { ExportStudentsPayload } from '../types';

interface ExportStudentsDialogProps {
  /** Trigger button variant */
  triggerVariant?: 'default' | 'outline' | 'ghost';
}

export function ExportStudentsDialog({
  triggerVariant = 'outline',
}: Readonly<ExportStudentsDialogProps>) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Fetch classes for multi-select
  const { data: classesData } = useClasses({ page_size: API_CONFIG.DROPDOWN_PAGE_SIZE });
  const classes = classesData?.data || [];

  const classOptions: MultiSelectOption[] = classes.map((cls) => ({
    value: cls.public_id,
    label: `${cls.class_master?.name ?? ''} - ${cls.name}`,
  }));

  const resetForm = () => {
    setSelectedClassIds([]);
    setGender('');
    setSearchFilter('');
    setSendEmail(false);
    setEmailInput('');
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const payload: ExportStudentsPayload = {};

      if (selectedClassIds.length > 0) {
        payload.class_ids = selectedClassIds;
      }
      if (gender && gender !== 'all') {
        payload.gender = gender;
      }
      if (searchFilter.trim()) {
        payload.search = searchFilter.trim();
      }
      if (sendEmail && emailInput.trim()) {
        payload.send_email = true;
        payload.emails = emailInput
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
      }

      const blob = await exportStudents(payload);

      // Trigger browser download
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      if (sendEmail && emailInput.trim()) {
        toast.success('Export downloaded and email sent successfully!');
      } else {
        toast.success('Export downloaded successfully!');
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed. Please try again.';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Students Data</DialogTitle>
          <DialogDescription>
            Download student data as an Excel file. Optionally filter by class and send via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Multi-Select */}
          <div className="space-y-2">
            <Label>Filter by Class (optional)</Label>
            <MultiSelect
              options={classOptions}
              value={selectedClassIds}
              onChange={setSelectedClassIds}
              placeholder="All classes"
              searchPlaceholder="Search classes..."
              emptyMessage="No classes found."
            />
            {selectedClassIds.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''} selected
              </p>
            )}
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <Label>Filter by Gender (optional)</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS_WITH_ALL.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.value === '' ? 'All Genders' : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <Label>Search (optional)</Label>
            <Input
              placeholder="Filter by name, email, roll no..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Email Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="cursor-pointer">Send via Email</Label>
              <p className="text-muted-foreground text-xs">
                Also send the exported file to specified email addresses
              </p>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>

          {/* Email Input (shown when sendEmail is true) */}
          {sendEmail && (
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Input
                placeholder="admin@school.com, teacher@school.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Enter email addresses of admins or teachers in your organization. Separate multiple
                emails with commas.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (sendEmail && !emailInput.trim())}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sendEmail ? (
              <Mail className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : sendEmail ? 'Download & Email' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
