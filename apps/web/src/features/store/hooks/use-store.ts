import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QueryKeys,
  type AddCartItemPayload,
  type CatalogQueryParams,
  type OrderQueryParams,
  type PlaceOrderPayload,
  type UpdateOrderStatusPayload,
} from '@educard/shared';
import {
  addCartItem,
  clearCart,
  fetchCart,
  fetchCatalog,
  fetchOrderDetail,
  fetchOrders,
  placeOrder,
  removeCartItem,
  resetProductImage,
  updateCartItem,
  updateOrderStatus,
  uploadProductImage,
} from '../api/store-api';

export function useCatalog(params?: CatalogQueryParams) {
  return useQuery({
    queryKey: QueryKeys.STORE.CATALOG(params),
    queryFn: () => fetchCatalog(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCart() {
  return useQuery({
    queryKey: QueryKeys.STORE.CART,
    queryFn: fetchCart,
    refetchOnMount: 'always',
  });
}

/** Every cart mutation returns the whole cart, so seed the cache instead of refetching. */
function useCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => ReturnType<typeof fetchCart>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(QueryKeys.STORE.CART, response);
    },
  });
}

export function useAddCartItem() {
  return useCartMutation((payload: AddCartItemPayload) => addCartItem(payload));
}

export function useUpdateCartItem() {
  return useCartMutation(({ publicId, quantity }: { publicId: string; quantity: number }) =>
    updateCartItem(publicId, { quantity })
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.ALL });
    },
  });
}

export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: QueryKeys.STORE.ORDERS(params),
    queryFn: () => fetchOrders(params),
    refetchOnMount: 'always',
  });
}

export function useOrderDetail(publicId: string) {
  return useQuery({
    queryKey: QueryKeys.STORE.ORDER_DETAIL(publicId),
    queryFn: () => fetchOrderDetail(publicId),
    enabled: Boolean(publicId),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, status }: { publicId: string } & UpdateOrderStatusPayload) =>
      updateOrderStatus(publicId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.ALL });
    },
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, image }: { publicId: string; image: File }) =>
      uploadProductImage(publicId, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.ALL });
    },
  });
}

export function useResetProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => resetProductImage(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.ALL });
    },
  });
}
