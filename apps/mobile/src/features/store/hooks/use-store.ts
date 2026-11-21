import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddCartItemPayload,
  AdoptIdCardDesignPayload,
  CatalogQueryParams,
  ClassLookPayload,
  OrderQueryParams,
  OrderStatus,
  PlaceOrderPayload,
  ShipmentEventPayload,
  SubmissionQueryParams,
} from '@educard/shared';

import {
  addCartItem,
  addProductPhoto,
  adoptIdCardDesign,
  clearCart,
  getBookSets,
  getCardPreview,
  getCart,
  getCatalog,
  getIdCardDesigns,
  getIdCardTemplates,
  getOrders,
  getProductLooks,
  getShipmentTracking,
  placeOrder,
  recordShipmentEvent,
  removeCartItem,
  removeProductPhoto,
  saveClassLook,
  setPrimaryProductPhoto,
  updateCartItem,
  updateOrderStatus,
  updateProductProperties,
  uploadIdCardTemplate,
  withdrawIdCardTemplate,
  type UploadFile,
} from '../api/store-api';

export const storeKeys = {
  all: ['store'] as const,
  catalog: (params?: CatalogQueryParams) =>
    [...storeKeys.all, 'catalog', params] as const,
  cart: () => [...storeKeys.all, 'cart'] as const,
  orders: (params?: OrderQueryParams) =>
    [...storeKeys.all, 'orders', params] as const,
  idCardTemplates: (params?: SubmissionQueryParams) =>
    [...storeKeys.all, 'id-card-templates', params] as const,
  bookSets: (params?: SubmissionQueryParams) =>
    [...storeKeys.all, 'book-sets', params] as const,
  tracking: (token: string) => [...storeKeys.all, 'tracking', token] as const,
  designs: () => [...storeKeys.all, 'id-card-designs'] as const,
  looks: (publicId: string) => [...storeKeys.all, 'looks', publicId] as const,
  cardPreview: (path: string, student?: string) =>
    [...storeKeys.all, 'card-preview', path, student ?? ''] as const,
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

export function useIdCardTemplates(
  params?: SubmissionQueryParams,
  enabled = true,
) {
  return useQuery({
    queryKey: storeKeys.idCardTemplates(params),
    queryFn: () => getIdCardTemplates(params),
    enabled,
  });
}

export function useBookSets(params?: SubmissionQueryParams, enabled = true) {
  return useQuery({
    queryKey: storeKeys.bookSets(params),
    queryFn: () => getBookSets(params),
    enabled,
  });
}

/** Store Setup writes: refresh every store query (catalog images follow looks). */
function useStoreMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Rendered card previews do not change with these writes; keep them cached.
      queryClient.invalidateQueries({
        queryKey: storeKeys.all,
        predicate: query => query.queryKey[1] !== 'card-preview',
      });
    },
  });
}

export function useUpdateProductProperties() {
  return useStoreMutation(
    ({
      publicId,
      properties,
    }: {
      publicId: string;
      properties: Record<string, string>;
    }) => updateProductProperties(publicId, properties),
  );
}

export function useIdCardDesigns(enabled = true) {
  return useQuery({
    queryKey: storeKeys.designs(),
    queryFn: getIdCardDesigns,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAdoptIdCardDesign() {
  return useStoreMutation((payload: AdoptIdCardDesignPayload) =>
    adoptIdCardDesign(payload),
  );
}

export function useUploadIdCardTemplate() {
  return useStoreMutation(
    ({
      name,
      image,
      classPublicId,
    }: {
      name: string;
      image: UploadFile;
      classPublicId?: string;
    }) => uploadIdCardTemplate(name, image, classPublicId),
  );
}

export function useWithdrawIdCardTemplate() {
  return useStoreMutation((publicId: string) =>
    withdrawIdCardTemplate(publicId),
  );
}

/** Data URI of a rendered card side, optionally with one student's details. */
export function useCardPreview(path: string | undefined, student?: string) {
  return useQuery({
    queryKey: storeKeys.cardPreview(path ?? '', student),
    queryFn: () => getCardPreview(path as string, student),
    enabled: Boolean(path),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useProductLooks(publicId: string | undefined) {
  return useQuery({
    queryKey: storeKeys.looks(publicId ?? ''),
    queryFn: () => getProductLooks(publicId as string),
    enabled: Boolean(publicId),
  });
}

export function useSaveClassLook(publicId: string) {
  return useStoreMutation((payload: ClassLookPayload) =>
    saveClassLook(publicId, payload),
  );
}

export function useAddProductPhoto(publicId: string) {
  return useStoreMutation(
    ({ image, classPublicId }: { image: UploadFile; classPublicId?: string }) =>
      addProductPhoto(publicId, image, classPublicId),
  );
}

export function useSetPrimaryProductPhoto(publicId: string) {
  return useStoreMutation((photoId: string) =>
    setPrimaryProductPhoto(publicId, photoId),
  );
}

export function useRemoveProductPhoto(publicId: string) {
  return useStoreMutation((photoId: string) =>
    removeProductPhoto(publicId, photoId),
  );
}

export function useShipmentTracking(token: string) {
  return useQuery({
    queryKey: storeKeys.tracking(token),
    queryFn: () => getShipmentTracking(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useRecordShipmentEvent(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShipmentEventPayload) =>
      recordShipmentEvent(token, payload),
    onSuccess: response => {
      queryClient.setQueryData(storeKeys.tracking(token), response);
      // The order may now be delivered; refresh everything except this screen.
      queryClient.invalidateQueries({
        queryKey: storeKeys.all,
        predicate: query => query.queryKey[1] !== 'tracking',
      });
    },
  });
}
