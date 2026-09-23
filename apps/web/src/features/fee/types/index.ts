/**
 * Fee Feature - Web-specific Types
 */

// Re-export shared types
export type {
  BulkReminderPayload,
  FeeDashboard,
  FeeComponent,
  FeePayment,
  FeePaymentListItem,
  FeeReminder,
  FeeStructure,
  FeeStructureCreatePayload,
  FeeStructureFilters,
  FeeStructureListItem,
  FeeStructureUpdatePayload,
  ParentPaymentHistory,
  ParentStudentFee,
  PaymentCreatePayload,
  PaymentFilters,
  PaymentStatus,
  ReminderResult,
  SendReminderPayload,
  StudentFee,
  StudentFeeCreatePayload,
  StudentFeeFilters,
  StudentFeeListItem,
  StudentFeeUpdatePayload,
} from '@educard/shared';

// Web-specific form types
export interface FeeStructureFormValues {
  name: string;
  academic_year: string;
  description: string;
  class_public_ids: string[];
  components: Record<string, number>;
  total_amount: number;
  due_date: Date | undefined;
  is_active: boolean;
}

export interface StudentFeeFormValues {
  student_public_id: string;
  fee_structure_public_id: string;
  discount_percentage: number;
  referral_name: string;
  referral_code: string;
  discount_reason: string;
}

export interface PaymentFormValues {
  student_fee_public_id: string;
  amount: number;
  payment_date: Date;
  payment_mode: string;
  utr_number: string;
  transaction_id: string;
  remarks: string;
  bank_name: string;
  cheque_number: string;
  cheque_date: Date | undefined;
  card_last_four: string;
  card_type: string;
  upi_id: string;
}

export interface SendReminderFormValues {
  student_fee_public_id: string;
  channel: string;
}

// Table column types
export interface FeeStructureTableRow {
  public_id: string;
  name: string;
  academic_year: string;
  class_names: string[];
  total_amount: number;
  due_date: string;
  is_active: boolean;
  student_count: number;
}

export interface StudentFeeTableRow {
  public_id: string;
  student_name: string;
  student_roll_number: string;
  class_name: string;
  fee_structure_name: string;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  paid_percentage: number;
  status: string;
  is_overdue: boolean;
}

export interface PaymentTableRow {
  public_id: string;
  student_name: string;
  fee_structure_name: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  receipt_number: string;
  received_by_name: string;
}

// Filter state types
export interface FeeFiltersState {
  academic_year?: string;
  class_public_id?: string;
  status?: string;
  is_active?: boolean;
  paid_percentage_lt?: number;
  paid_percentage_gte?: number;
  date_from?: string;
  date_to?: string;
  payment_mode?: string;
  search?: string;
}
