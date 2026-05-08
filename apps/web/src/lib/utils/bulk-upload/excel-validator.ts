/**
 * Excel file parser and validator for bulk uploads
 * Common utility for parsing Excel files and running validations
 */

import type * as XLSXType from 'xlsx';
import type { ValidationError, FieldValidator } from './field-validators';

// Dynamic import to avoid blocking page load
let XLSX: typeof XLSXType | null = null;

const loadXLSX = async () => {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
};

export interface ColumnConfig {
  /** Internal field name (e.g., "first_name") */
  key: string;
  /** Display name in Excel header (e.g., "First Name") */
  name: string;
  /** Whether the field is required */
  required: boolean;
  /** Description shown in Excel template */
  description: string;
  /** Field validator function */
  validator?: FieldValidator;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data: Record<string, unknown>[];
}

export interface DuplicateCheckConfig {
  /** Field keys to check for duplicates */
  fields: string[];
  /** Whether to combine multiple fields as a composite key */
  composite?: boolean;
  /** Label for error message */
  label: string;
}

export interface ExcelValidationOptions {
  /** Column configurations */
  columns: ColumnConfig[];
  /** Skip rows (header + description rows) */
  skipRows?: number;
  /** Duplicate check configurations */
  duplicateChecks?: DuplicateCheckConfig[];
}

/**
 * Parse and validate an Excel file
 */
export async function validateExcelFile(
  file: File,
  options: ExcelValidationOptions
): Promise<ValidationResult> {
  const xlsx = await loadXLSX();
  const { columns, skipRows = 2, duplicateChecks = [] } = options;

  // Build column mapping from display name to field key
  const columnMapping: Record<string, string> = {};
  columns.forEach(col => {
    // Handle both with and without asterisk for required fields
    columnMapping[col.name] = col.key;
    columnMapping[`${col.name}*`] = col.key;
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false, // Get formatted values
        }) as unknown[][];

        if (jsonData.length < skipRows + 1) {
          resolve({
            isValid: false,
            errors: [{ row: 0, field: 'File', message: 'File is empty or has no data rows' }],
            data: [],
          });
          return;
        }

        // First row is headers
        const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
        const dataRows = jsonData.slice(skipRows);

        const errors: ValidationError[] = [];
        const parsedData: Record<string, unknown>[] = [];

        // Track duplicates within file
        const duplicateMaps = duplicateChecks.map(() => new Map<string, number>());

        dataRows.forEach((row, index) => {
          const rowNumber = index + skipRows + 1; // Excel row number (1-indexed)
          const rowArray = row as unknown[];

          // Skip completely empty rows
          if (!rowArray || rowArray.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
            return;
          }

          const rowData: Record<string, unknown> = {};

          // Map columns to field names
          headers.forEach((header, colIndex) => {
            const fieldKey = columnMapping[header];
            if (fieldKey) {
              rowData[fieldKey] = rowArray[colIndex];
            }
          });

          // Validate each field
          columns.forEach(col => {
            if (col.validator) {
              const error = col.validator(rowData[col.key], rowNumber, col.name);
              if (error) {
                errors.push(error);
              }
            }
          });

          // Check for duplicates
          duplicateChecks.forEach((check, checkIndex) => {
            const map = duplicateMaps[checkIndex];
            let key: string;

            if (check.composite) {
              // Combine multiple fields as composite key
              key = check.fields
                .map(f => String(rowData[f] || '').trim().toLowerCase())
                .join('_');
            } else {
              // Single field key
              key = String(rowData[check.fields[0]] || '').trim().toLowerCase();
            }

            // Only check if key has value
            if (key && key !== '' && !check.fields.every(f => !rowData[f] || String(rowData[f]).trim() === '')) {
              if (map.has(key)) {
                const existingRow = map.get(key)!;
                errors.push({
                  row: rowNumber,
                  field: check.label,
                  message: `Duplicate ${check.label.toLowerCase()} - already exists in Row ${existingRow}`,
                });
              } else {
                map.set(key, rowNumber);
              }
            }
          });

          parsedData.push(rowData);
        });

        resolve({
          isValid: errors.length === 0,
          errors,
          data: parsedData,
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  // Group errors by row
  const errorsByRow = new Map<number, ValidationError[]>();
  errors.forEach(error => {
    const existing = errorsByRow.get(error.row) || [];
    existing.push(error);
    errorsByRow.set(error.row, existing);
  });

  const formatted: string[] = [];
  errorsByRow.forEach((rowErrors, row) => {
    if (row === 0) {
      // File-level errors
      rowErrors.forEach(error => {
        formatted.push(error.message);
      });
    } else {
      // Row-level errors
      const messages = rowErrors.map(e => `${e.field}: ${e.message}`);
      formatted.push(`Row ${row}: ${messages.join('; ')}`);
    }
  });

  return formatted;
}

export type { ValidationError, FieldValidator };
