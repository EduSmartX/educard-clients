/**
 * Store API - catalog, cart and orders
 */

import {
  API_ENDPOINTS,
  apiRelativePath,
  type AddCartItemPayload,
  type AdoptIdCardDesignPayload,
  type ApiDetailResponse,
  type ApiListResponse,
  type ApiMessageResponse,
  type Cart,
  type CatalogProduct,
  type CatalogQueryParams,
  type BookSet,
  type ClassLookPayload,
  type IdCardDesign,
  type IdCardTemplate,
  type ProductLooks,
  type Order,
  type OrderQueryParams,
  type PlaceOrderPayload,
  type ShipmentEventPayload,
  type ShipmentTracking,
  type SubmissionQueryParams,
  type UpdateCartItemPayload,
  type UpdateOrderStatusPayload,
} from '@educard/shared';

import { apiClient } from '@/api/client';

export async function getCatalog(
  params?: CatalogQueryParams,
): Promise<ApiListResponse<CatalogProduct>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.CATALOG, {
    params,
  });
  return response.data;
}

export async function getCart(): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.CART);
  return response.data;
}

export async function clearCart(): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.CART);
  return response.data;
}

export async function addCartItem(
  payload: AddCartItemPayload,
): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.post(
    API_ENDPOINTS.STORE.CART_ITEMS,
    payload,
  );
  return response.data;
}

export async function updateCartItem(
  publicId: string,
  payload: UpdateCartItemPayload,
): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.CART_ITEM_DETAIL(publicId),
    payload,
  );
  return response.data;
}

export async function removeCartItem(
  publicId: string,
): Promise<ApiDetailResponse<Cart>> {
  const response = await apiClient.delete(
    API_ENDPOINTS.STORE.CART_ITEM_DETAIL(publicId),
  );
  return response.data;
}

export async function getOrders(
  params?: OrderQueryParams,
): Promise<ApiListResponse<Order>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ORDERS, { params });
  return response.data;
}

export async function placeOrder(
  payload: PlaceOrderPayload,
): Promise<ApiDetailResponse<Order>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.ORDERS, payload);
  return response.data;
}

export async function updateOrderStatus(
  publicId: string,
  payload: UpdateOrderStatusPayload,
): Promise<ApiDetailResponse<Order>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.ORDER_DETAIL(publicId),
    payload,
  );
  return response.data;
}

export async function getIdCardTemplates(
  params?: SubmissionQueryParams,
): Promise<ApiDetailResponse<IdCardTemplate[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ID_CARD_TEMPLATES, {
    params,
  });
  return response.data;
}

export async function getBookSets(
  params?: SubmissionQueryParams,
): Promise<ApiDetailResponse<BookSet[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.BOOK_SETS, {
    params,
  });
  return response.data;
}

/** A picked image as React Native's FormData expects it. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

function multipart(fields: Record<string, string | UploadFile | undefined>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === '') {
      continue;
    }
    formData.append(key, value as unknown as Blob);
  }
  return formData;
}

const MULTIPART = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 60000,
};

export async function updateProductProperties(
  publicId: string,
  properties: Record<string, string>,
): Promise<ApiDetailResponse<CatalogProduct>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.CATALOG_PROPERTIES(publicId),
    { properties },
  );
  return response.data;
}

export async function getIdCardDesigns(): Promise<
  ApiDetailResponse<IdCardDesign[]>
> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ID_CARD_DESIGNS);
  return response.data;
}

export async function adoptIdCardDesign(
  payload: AdoptIdCardDesignPayload,
): Promise<ApiDetailResponse<IdCardTemplate>> {
  const response = await apiClient.post(
    API_ENDPOINTS.STORE.ID_CARD_TEMPLATES,
    payload,
  );
  return response.data;
}

/** The school's own card artwork; EduCard builds the print design from it. */
export async function uploadIdCardTemplate(
  name: string,
  image: UploadFile,
  classPublicId?: string,
): Promise<ApiDetailResponse<IdCardTemplate>> {
  const response = await apiClient.post(
    API_ENDPOINTS.STORE.ID_CARD_TEMPLATES,
    multipart({ name, image, class_public_id: classPublicId }),
    MULTIPART,
  );
  return response.data;
}

export async function withdrawIdCardTemplate(
  publicId: string,
): Promise<ApiMessageResponse> {
  const response = await apiClient.delete(
    API_ENDPOINTS.STORE.ID_CARD_TEMPLATE_DETAIL(publicId),
  );
  return response.data;
}

/**
 * A rendered card side as a data URI. Previews are auth-protected PNGs, so they
 * go through apiClient (token + refresh) instead of a bare <Image> URL.
 */
export async function getCardPreview(
  path: string,
  student?: string,
): Promise<string> {
  const response = await apiClient.get<Blob>(apiRelativePath(path), {
    params: student ? { student } : undefined,
    responseType: 'blob',
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the card preview'));
    reader.readAsDataURL(response.data);
  });
}

export async function getProductLooks(
  publicId: string,
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.get(
    API_ENDPOINTS.STORE.CATALOG_LOOKS(publicId),
  );
  return response.data;
}

export async function saveClassLook(
  publicId: string,
  payload: ClassLookPayload,
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.put(
    API_ENDPOINTS.STORE.CATALOG_CLASS_LOOK(publicId),
    payload,
  );
  return response.data;
}

export async function addProductPhoto(
  publicId: string,
  image: UploadFile,
  classPublicId?: string,
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.post(
    API_ENDPOINTS.STORE.CATALOG_PHOTOS(publicId),
    multipart({ image, class_public_id: classPublicId }),
    MULTIPART,
  );
  return response.data;
}

export async function setPrimaryProductPhoto(
  publicId: string,
  photoId: string,
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.CATALOG_PHOTO_DETAIL(publicId, photoId),
    { is_primary: true },
  );
  return response.data;
}

export async function removeProductPhoto(
  publicId: string,
  photoId: string,
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.delete(
    API_ENDPOINTS.STORE.CATALOG_PHOTO_DETAIL(publicId, photoId),
  );
  return response.data;
}

export async function getShipmentTracking(
  token: string,
): Promise<ApiDetailResponse<ShipmentTracking>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.TRACK(token));
  return response.data;
}

export async function recordShipmentEvent(
  token: string,
  payload: ShipmentEventPayload,
): Promise<ApiDetailResponse<ShipmentTracking>> {
  const response = await apiClient.post(
    API_ENDPOINTS.STORE.TRACK_EVENTS(token),
    payload,
  );
  return response.data;
}
