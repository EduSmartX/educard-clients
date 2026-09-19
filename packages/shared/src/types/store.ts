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

/** A configurable dimension of a product, e.g. size, colour, ID-card template. */
export interface ProductAttribute {
  code: string;
  display_name: string;
  input_type: StoreAttributeInputType;
  is_required: boolean;
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
  attributes: ProductAttribute[];
}

export interface CatalogQueryParams {
  category?: string;
  page?: number;
  page_size?: number;
}

/** Selected attribute values for one cart line, keyed by attribute code. */
export type CartItemConfiguration = Record<string, string | string[]>;

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
