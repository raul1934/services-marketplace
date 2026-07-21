import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, nextPageParam } from '@chamafacil/shared';
import { assetsApi, categoriesApi, customerApi, CreateAssetPayload, CreateRequestPayload, ProposalSort, RequestStatusFilter, jobReportApi, notificationsApi, vehicleCatalogApi, propertyTypesApi, petSpeciesApi, AddReadingPayload, AssetDetailInput } from './api';
import { PickedPhoto, uploadPhotos } from './photos';

export const keys = {
  categories: ['categories'] as const,
  myRequests: ['requests'] as const,
  myRequestsList: (status?: RequestStatusFilter) => ['requests', status ?? 'all'] as const,
  request: (id: number) => ['request', id] as const,
  events: (id: number) => ['events', id] as const,
  proposals: (id: number, sort: ProposalSort) => ['proposals', id, sort] as const,
  tracking: (id: number) => ['tracking', id] as const,
  updates: (id: number) => ['updates', id] as const,
  parts: (id: number) => ['parts', id] as const,
  questions: (id: number) => ['questions', id] as const,
};

export const useQuestions = (id: number) =>
  useQuery({ queryKey: keys.questions(id), queryFn: () => customerApi.questions(id), enabled: !!id });

export function useAnswerQuestion(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, answer, photo }: { questionId: number; answer: string; photo?: PickedPhoto }) => {
      // Upload-first: upload the photo (if any), then answer with its media id.
      const media = photo ? await uploadPhotos([photo]) : [];
      return customerApi.answerQuestion(questionId, answer, media.map((m) => m.id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.questions(requestId) }),
  });
}

export const useCategories = (type?: string) =>
  useQuery({ queryKey: [...keys.categories, type], queryFn: () => categoriesApi.list(type) });

export const useAssets = (type?: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['assets', type],
    queryFn: ({ pageParam }) => assetsApi.list(type, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => assetsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

/** Don't retry a definitive 404 (so the not-found state shows immediately). */
const retryUnless404 = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status === 404) && count < 1;

export const useAsset = (id: number) =>
  useQuery({ queryKey: ['asset', id], queryFn: () => assetsApi.get(id), enabled: !!id, retry: retryUnless404 });

export function useUpdateAsset(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nickname?: string; detail?: AssetDetailInput; photo_media_id?: number }) => assetsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useArchiveAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assetsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

/** Seeded catalogs — small reference sets, cached aggressively. */
const DAY = 24 * 60 * 60 * 1000;
export const useVehicleMakes = (enabled = true) =>
  useQuery({ queryKey: ['vehicle-makes'], queryFn: () => vehicleCatalogApi.makes(), staleTime: DAY, enabled });
export const usePropertyTypes = (enabled = true) =>
  useQuery({ queryKey: ['property-types'], queryFn: () => propertyTypesApi.list(), staleTime: DAY, enabled });
export const usePetSpecies = (enabled = true) =>
  useQuery({ queryKey: ['pet-species'], queryFn: () => petSpeciesApi.list(), staleTime: DAY, enabled });

/** The asset's consolidated service history (R6 — "Carfax do ativo"). */
export const useAssetHistory = (id: number, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['asset-history', id],
    queryFn: ({ pageParam }) => assetsApi.history(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: !!id && enabled,
  });

/** The asset's odometer reading history (vehicles). */
export const useAssetReadings = (id: number, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['asset-readings', id],
    queryFn: ({ pageParam }) => assetsApi.readings(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: !!id && enabled,
  });

export function useAddReading(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddReadingPayload) => assetsApi.addReading(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] });
      qc.invalidateQueries({ queryKey: ['asset-readings', id] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

/** The property's named parts (rooms/areas) with their AR measurements. */
export const useAssetParts = (id: number, enabled = true) =>
  useQuery({ queryKey: ['asset-parts', id], queryFn: () => assetsApi.parts(id), enabled: !!id && enabled });

export function useAddPart(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => assetsApi.addPart(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-parts', id] }),
  });
}

/** Adds every ticked suggestion chip in one request. */
export function useAddParts(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => assetsApi.addParts(id, names),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-parts', id] }),
  });
}

export function useUpdatePart(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partId, ...payload }: { partId: number; name?: string; area?: number; perimeter?: number; points_count?: number }) =>
      assetsApi.updatePart(id, partId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-parts', id] }),
  });
}

export function useRemovePart(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partId: number) => assetsApi.removePart(id, partId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-parts', id] }),
  });
}

/**
 * The customer's requests, optionally narrowed to a status bucket server-side.
 * The bucket is part of the query key (under the `keys.myRequests` prefix, so
 * every existing invalidation still hits all of them) and each bucket keeps its
 * own page cursor — the filter can't be applied to already-loaded pages without
 * lying about how many results there are.
 */
export const useMyRequests = (status?: RequestStatusFilter) =>
  useInfiniteQuery({
    queryKey: keys.myRequestsList(status),
    queryFn: ({ pageParam }) => customerApi.myRequests(pageParam, status),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

export const useRequest = (id: number) =>
  useQuery({ queryKey: keys.request(id), queryFn: () => customerApi.getRequest(id), enabled: !!id, retry: retryUnless404 });

export const useRequestEvents = (id: number) =>
  useQuery({ queryKey: keys.events(id), queryFn: () => customerApi.events(id), enabled: !!id });

export const useProposals = (id: number, sort: ProposalSort) =>
  useInfiniteQuery({
    queryKey: keys.proposals(id, sort),
    queryFn: ({ pageParam }) => customerApi.proposals(id, sort, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: !!id,
  });

// Fetches the provider's location ONCE for the initial map position; live updates
// thereafter come from the Reverb socket (`onLocation`), not a poll.
export const useTracking = (id: number, enabled: boolean) =>
  useQuery({
    queryKey: keys.tracking(id),
    queryFn: () => customerApi.providerLocation(id),
    enabled,
  });

export const useJobReport = (id: number) => {
  const updates = useQuery({ queryKey: keys.updates(id), queryFn: () => jobReportApi.updates(id), enabled: !!id });
  const parts = useQuery({ queryKey: keys.parts(id), queryFn: () => jobReportApi.parts(id), enabled: !!id });
  return { updates, parts };
};

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => customerApi.createRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.myRequests }),
  });
}

