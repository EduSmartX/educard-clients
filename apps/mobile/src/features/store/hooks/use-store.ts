import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddCartItemPayload,
  CatalogQueryParams,
  OrderQueryParams,
  OrderStatus,
  PlaceOrderPayload,
} from '@educard/shared';

import {
  addCartItem,
  clearCart,
  getCart,
  getCatalog,
  getOrders,
  placeOrder,
  removeCartItem,
  updateCartItem,
  updateOrderStatus,
} from '../api/store-api';

export const storeKeys = {
  all: ['store'] as const,
  catalog: (params?: CatalogQueryParams) =>
    [...storeKeys.all, 'catalog', params] as const,
  cart: () => [...storeKeys.all, 'cart'] as const,
  orders: (params?: OrderQueryParams) =>
    [...storeKeys.all, 'orders', params] as const,
};

export function useCatalog(params?: CatalogQueryParams) {
  return useQuery({
    queryKey: storeKeys.catalog(params),
    queryFn: () => getCatalog(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCart() {
  return useQuery({
    queryKey: storeKeys.cart(),
    queryFn: getCart,
  });
}

/** Cart mutations return the whole cart, so seed the cache instead of refetching. */
function useCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => ReturnType<typeof getCart>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: response => {
      queryClient.setQueryData(storeKeys.cart(), response);
    },
  });
}

export function useAddCartItem() {
  return useCartMutation((payload: AddCartItemPayload) => addCartItem(payload));
}

export function useUpdateCartItem() {
  return useCartMutation(
    ({ publicId, quantity }: { publicId: string; quantity: number }) =>
      updateCartItem(publicId, { quantity }),
  );
}

export function useRemoveCartItem() {
  return useCartMutation((publicId: string) => removeCartItem(publicId));
}

export function useClearCart() {
  return useCartMutation(() => clearCart());
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => placeOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: storeKeys.orders(params),
    queryFn: () => getOrders(params),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicId,
      status,
    }: {
      publicId: string;
      status: OrderStatus;
    }) => updateOrderStatus(publicId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}
