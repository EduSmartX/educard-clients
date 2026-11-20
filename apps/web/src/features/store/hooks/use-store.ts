import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QueryKeys,
  type AddCartItemPayload,
  type BookSetPayload,
  type CatalogQueryParams,
  type OrderQueryParams,
  type PlaceOrderPayload,
  type ShipmentEventPayload,
  type SubmissionQueryParams,
  type SubmitIdCardTemplatePayload,
  type UpdateOrderStatusPayload,
} from '@educard/shared';
import {
  addCartItem,
  clearCart,
  fetchBookSets,
  fetchCart,
  fetchCatalog,
  fetchIdCardTemplates,
  fetchOrderDetail,
  fetchOrders,
  fetchShipmentTracking,
  placeOrder,
  recordShipmentEvent,
  removeCartItem,
  resetProductImage,
  reviseBookSet,
  submitBookSet,
  submitIdCardTemplate,
  updateCartItem,
  updateOrderStatus,
  updateProductProperties,
  uploadProductImage,
  withdrawBookSet,
  withdrawIdCardTemplate,
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

/** Any store write can change setup status, templates or prices, so refresh it all. */
function useStoreMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.ALL });
    },
  });
}

export function useUpdateProductProperties() {
  return useStoreMutation(
    ({ publicId, properties }: { publicId: string; properties: Record<string, string> }) =>
      updateProductProperties(publicId, { properties })
  );
}

export function useIdCardTemplates(params?: SubmissionQueryParams) {
  return useQuery({
    queryKey: QueryKeys.STORE.ID_CARD_TEMPLATES(params),
    queryFn: () => fetchIdCardTemplates(params),
  });
}

export function useSubmitIdCardTemplate() {
  return useStoreMutation(
    ({ payload, image }: { payload: SubmitIdCardTemplatePayload; image: File }) =>
      submitIdCardTemplate(payload, image)
  );
}

export function useWithdrawIdCardTemplate() {
  return useStoreMutation((publicId: string) => withdrawIdCardTemplate(publicId));
}

export function useBookSets(params?: SubmissionQueryParams) {
  return useQuery({
    queryKey: QueryKeys.STORE.BOOK_SETS(params),
    queryFn: () => fetchBookSets(params),
  });
}

export function useSaveBookSet() {
  return useStoreMutation(
    ({ publicId, payload }: { publicId?: string; payload: BookSetPayload }) =>
      publicId ? reviseBookSet(publicId, payload) : submitBookSet(payload)
  );
}

export function useWithdrawBookSet() {
  return useStoreMutation((publicId: string) => withdrawBookSet(publicId));
}

export function useShipmentTracking(token: string) {
  return useQuery({
    queryKey: QueryKeys.STORE.TRACKING(token),
    queryFn: () => fetchShipmentTracking(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useRecordShipmentEvent(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShipmentEventPayload) => recordShipmentEvent(token, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(QueryKeys.STORE.TRACKING(token), response);
      // Order status may have moved to delivered; refresh lists that show it.
      queryClient.invalidateQueries({
        queryKey: QueryKeys.STORE.ALL,
        predicate: (query) => query.queryKey[1] !== 'tracking',
      });
    },
  });
}
