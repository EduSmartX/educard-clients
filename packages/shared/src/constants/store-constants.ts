/**
 * Store constants shared by web and mobile.
 */

/**
 * An order's journey (before it is placed, the cart is the draft):
 * ordered -> in_review -> awaiting_approval -> approved -> processing -> shipped -> delivered.
 * Only ID card orders need approval; others skip those two steps. Mirrors the server.
 */
export const ORDER_STATUS = {
  ORDERED: "ordered",
  IN_REVIEW: "in_review",
  AWAITING_APPROVAL: "awaiting_approval",
  APPROVED: "approved",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  ordered: "Ordered",
  in_review: "In review",
  awaiting_approval: "Waiting for approval",
  approved: "Approved",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** What each step means, for the school. */
export const ORDER_STATUS_HINTS: Record<string, string> = {
  ordered: "Your order has reached EduCard.",
  in_review: "EduCard is reviewing your order and preparing the ID cards.",
  awaiting_approval:
    "The ID cards are ready. The school admin and class teacher need to approve them.",
  approved: "You approved the ID cards. EduCard will start printing.",
  processing: "EduCard is printing / making your order.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "This order was cancelled.",
};

/** The steps shown in the order's progress bar. */
export function orderSteps(needsApproval: boolean): string[] {
  return [
    ORDER_STATUS.ORDERED,
    ORDER_STATUS.IN_REVIEW,
    ...(needsApproval
      ? [ORDER_STATUS.AWAITING_APPROVAL, ORDER_STATUS.APPROVED]
      : []),
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
  ];
}

/**
 * A school may cancel its own order until it has approved it (ordered, in review,
 * waiting for approval). After that it calls EduCard, who can cancel until it ships.
 * The order's `can_cancel` flag from the server is the source of truth.
 */
export const ORGANIZATION_CANCELLABLE_ORDER_STATUSES: readonly string[] = [
  "ordered",
  "in_review",
  "awaiting_approval",
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
  /** ID cards: true = every current student of the chosen class (no IDs needed). */
  ALL_STUDENTS: "all_students",
} as const;

/**
 * Line keys the store UI fills itself (class, students, book set). The catalog may
 * still declare them as attributes for validation, but they are never shown as
 * free-text fields.
 */
export const STORE_UI_MANAGED_KEYS: readonly string[] = [
  STORE_CONFIG_KEY.CLASS,
  STORE_CONFIG_KEY.BOOK_SET,
  STORE_CONFIG_KEY.STUDENT_IDS,
  STORE_CONFIG_KEY.STUDENTS,
  STORE_CONFIG_KEY.ALL_STUDENTS,
];

/** Strip the "/api" prefix from server-returned paths so apiClient can call them. */
export function apiRelativePath(path: string): string {
  return path.replace(/^\/api(?=\/)/, "");
}

export const PUBLISH_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

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
