/**
 * Bulk Upload Teachers Dialog
 * Uses the reusable BulkUploadDialog component
 */

import { useState } from 'react';
import api from '@/lib/api';
import { BulkUploadDialog } from '@/components/common/bulk-upload-dialog';

const TEACHERS_API = '/teacher/admin';

// Download template function with minimal fields option
async function downloadTeachersTemplate(minimalFields: boolean = false): Promise<Blob> {
  const params = minimalFields ? { is_limited_fields_only: 'true' } : {};
  const response = await api.get(`${TEACHERS_API}/download-template/`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

// Upload file function with minimal fields option
async function uploadTeachersFile(file: File, minimalFields: boolean = false) {
  const formData = new FormData();
  formData.append('file', file);

  const params = minimalFields ? { is_limited_fields_only: 'true' } : {};
  const response = await api.post(`${TEACHERS_API}/bulk-upload/`, formData, {
    params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export function BulkUploadTeachersDialog() {
  const [isMinimalFields, setIsMinimalFields] = useState(false);

  return (
    <BulkUploadDialog
      title="Bulk Upload Teachers"
      description="Upload multiple teachers at once using an Excel template"
      triggerLabel="Bulk Upload"
      triggerVariant="outline"
      triggerClassName="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      downloadTemplate={() => downloadTeachersTemplate(isMinimalFields)}
      uploadFile={(file) => uploadTeachersFile(file, isMinimalFields)}
      invalidateQueryKeys={['teachers']}
      templateFileName={
        isMinimalFields ? 'teachers_template_minimal.xlsx' : 'teachers_template_full.xlsx'
      }
      acceptedFileTypes=".xlsx,.xls"
      showMinimalFieldsCheckbox={true}
      isMinimalFields={isMinimalFields}
      onMinimalFieldsChange={setIsMinimalFields}
      minimalFieldsLabel="Only Required Fields (Employee ID, Name, Email, Gender, Role)"
    />
  );
}
