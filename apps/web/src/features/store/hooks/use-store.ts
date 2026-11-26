import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QueryKeys,
  type AddCartItemPayload,
  type AdoptIdCardDesignPayload,
  type ClassLookPayload,
  type BookSetPayload,
  type CatalogQueryParams,
  type OrderQueryParams,
  type PlaceOrderPayload,
  type ProofDecisionPayload,
  type ProofStatus,
  type ProductCustomizationPayload,
  type ShipmentEventPayload,
  type SubmissionQueryParams,
  type SubmitIdCardTemplatePayload,
  type UpdateOrderStatusPayload,
} from '@educard/shared';
import {
  addCartItem,
  addProductPhoto,
  adoptIdCardDesign,
  decideProof,
  fetchCardPreview,
  fetchProofDetail,
  fetchProofs,
  fetchStudentCard,
  fetchIdCardStatus,
  fetchIdCardDesigns,
  fetchProductLooks,
  removeProductPhoto,
  saveClassLook,
  saveProductCustomization,
  unpublishProduct,
  setPrimaryProductPhoto,
  clearCart,
  fetchBookSets,
  fetchCart,
  fetchCatalog,
  fetchIdCardTemplates,
  fetchOrderDetail,
  fetchOrderFilterOptions,
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
    // Keep the current list on screen while a new filter or page loads.
    placeholderData: (previous) => previous,
  });
}

/** Statuses and ordered products for the order filters. */
export function useOrderFilterOptions() {
  return useQuery({
    queryKey: QueryKeys.STORE.ORDER_FILTERS,
    queryFn: fetchOrderFilterOptions,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data,
  });
}

export function useProofs(status?: ProofStatus) {
  return useQuery({
    queryKey: QueryKeys.STORE.PROOFS({ status }),
    queryFn: () => fetchProofs(status),
    refetchOnMount: 'always',
  });
}

export function useProofDetail(publicId: string) {
  return useQuery({
    queryKey: QueryKeys.STORE.PROOF_DETAIL(publicId),
    queryFn: () => fetchProofDetail(publicId),
    enabled: Boolean(publicId),
  });
}

export function useDecideProof(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProofDecisionPayload) => decideProof(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'proofs'] });
    },
  });
}

/** The card a student prints with, rendered from the school's approved design. */
export function useStudentCard(studentId: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.STORE.STUDENT_CARD(studentId ?? ''),
    queryFn: () => fetchStudentCard(studentId as string),
    enabled: Boolean(studentId),
  });
}

/**
 * Whether the school has an approved ID card design. "ID Card Review" stays hidden until
 * it does. Only school admins and teachers can ask (`enabled`).
 */
export function useIdCardStatus(enabled = true) {
  return useQuery({
    queryKey: QueryKeys.STORE.ID_CARD_STATUS,
    queryFn: fetchIdCardStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data?.has_approved_design ?? false,
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
    mutationFn: ({ publicId, ...payload }: { publicId: string } & UpdateOrderStatusPayload) =>
      updateOrderStatus(publicId, payload),
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

export function useSaveProductCustomization(publicId: string) {
  return useStoreMutation((payload: ProductCustomizationPayload) =>
    saveProductCustomization(publicId, payload)
  );
}

export function useUnpublishProduct(publicId: string) {
  return useStoreMutation(() => unpublishProduct(publicId));
}

export function useIdCardDesigns(product?: string) {
  return useQuery({
    queryKey: [...QueryKeys.STORE.ID_CARD_DESIGNS, product ?? ''],
    queryFn: () => fetchIdCardDesigns(product),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdoptIdCardDesign() {
  return useStoreMutation((payload: AdoptIdCardDesignPayload) => adoptIdCardDesign(payload));
}

/**
 * Object URL for a rendered card PNG (auth-protected, so it cannot be a plain <img src>).
 * The URL is revoked when the preview changes or the component unmounts.
 */
export function useCardPreview(path: string | undefined, student?: string) {
  const query = useQuery({
    queryKey: QueryKeys.STORE.CARD_PREVIEW(path ?? '', student),
    queryFn: () => fetchCardPreview(path as string, student),
    enabled: Boolean(path),
    staleTime: 5 * 60 * 1000,
  });
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    if (!query.data) {
      setUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);
  return { url, isLoading: query.isLoading, isError: query.isError };
}

export function useProductLooks(publicId: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.STORE.LOOKS(publicId ?? ''),
    queryFn: () => fetchProductLooks(publicId as string),
    enabled: Boolean(publicId),
  });
}

export function useSaveClassLook(publicId: string) {
  return useStoreMutation((payload: ClassLookPayload) => saveClassLook(publicId, payload));
}

export function useAddProductPhoto(publicId: string) {
  return useStoreMutation(
    ({
      image,
      ...options
    }: {
      image: File;
      class_public_id?: string;
      class_public_ids?: string[];
      caption?: string;
      is_primary?: boolean;
    }) => addProductPhoto(publicId, image, options)
  );
}

export function useSetPrimaryProductPhoto(publicId: string) {
  return useStoreMutation((photoId: string) => setPrimaryProductPhoto(publicId, photoId));
}

export function useRemoveProductPhoto(publicId: string) {
  return useStoreMutation((photoId: string) => removeProductPhoto(publicId, photoId));
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
