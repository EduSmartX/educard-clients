/**
 * Holiday Bulk Upload Dialog
 * Uses the reusable BulkUploadDialog component for holiday bulk operations
 */

import { BulkUploadDialog as GenericBulkUploadDialog } from '@/components/common/bulk-upload-dialog';
import { bulkUploadHolidays, downloadHolidayTemplate } from '../api/holidays-api';

interface HolidayBulkUploadDialogProps {
  onUploadSuccess?: () => void;
}

export function BulkUploadDialog({ onUploadSuccess }: HolidayBulkUploadDialogProps) {
  return (
    <GenericBulkUploadDialog
      title="Bulk Upload Holidays"
      description="Download the Excel template, fill in holiday details, and upload the file to add multiple holidays at once"
      triggerLabel="Bulk Upload"
      triggerVariant="brand"
      downloadTemplate={downloadHolidayTemplate}
      uploadFile={bulkUploadHolidays}
      invalidateQueryKeys={['holiday-calendar']}
      templateFileName="organization_holiday_template.xlsx"
      acceptedFileTypes=".xlsx,.xls"
      onUploadSuccess={onUploadSuccess}
    />
  );
}
