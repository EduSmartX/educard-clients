/**
 * Fee Module Constants
 * Shared across Web, iOS, and Android
 */

// Fee Status
export const FeeStatus = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  OVERDUE: "overdue",
  WAIVED: "waived",
  REFUNDING: "refunding",
  REFUNDED: "refunded",
} as const;

export type FeeStatusType = (typeof FeeStatus)[keyof typeof FeeStatus];

export const FeeStatusLabels: Record<FeeStatusType, string> = {
  [FeeStatus.PENDING]: "Pending",
  [FeeStatus.PARTIAL]: "Partially Paid",
  [FeeStatus.PAID]: "Fully Paid",
  [FeeStatus.OVERDUE]: "Overdue",
  [FeeStatus.WAIVED]: "Waived",
  [FeeStatus.REFUNDING]: "Refund Pending",
  [FeeStatus.REFUNDED]: "Refunded",
};

export const FeeStatusColors: Record<FeeStatusType, string> = {
  [FeeStatus.PENDING]: "#F59E0B", // amber
  [FeeStatus.PARTIAL]: "#3B82F6", // blue
  [FeeStatus.PAID]: "#10B981", // green
  [FeeStatus.OVERDUE]: "#EF4444", // red
  [FeeStatus.WAIVED]: "#6B7280", // gray
  [FeeStatus.REFUNDING]: "#F97316", // orange
  [FeeStatus.REFUNDED]: "#0EA5E9", // sky blue
};

// Payment Modes
export const PaymentMode = {
  CASH: "cash",
  CHEQUE: "cheque",
  BANK_TRANSFER: "bank_transfer",
  UPI: "upi",
  CARD: "card",
  ONLINE: "online",
} as const;

export type PaymentModeType = (typeof PaymentMode)[keyof typeof PaymentMode];

export const PaymentModeLabels: Record<PaymentModeType, string> = {
  [PaymentMode.CASH]: "Cash",
  [PaymentMode.CHEQUE]: "Cheque",
  [PaymentMode.BANK_TRANSFER]: "Bank Transfer",
  [PaymentMode.UPI]: "UPI",
  [PaymentMode.CARD]: "Debit/Credit Card",
  [PaymentMode.ONLINE]: "Online Payment",
};

export const PaymentModeIcons: Record<PaymentModeType, string> = {
  [PaymentMode.CASH]: "banknotes",
  [PaymentMode.CHEQUE]: "document-text",
  [PaymentMode.BANK_TRANSFER]: "building-library",
  [PaymentMode.UPI]: "qr-code",
  [PaymentMode.CARD]: "credit-card",
  [PaymentMode.ONLINE]: "globe-alt",
};

// Component Type
export const ComponentType = {
  MANDATORY: "mandatory",
  OPTIONAL: "optional",
} as const;

export type ComponentTypeValue =
  (typeof ComponentType)[keyof typeof ComponentType];

// Component Approval Status
export const ComponentApprovalStatus = {
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
} as const;

export type ComponentApprovalStatusValue =
  (typeof ComponentApprovalStatus)[keyof typeof ComponentApprovalStatus];

// Reminder Channels
export const ReminderChannel = {
  SMS: "sms",
  WHATSAPP: "whatsapp",
  EMAIL: "email",
} as const;

export type ReminderChannelType =
  (typeof ReminderChannel)[keyof typeof ReminderChannel];

// Transaction Type (Credit = payment received, Debit = refund issued)
export const TransactionType = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const;

export type TransactionTypeValue =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionTypeLabels: Record<TransactionTypeValue, string> = {
  [TransactionType.CREDIT]: "Credit",
  [TransactionType.DEBIT]: "Debit (Refund)",
};

export const TRANSACTION_TYPE_OPTIONS = Object.entries(
  TransactionTypeLabels,
).map(([value, label]) => ({ value, label }));

export const ReminderChannelLabels: Record<ReminderChannelType, string> = {
  [ReminderChannel.SMS]: "SMS",
  [ReminderChannel.WHATSAPP]: "WhatsApp",
  [ReminderChannel.EMAIL]: "Email",
};