export function useAcceptProposal(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: number) => customerApi.acceptProposal(proposalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      qc.invalidateQueries({ queryKey: keys.myRequests });
      // The screen morphs into the accepted state in place — refresh the feed so
      // it shows proposal_accepted + the approved value without waiting on a socket.
      qc.invalidateQueries({ queryKey: keys.events(requestId) });
    },
  });
}

export function useDeclineProposal(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: number) => customerApi.declineProposal(proposalId),
    onSuccess: () => {
      // Partial key — matches every sort variant of this request's proposals.
      qc.invalidateQueries({ queryKey: ['proposals', requestId] });
    },
  });
}

export function useCounterProposal(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { proposalId: number; price: number; message?: string }) =>
      customerApi.counterProposal(payload.proposalId, { price: payload.price, message: payload.message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', requestId] });
    },
  });
}

export function useApproveParts(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => customerApi.approveParts(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      qc.invalidateQueries({ queryKey: keys.parts(requestId) });
    },
  });
}

export function useApprovePart(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobPartId: number) => jobReportApi.approvePart(jobPartId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.parts(requestId) }),
  });
}

export function useCancelRequest(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => customerApi.cancelRequest(requestId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      qc.invalidateQueries({ queryKey: keys.myRequests });
    },
  });
}

export function useSubmitReview(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string; tags?: string[]; tip_amount?: number }) =>
      customerApi.submitReview(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.request(requestId) }),
  });
}

// ── New V5 actions ────────────────────────────────────────────────
const refreshRequest = (qc: ReturnType<typeof useQueryClient>, requestId: number) => {
  qc.invalidateQueries({ queryKey: keys.request(requestId) });
  qc.invalidateQueries({ queryKey: keys.myRequests });
};

/** Surcharge (acréscimo): client approves or refuses. */
export function useResolveSurcharge(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surchargeId, approve }: { surchargeId: number; approve: boolean }) =>
      approve ? customerApi.approveSurcharge(surchargeId) : customerApi.refuseSurcharge(surchargeId),
    onSuccess: () => refreshRequest(qc, requestId),
  });
}

/** Re-cotação (C40): accept the present provider's new quote, or reopen. */
export function useRequoteDecision(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reopen, description }: { reopen: boolean; description?: string }) =>
      reopen ? customerApi.reopenRequote(requestId, description) : customerApi.acceptRequote(requestId),
    onSuccess: () => refreshRequest(qc, requestId),
  });
}

/** Reschedule (R-AGENDA): request / accept / decline. */
export function useRequestReschedule(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: import('./api').ReschedulePayload) => customerApi.requestReschedule(requestId, payload),
    onSuccess: () => refreshRequest(qc, requestId),
  });
}
export function useResolveReschedule(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rescheduleId, accept }: { rescheduleId: number; accept: boolean }) =>
      accept ? customerApi.acceptReschedule(rescheduleId) : customerApi.declineReschedule(rescheduleId),
    onSuccess: () => refreshRequest(qc, requestId),
  });
}

/** No-show (C35): reopen at no cost. */
export function useReportNoShow(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => customerApi.reportNoShow(requestId, reason),
    onSuccess: () => refreshRequest(qc, requestId),
  });
}

/** Dispute (C37/C38). */
export const useDispute = (id: number) =>
  useQuery({ queryKey: ['dispute', id], queryFn: () => customerApi.getDispute(id), enabled: !!id });
export function useOpenDispute(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => customerApi.openDispute(requestId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispute', requestId] });
      refreshRequest(qc, requestId);
    },
  });
}

/** Warranty / garantia (C41/C42). */
export const useWarrantyClaims = (id: number) =>
  useQuery({ queryKey: ['warranty', id], queryFn: () => customerApi.warrantyClaims(id), enabled: !!id });
export function useOpenWarranty(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    // Upload-first, like the Q&A answers: the photos become media rows, then the
    // claim is opened referencing their ids. Keeps the claim request small and
    // lets a failed upload surface before anything is created.
    mutationFn: async (payload: { type: 'redo' | 'refund'; description?: string; photos?: PickedPhoto[] }) => {
      const uploaded = payload.photos?.length ? await uploadPhotos(payload.photos) : [];

      return customerApi.openWarranty(requestId, {
        type: payload.type,
        description: payload.description,
        media_ids: uploaded.map((m) => m.id),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warranty', requestId] }),
  });
}

// ── Notifications (the bell) ───────────────────────────────────────────────

export const useNotifications = () =>
  useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

/** Feeds the bell's badge. Polled loosely; the socket will make this exact. */
export const useUnreadCount = () =>
  useQuery({ queryKey: ['unread-count'], queryFn: () => notificationsApi.unreadCount() });

/** Both mutations refresh the list and the badge — they always move together. */
function useNotificationMutation<T>(fn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export const useMarkNotificationRead = () => useNotificationMutation((id: string) => notificationsApi.markRead(id));
// void, not an inferred unknown — otherwise `mutate()` demands an argument.
export const useMarkAllNotificationsRead = () => useNotificationMutation<void>(() => notificationsApi.markAllRead());
