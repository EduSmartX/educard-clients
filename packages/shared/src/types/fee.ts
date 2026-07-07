/**
 * Fee Module Types
 * Shared across Web, iOS, and Android
 */

import type {
  FeeStatusType,
  PaymentModeType,
  ReminderChannelType,
  ComponentTypeValue,
  ComponentApprovalStatusValue,
  TransactionTypeValue,
} from "../constants/fee-constants";

// Local type aliases (not re-exported to avoid clash with const names in fee-constants)
type ComponentType = ComponentTypeValue;
type ComponentApprovalStatus = ComponentApprovalStatusValue;

export type FeeComponent = Record<string, number>;

export interface FeeComponentItem {
  public_id: string;
  name: string;
  description: string;
  amount: number;
  component_type: ComponentType;
  order: number;
}

export interface FeeComponentCreatePayload {
  name: string;
  description?: string;
  amount: number;
  component_type: ComponentType;
  order?: number;
}

export interface FeeStructure {
  public_id: string;
  name: string;
  academic_year: string;
  academic_year_public_id?: string;
  description: string;
  class_public_ids: string[];
  class_names: string[];
  components: FeeComponentItem[];
  total_amount: number;
  due_date: string;
  is_active: boolean;
  student_count: number;
  component_count: number;
  mandatory_count: number;
  optional_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeeStructureListItem {
  public_id: string;
  name: string;
  academic_year: string;
  description: string;
  class_names: string[];
  total_amount: number;
  due_date: string;
  is_active: boolean;
  student_count: number;
  component_count: number;
  mandatory_count: number;
  optional_count: number;
  created_at: string;
}

export interface FeeStructureCreatePayload {
  name: string;
  academic_year_public_id: string;
  description?: string;
  total_amount?: number;
  class_public_ids?: string[];
  components: FeeComponentCreatePayload[];
  due_date: string;
  is_active?: boolean;
}

export interface FeeStructureUpdatePayload {
  name?: string;
  academic_year_public_id?: string;
  description?: string;
  total_amount?: number;
  class_public_ids?: string[];
  components?: FeeComponentCreatePayload[];
  due_date?: string;
  is_active?: boolean;
}

export interface ClassChangeImpact {
  classes_to_add: string[];
  classes_to_remove: string[];
  students_will_be_assigned: number;
  unpaid_fees_will_be_deleted: number;
  paid_fees_will_be_cancelled: number;
  total_paid_amount_affected: string;
}

export interface StudentFeeComponentItem {
  public_id: string;
  fee_component_public_id: string;
  name: string;
  amount: number;
  component_type: ComponentType;
  is_selected: boolean;
  approval_status: ComponentApprovalStatus;
  request_note: string;
  admin_note: string;
  requested_at: string | null;
  responded_at: string | null;
}

export interface StudentFee {
  public_id: string;
  student_name: string;
  student_public_id: string;
  student_roll_number: string;
  class_name: string;
  fee_structure_name: string;
  fee_structure_public_id: string;
  academic_year: string;
  base_amount: number;
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  paid_percentage: number;
  status: FeeStatusType;
  status_display: string;
  is_overdue: boolean;
  due_date: string;
  last_payment_date: string | null;
  reminder_count: number;
  last_reminder_sent: string | null;
  selected_component_count: number;
  total_component_count: number;
  components?: StudentFeeComponentItem[];
  pending_approvals?: number;
  // Admin-only fields
  referral_name?: string;
  referral_code?: string;
  discount_reason?: string;
  payment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentFeeListItem {
  public_id: string;
  student_name: string;
  student_public_id: string;
  student_roll_number: string;
  class_name: string;
  fee_structure_name: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  paid_percentage: number;
  status: FeeStatusType;
  status_display: string;
  is_overdue: boolean;
  selected_component_count: number;
  total_component_count: number;
  last_payment_date: string | null;
  created_at: string;
}

export interface StudentFeeCreatePayload {
  student_public_id: string;
  fee_structure_public_id: string;
  discount_percentage?: number;
  referral_name?: string;
  referral_code?: string;
  discount_reason?: string;
  deselected_optional_components?: string[];
}

export interface StudentFeeUpdatePayload {
  discount_percentage?: number;
  referral_name?: string;
  referral_code?: string;
  discount_reason?: string;
  status?: "refunded";
}

export interface StudentFeeComponentUpdateItem {
  component_public_id: string;
  is_selected: boolean;
  admin_note?: string;
}

export interface StudentFeeComponentUpdatePayload {
  components: StudentFeeComponentUpdateItem[];
}

export interface ComponentReviewDecision {
  component_public_id: string;
  action: "approve" | "reject";
  admin_note?: string;
}

export interface ComponentReviewPayload {
  decisions: ComponentReviewDecision[];
}

export interface PaymentStatus {
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  paid_percentage: number;
  status: FeeStatusType;
  status_display: string;
  is_overdue: boolean;
  days_overdue: number;
  due_date: string;
  last_payment_date: string | null;
}

export interface FeePayment {
  public_id: string;
  student_name: string;
  class_name?: string;
  student_fee_public_id: string;
  fee_structure_name: string;
  amount: number;
  transaction_type: TransactionTypeValue;
  transaction_type_display: string;
  payment_date: string;
  payment_mode: PaymentModeType;
  payment_mode_display: string;
  receipt_number: string;
  utr_number: string;
  transaction_id: string;
  remarks: string;
  bank_name: string;
  cheque_number: string;
  cheque_date: string | null;
  card_last_four: string;
  card_type: string;
  upi_id: string;
  received_by_name: string;
  confirmation_sent: boolean;
  confirmation_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeePaymentListItem {
  public_id: string;
  student_name: string;
  student_fee_public_id: string;
  fee_structure_name: string;
  amount: number;
  transaction_type: TransactionTypeValue;
  transaction_type_display: string;
  payment_date: string;
  payment_mode: PaymentModeType;
  payment_mode_display: string;
  receipt_number: string;
  utr_number: string;
  received_by_name: string;
  created_at: string;
}

export interface PaymentCreatePayload {
  student_fee_public_id: string;
  amount: number;
  transaction_type?: TransactionTypeValue;
  payment_date: string;
  payment_mode: PaymentModeType;
  utr_number?: string;
  transaction_id?: string;
  remarks?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  card_last_four?: string;
  card_type?: string;
  upi_id?: string;
}

export interface FeeReminder {
  public_id: string;
  student_name: string;
  sent_via: ReminderChannelType;
  sent_to: string;
  message: string;
  sent_at: string;
  delivery_status: string;
}

export interface SendReminderPayload {
  student_fee_public_id: string;
  channel?: ReminderChannelType;
}

export interface BulkReminderPayload {
  student_fee_public_ids: string[];
  channel?: ReminderChannelType;
}

export interface ReminderResult {
  success: boolean;
  message?: string;
  error?: string;
  sent_to?: string;
  channel?: string;
}

export interface FeeDashboard {
  total_fees: number;
  total_amount: number;
  total_collected: number;
  total_pending: number;
  collection_percentage: number;
  fully_paid_count: number;
  partial_paid_count: number;
  pending_count: number;
  overdue_count: number;
  recent_payments: FeePaymentListItem[];
}

export interface FeeStructureFilters {
  academic_year?: string;
  is_active?: boolean;
  class_public_id?: string;
  page?: number;
  page_size?: number;
}

export interface StudentFeeFilters {
  status?: FeeStatusType;
  class_public_id?: string;
  student_public_id?: string;
  fee_structure_public_id?: string;
  paid_percentage_lt?: number;
  paid_percentage_gte?: number;
  page?: number;
  page_size?: number;
}

export interface PaymentFilters {
  student_fee_public_id?: string;
  student_public_id?: string;
  class_public_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  payment_mode?: PaymentModeType;
  utr?: string;
  page?: number;
  page_size?: number;
}

export interface ParentStudentFee {
  public_id: string;
  fee_structure_name: string;
  academic_year: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  paid_percentage: number;
  status: FeeStatusType;
  status_display: string;
  is_overdue: boolean;
  due_date: string;
  last_payment_date: string | null;
  components: FeeComponent;
}

export interface ParentPaymentHistory {
  public_id: string;
  amount: number;
  payment_date: string;
  payment_mode: PaymentModeType;
  payment_mode_display: string;
  receipt_number: string;
}
