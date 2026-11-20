/**
 * Shared Types - Store (catalog, cart, orders)
 */

export type StoreAttributeInputType = "select" | "text" | "number" | "list";

export type CartStatus = "active" | "ordered" | "abandoned";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "delivered"
  | "cancelled";

/** A value the buyer may pick for a configurable attribute. */
export interface ProductAttributeOption {
  value: string;
  display_label: string;
  image_path: string;
  image_url: string;
}

/**
 * Who supplies an attribute's value: `organization` values are set once per school
 * (e.g. shirt colour) on the Store Setup page; `order` values are picked per cart line.
 */
export type ProductAttributeScope = "organization" | "order";

/** ID card and book set products resolve class-specific approved data at order time. */
export type ProductKind = "standard" | "id_card" | "book_set";

/** A configurable dimension of a product, e.g. size or colour. */
export interface ProductAttribute {
  code: string;
  display_name: string;
  input_type: StoreAttributeInputType;
  is_required: boolean;
  scope: ProductAttributeScope;
  options: ProductAttributeOption[];
}

/**
 * A catalog product as offered to one organization.
 * `default_image_path` ships with EduCard; `organization_image_path` is the school's
 * own upload. `image_path` is whichever applies.
 */
export interface CatalogProduct {
  public_id: string;
  code: string;
  name: string;
  description: string;
  category_code: string;
  category_name: string;
  unit_label: string;
  price: string;
  specifications: Record<string, string>;
  default_image_path: string;
  organization_image_path: string;
  image_path: string;
  image_url: string;
  uses_custom_image: boolean;
  kind: ProductKind;
  attributes: ProductAttribute[];
  /** The school's saved values for `organization`-scoped attributes. */
  organization_properties: Record<string, string>;
  /** Required school-level properties still unset; non-empty blocks ordering. */
  missing_properties: string[];
  setup_required: boolean;
}

export interface UpdateProductPropertiesPayload {
  properties: Record<string, string>;
}

export interface CatalogQueryParams {
  category?: string;
  page?: number;
  page_size?: number;
}

/** Buyer-defined features the catalog does not declare, keyed by feature name. */
export type CustomFeatures = Record<string, string>;

/** A server-resolved reference stored on a line, e.g. the class, template or book set. */
export interface ConfigurationSnapshot {
  public_id?: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Selected values for one cart line, keyed by attribute code.
 * The reserved `custom` key holds buyer-defined features. When adding to the cart,
 * `class` / `book_set` are public IDs; the server replaces them with snapshots and
 * adds `template` and `organization_properties` itself.
 */
export type CartItemConfiguration = Record<
  string,
  string | string[] | CustomFeatures | ConfigurationSnapshot
>;

export interface CartItem {
  public_id: string;
  product_public_id: string;
  product_code: string;
  product_name: string;
  image_path: string;
  quantity: number;
  unit_price: string;
  configuration: CartItemConfiguration;
  line_total: string;
}

export interface Cart {
  public_id: string;
  status: CartStatus;
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  subtotal: string;
}

export interface AddCartItemPayload {
  product_public_id: string;
  quantity?: number;
  configuration?: CartItemConfiguration;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface OrderItem {
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  configuration: CartItemConfiguration;
}

export interface Order {
  public_id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  notes: string;
  placed_at: string;
  placed_by_name: string | null;
  items: OrderItem[];
  shipments: ShipmentSummary[];
}

export interface PlaceOrderPayload {
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// Submissions EduCard approves: ID card templates and book sets
// ---------------------------------------------------------------------------

export type ApprovalStatus = "pending" | "approved" | "rejected" | "superseded";

export type SubmissionSource = "educard" | "organization";

interface ReviewedSubmission {
  public_id: string;
  name: string;
  /** The grade, e.g. "Class 10"; empty for a school-wide default template. */
  class_name: string;
  status: ApprovalStatus;
  source: SubmissionSource;
  review_notes: string;
  submitted_by_name: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface IdCardTemplate extends ReviewedSubmission {
  is_default: boolean;
  image_url: string;
}

export interface SubmitIdCardTemplatePayload {
  name: string;
  /** A class section's public ID; the template applies to that section's grade. */
  class_public_id?: string;
}

export interface BookSetItem {
  title: string;
  subject: string;
  publisher: string;
  isbn: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface BookSet extends ReviewedSubmission {
  price_override: string | null;
  items_total: string;
  price: string;
  items: BookSetItem[];
}

export interface BookSetItemInput {
  title: string;
  subject?: string;
  publisher?: string;
  isbn?: string;
  unit_price: string;
  quantity: number;
}

export interface BookSetPayload {
  name: string;
  class_public_id: string;
  price_override?: string | null;
  items: BookSetItemInput[];
}

export interface SubmissionQueryParams {
  status?: ApprovalStatus;
}

// ---------------------------------------------------------------------------
// Shipments and QR tracking
// ---------------------------------------------------------------------------

export type ShipmentStatus =
  | "packed"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/** A shipment as listed on its order. `qr_svg` is an inline SVG of `tracking_url`. */
export interface ShipmentSummary {
  shipment_number: string;
  status: ShipmentStatus;
  status_label: string;
  current_location: string;
  expected_delivery_date: string | null;
  delivered_at: string | null;
  carrier_name: string;
  tracking_token: string;
  tracking_url: string;
  qr_svg: string;
}

export interface ShipmentLineDetail {
  label: string;
  value: string;
}

export interface ShipmentLine {
  product_name: string;
  quantity: number;
  details: ShipmentLineDetail[];
}

export interface ShipmentEvent {
  status: ShipmentStatus;
  status_label: string;
  location: string;
  note: string;
  occurred_at: string;
  recorded_by_name: string | null;
}

/** What a scanned shipment QR shows. Only school admins and EduCard staff can load it. */
export interface ShipmentTracking {
  shipment_number: string;
  organization_name: string;
  order_number: string;
  status: ShipmentStatus;
  status_label: string;
  current_location: string;
  expected_delivery_date: string | null;
  delivered_at: string | null;
  carrier_name: string;
  carrier_reference: string;
  items: ShipmentLine[];
  /** Newest first. */
  events: ShipmentEvent[];
  tracking_url: string;
  qr_svg: string;
  /** True for EduCard store admins and the staff assigned to this shipment. */
  can_update: boolean;
  next_statuses: { value: ShipmentStatus; label: string }[];
}

export interface ShipmentEventPayload {
  status: ShipmentStatus;
  location?: string;
  note?: string;
  expected_delivery_date?: string | null;
}
