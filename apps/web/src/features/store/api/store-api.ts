/**
 * API client for the store module (catalog, cart, orders).
 */
import apiClient from '@/lib/api';
import {
  API_ENDPOINTS,
  type AddCartItemPayload,
  type ApiDetailResponse,
  type ApiListResponse,
  type ApiMessageResponse,
  type BookSet,
  type BookSetPayload,
  type Cart,
  type CatalogProduct,
  type CatalogQueryParams,
  type IdCardTemplate,
  type Order,
  type OrderQueryParams,
  type PlaceOrderPayload,
  type ShipmentEventPayload,
  type ShipmentTracking,
  type SubmissionQueryParams,
  type SubmitIdCardTemplatePayload,
  type UpdateCartItemPayload,
  type UpdateOrderStatusPayload,
  type UpdateProductPropertiesPayload,
} from '@educard/shared';

export async function fetchCatalog(
  params?: CatalogQueryParams
): Promise<ApiListResponse<CatalogProduct>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.CATALOG, { params });
  return response.data;
}

export async function uploadProductImage(
  publicId: string,
  image: File
): Promise<ApiDetailResponse<CatalogProduct>> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await apiClient.post(API_ENDPOINTS.STORE.CATALOG_IMAGE(publicId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function resetProductImage(
  publicId: string
): Promise<ApiDetailResponse<CatalogProduct>> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.CATALOG_IMAGE(publicId));
  return response.data;
}

export async function fetchCart(): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.CART);
  return response.data;
}

export async function clearCart(): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.CART);
  return response.data;
}

export async function addCartItem(payload: AddCartItemPayload): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.CART_ITEMS, payload);
  return response.data;
}

export async function updateCartItem(
  publicId: string,
  payload: UpdateCartItemPayload
): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.patch(API_ENDPOINTS.STORE.CART_ITEM_DETAIL(publicId), payload);
  return response.data;
}

export async function removeCartItem(publicId: string): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.CART_ITEM_DETAIL(publicId));
  return response.data;
}

export async function fetchOrders(params?: OrderQueryParams): Promise<ApiListResponse<Order>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ORDERS, { params });
  return response.data;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<ApiDetailResponse<Order>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.ORDERS, payload);
  return response.data;
}

export async function fetchOrderDetail(publicId: string): Promise<ApiDetailResponse<Order>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ORDER_DETAIL(publicId));
  return response.data;
}

export async function updateOrderStatus(
  publicId: string,
  payload: UpdateOrderStatusPayload
): Promise<ApiDetailResponse<Order>> {
  const response = await apiClient.patch(API_ENDPOINTS.STORE.ORDER_DETAIL(publicId), payload);
  return response.data;
}

export async function updateProductProperties(
  publicId: string,
  payload: UpdateProductPropertiesPayload
): Promise<ApiDetailResponse<CatalogProduct>> {
  const response = await apiClient.patch(API_ENDPOINTS.STORE.CATALOG_PROPERTIES(publicId), payload);
  return response.data;
}

export async function fetchIdCardTemplates(
  params?: SubmissionQueryParams
): Promise<ApiDetailResponse<IdCardTemplate[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ID_CARD_TEMPLATES, { params });
  return response.data;
}

export async function submitIdCardTemplate(
  payload: SubmitIdCardTemplatePayload,
  image: File
): Promise<ApiDetailResponse<IdCardTemplate>> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('image', image);
  if (payload.class_public_id) {
    formData.append('class_public_id', payload.class_public_id);
  }
  const response = await apiClient.post(API_ENDPOINTS.STORE.ID_CARD_TEMPLATES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function withdrawIdCardTemplate(publicId: string): Promise<ApiMessageResponse> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.ID_CARD_TEMPLATE_DETAIL(publicId));
  return response.data;
}

export async function fetchBookSets(
  params?: SubmissionQueryParams
): Promise<ApiDetailResponse<BookSet[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.BOOK_SETS, { params });
  return response.data;
}

export async function submitBookSet(payload: BookSetPayload): Promise<ApiDetailResponse<BookSet>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.BOOK_SETS, payload);
  return response.data;
}

export async function reviseBookSet(
  publicId: string,
  payload: BookSetPayload
): Promise<ApiDetailResponse<BookSet>> {
  const response = await apiClient.put(API_ENDPOINTS.STORE.BOOK_SET_DETAIL(publicId), payload);
  return response.data;
}

export async function withdrawBookSet(publicId: string): Promise<ApiMessageResponse> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.BOOK_SET_DETAIL(publicId));
  return response.data;
}

export async function fetchShipmentTracking(
  token: string
): Promise<ApiDetailResponse<ShipmentTracking>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.TRACK(token));
  return response.data;
}

export async function recordShipmentEvent(
  token: string,
  payload: ShipmentEventPayload
): Promise<ApiDetailResponse<ShipmentTracking>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.TRACK_EVENTS(token), payload);
  return response.data;
}
