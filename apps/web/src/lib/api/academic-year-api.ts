import api from '../api';

export interface AcademicYear {
  public_id: string;
  organization: {
    public_id: string;
    name: string;
  };
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateAcademicYearPayload {
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface AcademicYearResponse {
  success: boolean;
  message: string;
  data: AcademicYear;
  code: number;
}

/**
 * Fetch current academic year
 */
export async function getCurrentAcademicYear(): Promise<AcademicYear | null> {
  try {
    const response = await api.get<AcademicYearResponse>(
      '/organization-preferences/current-academic-year/'
    );
    return response.data.data;
  } catch {
    return null;
  }
}

/**
 * Update academic year
 */
export async function updateAcademicYear(
  payload: UpdateAcademicYearPayload
): Promise<AcademicYear> {
  const response = await api.patch<AcademicYearResponse>(
    '/organization-preferences/update-academic-year/',
    payload
  );
  return response.data.data;
}
