/**
 * Bulk Upload Classes Dialog
 * Uses the reusable BulkUploadDialog component
 */

import api from '@/lib/api';
import { BulkUploadDialog as BaseBulkUploadDialog } from '@/components/common/bulk-upload-dialog';

const CLASSES_API = '/classes/admin';

// Download template function
async function downloadClassesTemplate(): Promise<Blob> {
  const response = await api.get(`${CLASSES_API}/download-template/`, {
    responseType: 'blob',
  });
  return response.data;
}

// Upload file function
async function uploadClassesFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`${CLASSES_API}/bulk-upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export function BulkUploadDialog() {
  return (
    <BaseBulkUploadDialog
      title="Bulk Upload Classes"
      description="Upload multiple classes at once using an Excel template"
      triggerLabel="Bulk Upload"
      triggerVariant="outline"
      triggerClassName="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      downloadTemplate={downloadClassesTemplate}
      uploadFile={uploadClassesFile}
      invalidateQueryKeys={['classes']}
      templateFileName="classes_template.xlsx"
      acceptedFileTypes=".xlsx,.xls"
    />
  );
}
