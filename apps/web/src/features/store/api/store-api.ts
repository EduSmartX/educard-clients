/**
 * API client for the store module (catalog, cart, orders).
 */
import apiClient from '@/lib/api';
import {
  API_ENDPOINTS,
  apiRelativePath,
  type AddCartItemPayload,
  type AdoptIdCardDesignPayload,
  type ClassLookPayload,
  type IdCardDesign,
  type IdCardProofDetail,
  type IdCardProofSummary,
  type ProofDecisionPayload,
  type ProofStatus,
  type StudentCard,
  type ProductLooks,
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
  type ProductCustomizationPayload,
  type ShipmentEventPayload,
  type ShipmentTracking,
  type SubmissionQueryParams,
  type SubmitIdCardTemplatePayload,
  type UpdateCartItemPayload,
  type UpdateOrderStatusPayload,
  type UpdateProductPropertiesPayload,
} from '@educard/shared';

export async function saveProductCustomization(
  publicId: string,
  payload: ProductCustomizationPayload
): Promise<ApiDetailResponse<CatalogProduct>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.CATALOG_CUSTOMIZATION(publicId),
    payload
  );
  return response.data;
}

export async function unpublishProduct(
  publicId: string
): Promise<ApiDetailResponse<CatalogProduct>> {
  const response = await apiClient.delete(API_ENDPOINTS.STORE.CATALOG_PUBLISH(publicId));
  return response.data;
}

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
  for (const classId of payload.class_public_ids ?? []) {
    formData.append('class_public_ids', classId);
  }
  if (payload.product_public_id) {
    formData.append('product_public_id', payload.product_public_id);
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

/** EduCard's designs; with `product` only those usable for that school product. */
export async function fetchIdCardDesigns(
  product?: string
): Promise<ApiDetailResponse<IdCardDesign[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.ID_CARD_DESIGNS, {
    params: product ? { product } : undefined,
  });
  return response.data;
}

export async function adoptIdCardDesign(
  payload: AdoptIdCardDesignPayload
): Promise<ApiDetailResponse<IdCardTemplate>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.ID_CARD_TEMPLATES, payload);
  return response.data;
}

/** A rendered card side (PNG) from a server preview path, as a Blob. */
export async function fetchProofs(
  status?: ProofStatus
): Promise<ApiDetailResponse<IdCardProofSummary[]>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.PROOFS, {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function fetchProofDetail(
  publicId: string
): Promise<ApiDetailResponse<IdCardProofDetail>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.PROOF_DETAIL(publicId));
  return response.data;
}

export async function decideProof(
  publicId: string,
  payload: ProofDecisionPayload
): Promise<ApiDetailResponse<IdCardProofSummary>> {
  const response = await apiClient.post(API_ENDPOINTS.STORE.PROOF_DECISION(publicId), payload);
  return response.data;
}

export async function fetchStudentCard(studentId: string): Promise<ApiDetailResponse<StudentCard>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.STUDENT_CARD(studentId));
  return response.data;
}

export async function fetchCardPreview(path: string, student?: string): Promise<Blob> {
  const response = await apiClient.get(apiRelativePath(path), {
    params: student ? { student } : undefined,
    responseType: 'blob',
  });
  return response.data;
}

export async function fetchProductLooks(
  publicId: string
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.get(API_ENDPOINTS.STORE.CATALOG_LOOKS(publicId));
  return response.data;
}

export async function saveClassLook(
  publicId: string,
  payload: ClassLookPayload
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.put(API_ENDPOINTS.STORE.CATALOG_CLASS_LOOK(publicId), payload);
  return response.data;
}

export async function addProductPhoto(
  publicId: string,
  image: File,
  options: {
    class_public_id?: string;
    /** Show the same photo for several classes (one upload). */
    class_public_ids?: string[];
    caption?: string;
    is_primary?: boolean;
  } = {}
): Promise<ApiDetailResponse<ProductLooks>> {
  const formData = new FormData();
  formData.append('image', image);
  if (options.class_public_id) {
    formData.append('class_public_id', options.class_public_id);
  }
  for (const classId of options.class_public_ids ?? []) {
    formData.append('class_public_ids', classId);
  }
  if (options.caption) {
    formData.append('caption', options.caption);
  }
  if (options.is_primary) {
    formData.append('is_primary', 'true');
  }
  const response = await apiClient.post(API_ENDPOINTS.STORE.CATALOG_PHOTOS(publicId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function setPrimaryProductPhoto(
  publicId: string,
  photoId: string
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.patch(
    API_ENDPOINTS.STORE.CATALOG_PHOTO_DETAIL(publicId, photoId),
    { is_primary: true }
  );
  return response.data;
}

export async function removeProductPhoto(
  publicId: string,
  photoId: string
): Promise<ApiDetailResponse<ProductLooks>> {
  const response = await apiClient.delete(
    API_ENDPOINTS.STORE.CATALOG_PHOTO_DETAIL(publicId, photoId)
  );
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
