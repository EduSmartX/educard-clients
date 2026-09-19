/**
 * Store API - catalog, cart and orders
 */

import {
  API_ENDPOINTS,
  type AddCartItemPayload,
  type ApiDetailResponse,
  type ApiListResponse,
  type Cart,
  type CatalogProduct,
  type CatalogQueryParams,
  type Order,
  type OrderQueryParams,
  type PlaceOrderPayload,
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
