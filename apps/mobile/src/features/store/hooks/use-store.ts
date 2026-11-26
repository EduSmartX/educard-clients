import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  AddCartItemPayload,
  AdoptIdCardDesignPayload,
  CatalogQueryParams,
  ClassLookPayload,
  OrderQueryParams,
  OrderStatus,
  PlaceOrderPayload,
  ProductCustomizationPayload,
  ProofDecisionPayload,
  ProofStatus,
  ShipmentEventPayload,
  SubmissionQueryParams,
} from '@educard/shared';

import {
  addCartItem,
  addProductPhoto,
  adoptIdCardDesign,
  clearCart,
  decideProof,
  getBookSets,
  getCardPreview,
  getCart,
  getCatalog,
  getIdCardDesigns,
  getIdCardStatus,
  getIdCardTemplates,
  getOrderFilterOptions,
  getOrders,
  getProductLooks,
  getProofDetail,
  getProofs,
  getPublicShipment,
  getShipmentTracking,
  getStudentCard,
  placeOrder,
  recordShipmentEvent,
  removeCartItem,
  removeProductPhoto,
  saveClassLook,
  saveProductCustomization,
  setPrimaryProductPhoto,
  unpublishProduct,
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
    // No params = the ['store', 'orders'] prefix, so invalidating it refreshes every
    // order list (filtered or not, paged or not).
    params
      ? ([...storeKeys.all, 'orders', params] as const)
      : ([...storeKeys.all, 'orders'] as const),
  orderPages: (params?: OrderQueryParams) =>
    [...storeKeys.all, 'orders', 'pages', params ?? {}] as const,
  orderFilters: () => [...storeKeys.all, 'orders', 'filters'] as const,
  idCardTemplates: (params?: SubmissionQueryParams) =>
    [...storeKeys.all, 'id-card-templates', params] as const,
  bookSets: (params?: SubmissionQueryParams) =>
    [...storeKeys.all, 'book-sets', params] as const,
  tracking: (token: string) => [...storeKeys.all, 'tracking', token] as const,
  designs: () => [...storeKeys.all, 'id-card-designs'] as const,
  looks: (publicId: string) => [...storeKeys.all, 'looks', publicId] as const,
  cardPreview: (path: string, student?: string) =>
    [...storeKeys.all, 'card-preview', path, student ?? ''] as const,
  proofs: (status?: ProofStatus) =>
    [...storeKeys.all, 'proofs', status ?? ''] as const,
  proof: (publicId: string) =>
    [...storeKeys.all, 'proofs', 'detail', publicId] as const,
  studentCard: (studentId: string) =>
    [...storeKeys.all, 'student-card', studentId] as const,
  idCardStatus: () => [...storeKeys.all, 'id-card-status'] as const,
  publicShipment: (token: string) =>
    [...storeKeys.all, 'public-shipment', token] as const,
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

/** The order list with filters, a page at a time (load more on scroll). */
export function useOrderPages(params: OrderQueryParams) {
  return useInfiniteQuery({
    queryKey: storeKeys.orderPages(params),
    queryFn: ({ pageParam }) => getOrders({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination?.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    select: data => ({
      items: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.pagination?.count ?? 0,
    }),
    // Keep the current list on screen while new filters load.
    placeholderData: previous => previous,
  });
}

/** Statuses and the products this school has ordered, for the order filters. */
export function useOrderFilterOptions() {
  return useQuery({
    queryKey: storeKeys.orderFilters(),
    queryFn: getOrderFilterOptions,
    staleTime: 5 * 60 * 1000,
    select: response => response.data,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicId,
      status,
      reason,
    }: {
      publicId: string;
      status: OrderStatus;
      reason?: string;
    }) => updateOrderStatus(publicId, { status, reason }),
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
      classPublicIds,
    }: {
      name: string;
      image: UploadFile;
      /** Empty = whole school; otherwise one template per chosen class. */
      classPublicIds?: string[];
    }) => uploadIdCardTemplate(name, image, classPublicIds),
  );
}

export function useSaveProductCustomization(publicId: string) {
  return useStoreMutation((payload: ProductCustomizationPayload) =>
    saveProductCustomization(publicId, payload),
  );
}

export function useUnpublishProduct(publicId: string) {
  return useStoreMutation(() => unpublishProduct(publicId));
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

// ── ID card proofs and a student's card ─────────────────────────────────────

export function useProofs(status?: ProofStatus) {
  return useQuery({
    queryKey: storeKeys.proofs(status),
    queryFn: () => getProofs(status),
  });
}

export function useProofDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: storeKeys.proof(publicId ?? ''),
    queryFn: () => getProofDetail(publicId as string),
    enabled: Boolean(publicId),
  });
}

export function useDecideProof(publicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProofDecisionPayload) =>
      decideProof(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...storeKeys.all, 'proofs'] });
      queryClient.invalidateQueries({ queryKey: storeKeys.proof(publicId) });
      queryClient.invalidateQueries({ queryKey: storeKeys.orders() });
    },
  });
}

export function useStudentCard(studentId: string | undefined) {
  return useQuery({
    queryKey: storeKeys.studentCard(studentId ?? ''),
    queryFn: () => getStudentCard(studentId as string),
    enabled: Boolean(studentId),
    retry: false,
  });
}

/**
 * Whether the school has an approved ID card design. "ID Card Review" stays hidden
 * until it does. Only school admins and teachers can ask (`enabled`).
 */
export function useIdCardStatus(enabled = true) {
  return useQuery({
    queryKey: storeKeys.idCardStatus(),
    queryFn: getIdCardStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
    select: response => response.data?.has_approved_design ?? false,
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
    ({
      image,
      classPublicIds,
    }: {
      image: UploadFile;
      /** Empty = whole school; several classes share one upload. */
      classPublicIds?: string[];
    }) => addProductPhoto(publicId, image, classPublicIds),
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

/** A shipment opened from its QR code; works signed in or not. */
export function usePublicShipment(token: string) {
  return useQuery({
    queryKey: storeKeys.publicShipment(token),
    queryFn: () => getPublicShipment(token),
    enabled: Boolean(token),
    retry: false,
  });
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
