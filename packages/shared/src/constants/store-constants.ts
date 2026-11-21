/**
 * Store constants shared by web and mobile.
 */

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * A school may only cancel its own order, and only before EduCard starts packing it.
 * Confirming, shipping and delivery are driven by EduCard; mirrors the server rule.
 */
export const ORGANIZATION_CANCELLABLE_ORDER_STATUSES: readonly string[] = [
  "pending",
  "confirmed",
];

export const TERMINAL_ORDER_STATUSES = ["delivered", "cancelled"] as const;

export const PRODUCT_KIND = {
  STANDARD: "standard",
  ID_CARD: "id_card",
  BOOK_SET: "book_set",
} as const;

export const PRODUCT_ATTRIBUTE_SCOPE = {
  ORGANIZATION: "organization",
  ORDER: "order",
} as const;

/** Reserved cart-line keys; mirrors the server's ConfigKey. */
export const STORE_CONFIG_KEY = {
  CLASS: "class",
  TEMPLATE: "template",
  BOOK_SET: "book_set",
  ORGANIZATION_PROPERTIES: "organization_properties",
  /** ID cards: the chosen students' public IDs (one card each). */
  STUDENT_IDS: "student_ids",
  /** Uniform-style per-student lines: [{ student, size, ... }]. */
  STUDENTS: "students",
} as const;

/** Strip the "/api" prefix from server-returned paths so apiClient can call them. */
export function apiRelativePath(path: string): string {
  return path.replace(/^\/api(?=\/)/, "");
}

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUPERSEDED: "superseded",
} as const;

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting EduCard approval",
  approved: "Approved",
  rejected: "Rejected",
  superseded: "Replaced",
};

/** The school may edit or withdraw a submission only in these states. */
export const EDITABLE_APPROVAL_STATUSES: readonly string[] = [
  "pending",
  "rejected",
];

export const SHIPMENT_STATUS = {
  PACKED: "packed",
  DISPATCHED: "dispatched",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  packed: "Packed",
  dispatched: "Dispatched",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The happy path, used to draw the progress tracker. */
export const SHIPMENT_PROGRESS_STEPS = [
  "packed",
  "dispatched",
  "in_transit",
  "out_for_delivery",
  "delivered",
] as const;

/** Checkpoints on these legs must say where the parcel is; mirrors the server. */
export const SHIPMENT_LOCATION_REQUIRED_STATUSES: readonly string[] = [
  "in_transit",
  "out_for_delivery",
];

/** Bounds on a requested book set; mirrors the server's StoreLimits. */
export const BOOK_SET_LIMITS = {
  MAX_ITEMS: 100,
  MAX_QUANTITY: 50,
} as const;

export const PRODUCT_ATTRIBUTE_INPUT_TYPE = {
  SELECT: "select",
  TEXT: "text",
  NUMBER: "number",
  LIST: "list",
} as const;

export const STORE_CURRENCY = "INR";

/** Reserved configuration key for buyer-defined features; mirrors the server. */
export const CUSTOM_FEATURES_KEY = "custom";

/** Cart badge stops counting past this. */
export const CART_BADGE_MAX = 99;
