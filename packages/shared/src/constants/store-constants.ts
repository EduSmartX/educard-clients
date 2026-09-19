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

/** Mirrors the server-side transition rules so the UI only offers valid next steps. */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const TERMINAL_ORDER_STATUSES = ["delivered", "cancelled"] as const;

export const PRODUCT_ATTRIBUTE_INPUT_TYPE = {
  SELECT: "select",
  TEXT: "text",
  NUMBER: "number",
  LIST: "list",
} as const;

export const STORE_CURRENCY = "INR";

/** Cart badge stops counting past this. */
export const CART_BADGE_MAX = 99;
