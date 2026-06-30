import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, AvailabilityType, AvailabilityWindow, PartAction, RequestStatus, nextPageParam } from '@walvee/shared';
import { SubmitProposalPayload, categoriesApi, jobReportApi, providerApi } from './api';

export const keys = {
  categories: ['categories'] as const,
  nearby: (radius: number) => ['nearby', radius] as const,
  jobs: ['jobs'] as const,
  bids: ['bids'] as const,
  job: (id: number) => ['job', id] as const,
  availability: ['availability'] as const,
  updates: (id: number) => ['updates', id] as const,
  parts: (id: number) => ['parts', id] as const,
  questions: (id: number) => ['questions', id] as const,
  questionSuggestions: (id: number) => ['question-suggestions', id] as const,
};

export const useQuestions = (id: number) =>
  useQuery({ queryKey: keys.questions(id), queryFn: () => providerApi.questions(id), enabled: !!id });

export const useQuestionSuggestions = (id: number) =>
  useQuery({ queryKey: keys.questionSuggestions(id), queryFn: () => providerApi.questionSuggestions(id), enabled: !!id });

export function useAskQuestion(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { question?: string; suggestion_id?: number }) => providerApi.askQuestion(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.questions(requestId) }),
  });
}

export function useRemoveQuestion(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => providerApi.removeQuestion(questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.questions(requestId) }),
  });
}

export const useCategories = () => useQuery({ queryKey: keys.categories, queryFn: () => categoriesApi.list() });

export const useNearby = (radiusKm: number, enabled = true) =>
  useInfiniteQuery({
    queryKey: keys.nearby(radiusKm),
    queryFn: ({ pageParam }) => providerApi.nearby(radiusKm, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });

export const useScheduled = (radiusKm: number, enabled = true, perPage?: number) =>
  useInfiniteQuery({
    queryKey: ['scheduled', radiusKm, perPage ?? null],
    queryFn: ({ pageParam }) => providerApi.scheduled(radiusKm, pageParam, perPage),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: providerApi.dashboard, staleTime: 30_000 });
export const useWallet = () => useQuery({ queryKey: ['wallet'], queryFn: providerApi.wallet });
export const useWalletTransactions = () =>
  useInfiniteQuery({
    queryKey: ['wallet-transactions'],
    queryFn: ({ pageParam }) => providerApi.walletTransactions(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount?: number) => providerApi.payout(amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
}
export const useMyJobs = () =>
  useInfiniteQuery({
    queryKey: keys.jobs,
    queryFn: ({ pageParam }) => providerApi.myJobs(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
/**
 * Only live jobs (accepted + in_progress). The dashboard/agenda show these and
 * have no scroll, so they must come from a dedicated server-filtered query
 * rather than the paginated all-jobs cache (whose later pages they never load).
 * Keyed under `['jobs', …]` so the existing `keys.jobs` invalidations refetch it.
 */
export const useActiveJobs = () =>
  useInfiniteQuery({
    queryKey: [...keys.jobs, 'active'],
    queryFn: ({ pageParam }) => providerApi.myJobs(pageParam, 'active'),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
export const useMyBids = () =>
  useInfiniteQuery({
    queryKey: keys.bids,
    queryFn: ({ pageParam }) => providerApi.myBids(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
export const useJob = (id: number) =>
  useQuery({
    queryKey: keys.job(id),
    queryFn: () => providerApi.getJob(id),
    enabled: !!id,
    // Don't retry a definitive 404 — show the not-found state immediately.
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });

export const useAvailability = () =>
  useQuery({ queryKey: keys.availability, queryFn: providerApi.getAvailability });

export const useJobReport = (id: number) => {
  const updates = useQuery({ queryKey: keys.updates(id), queryFn: () => jobReportApi.updates(id), enabled: !!id });
  const parts = useQuery({ queryKey: keys.parts(id), queryFn: () => jobReportApi.parts(id), enabled: !!id });
  return { updates, parts };
};

export function useSetOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ online, loc }: { online: boolean; loc?: { latitude: number; longitude: number; accuracy?: number } }) =>
      providerApi.setOnline(online, loc),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useSubmitProposal(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitProposalPayload) => providerApi.submitProposal(requestId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bids });
      // Invalidate by prefix so all radius variants of the feeds refetch.
      qc.invalidateQueries({ queryKey: ['nearby'] });
      qc.invalidateQueries({ queryKey: ['scheduled'] });
      // Refresh the job so landing back on it shows the "proposta enviada" state.
      qc.invalidateQueries({ queryKey: keys.job(requestId) });
    },
  });
}

export function useUpdateStatus(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: RequestStatus) => providerApi.updateStatus(requestId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.job(requestId) });
      qc.invalidateQueries({ queryKey: keys.jobs });
    },
  });
}

export function useStartJob(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => providerApi.startJob(requestId, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.job(requestId) });
      qc.invalidateQueries({ queryKey: keys.jobs });
    },
  });
}

export function useAddUpdate(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => providerApi.addUpdate(requestId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.updates(requestId) }),
  });
}

export function useRequestApproval(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => providerApi.requestApproval(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}

/** Provider records the vehicle odometer during the service (flows to the asset). */
export function useRecordOdometer(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { mileage: number; note?: string }) => providerApi.recordOdometer(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}

export function useAttachJobMedia(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { phase: 'before' | 'after'; media_ids: number[] }) =>
      providerApi.attachJobMedia(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}

export function useAddPart(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (part: { name: string; action: PartAction; quantity?: number; unit_price?: number }) =>
      providerApi.addPart(requestId, part),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.parts(requestId) }),
  });
}

export function useDeletePart(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partId: number) => providerApi.deletePart(partId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.parts(requestId) }),
  });
}

// ── New V5 actions (provider side) ────────────────────────────────
/** Surcharge (acréscimo): provider composes it (form carries amount, reason, photos). */
export function useProposeSurcharge(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => providerApi.proposeSurcharge(requestId, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}

/** Reschedule (R-AGENDA): request / accept / decline. */
export function useRequestReschedule(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: import('./api').ReschedulePayload) => providerApi.requestReschedule(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}
export function useResolveReschedule(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rescheduleId, accept }: { rescheduleId: number; accept: boolean }) =>
      accept ? providerApi.acceptReschedule(rescheduleId) : providerApi.declineReschedule(rescheduleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.job(requestId) }),
  });
}

/** Dispute defense (R5). */
export const useDispute = (requestId: number) =>
  useQuery({ queryKey: ['dispute', requestId], queryFn: () => providerApi.getDispute(requestId), enabled: !!requestId });
export function useFileDisputeDefense(requestId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, form }: { disputeId: number; form: FormData }) =>
      providerApi.fileDisputeDefense(disputeId, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispute', requestId] }),
  });
}

export function useSetCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => providerApi.setCategories(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, windows }: { type: AvailabilityType; windows: AvailabilityWindow[] }) =>
      providerApi.setAvailability(type, windows),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.availability }),
  });
}