// Fee Options for Dropdowns
export const FeeStatusOptions = Object.entries(FeeStatusLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const PaymentModeOptions = Object.entries(PaymentModeLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const ReminderChannelOptions = Object.entries(ReminderChannelLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

// Fee Messages (Success/Error)
export const FeeMessages = {
  // Success messages
  FEE_STRUCTURE_CREATED: "Fee structure created successfully.",
  FEE_STRUCTURE_UPDATED: "Fee structure updated successfully.",
  FEE_STRUCTURE_DELETED: "Fee structure deleted successfully.",
  STUDENT_FEE_CREATED: "Student fee record created successfully.",
  STUDENT_FEE_UPDATED: "Student fee record updated successfully.",
  STUDENT_FEE_DELETED: "Student fee record deleted successfully.",
  PAYMENT_RECORDED: "Payment recorded successfully.",
  REMINDER_SENT: "Due reminder sent successfully.",
  BULK_REMINDER_SENT: "Due reminders sent successfully.",

  // Error messages
  FEE_STRUCTURE_NOT_FOUND: "Fee structure not found.",
  STUDENT_FEE_NOT_FOUND: "Student fee record not found.",
  PAYMENT_NOT_FOUND: "Payment record not found.",
  INVALID_PAYMENT_AMOUNT: "Payment amount cannot exceed balance due.",
  ALREADY_FULLY_PAID: "This fee is already fully paid.",
  DUPLICATE_STUDENT_FEE:
    "A fee record already exists for this student and fee structure.",
  INVALID_DISCOUNT: "Discount percentage must be between 0 and 100.",
  NOTIFICATION_FAILED: "Failed to send notification.",
} as const;

// Fee Validation
export const FeeValidation = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 99999999.99,
  MAX_DISCOUNT_PERCENTAGE: 100,
  MIN_DISCOUNT_PERCENTAGE: 0,
  MAX_COMPONENT_NAME_LENGTH: 100,
  MAX_REFERRAL_NAME_LENGTH: 255,
  MAX_REFERRAL_CODE_LENGTH: 50,
  MAX_REMARKS_LENGTH: 500,
} as const;

// Fee Defaults
export const FeeDefaults = {
  DISCOUNT_PERCENTAGE: 0,
  PAGE_SIZE: 20,
  DEFAULTER_THRESHOLD: 50, // percentage
} as const;

// Fee Query Keys
export const FeeQueryKeys = {
  FEE_STRUCTURES: "fee-structures",
  FEE_STRUCTURE_DETAIL: "fee-structure-detail",
  STUDENT_FEES: "student-fees",
  STUDENT_FEE_DETAIL: "student-fee-detail",
  PAYMENTS: "payments",
  PAYMENT_DETAIL: "payment-detail",
  FEE_DASHBOARD: "fee-dashboard",
  DEFAULTERS: "fee-defaulters",
  REMINDERS: "fee-reminders",
  PARENT_FEES: "parent-fees",
  PARENT_FEE_DETAIL: "parent-fee-detail",
  PARENT_PAYMENTS: "parent-payments",
} as const;

// Alias for dropdown options
export const FEE_STATUS_OPTIONS = FeeStatusOptions;
export const PAYMENT_MODE_OPTIONS = PaymentModeOptions;
export const REMINDER_CHANNEL_OPTIONS = ReminderChannelOptions;

// Fee UI Text - Labels, Buttons, Page Titles
export const FEE_UI_TEXT = {
  PAGE_TITLES: {
    DASHBOARD: "Fee Management",
    STRUCTURES: "Fee Structures",
    STUDENT_FEES: "Student Fees",
    PAYMENTS: "Payments",
    MY_FEES: "My Fees",
    PAYMENT_HISTORY: "Payment History",
  },
  LABELS: {
    NAME: "Name",
    DESCRIPTION: "Description",
    TOTAL_AMOUNT: "Total Amount",
    DUE_DATE: "Due Date",
    ACADEMIC_YEAR: "Academic Year",
    CLASSES: "Classes",
    COMPONENTS: "Fee Components",
    AMOUNT: "Amount",
    PAYMENT_DATE: "Payment Date",
    PAYMENT_MODE: "Payment Mode",
    TRANSACTION_ID: "Transaction ID",
    REMARKS: "Remarks",
    REMINDER_CHANNELS: "Reminder Channels",
    CUSTOM_MESSAGE: "Custom Message",
  },
  BUTTONS: {
    CREATE: "Create",
    UPDATE: "Update",
    DELETE: "Delete",
    CANCEL: "Cancel",
    RESET: "Reset",
    RECORD_PAYMENT: "Record Payment",
    SEND_REMINDER: "Send Reminder",
    PAY_NOW: "Pay Now",
    DOWNLOAD_RECEIPT: "Download Receipt",
  },
  FORM: {
    CREATE_STRUCTURE: "Create Fee Structure",
    EDIT_STRUCTURE: "Edit Fee Structure",
    RECORD_PAYMENT: "Record Payment",
    SEND_REMINDER: "Send Fee Reminder",
  },
  EMPTY_STATES: {
    NO_STRUCTURES: "No fee structures found.",
    NO_FEES: "No fee records found.",
    NO_PAYMENTS: "No payment records found.",
  },
} as const;
