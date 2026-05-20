import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, publicApi } from "../utils/api";
import type {
  Link,
  AdminLinksQuery,
  LinksQuery,
  LinkProcessingStreamEvent,
} from "@nutcrack/shared";

export function usePublicLinks(query: LinksQuery) {
  return useQuery({
    queryKey: ["public-links", query],
    queryFn: () => publicApi.getLinks(query),
  });
}

export function useAdminLinks(query: AdminLinksQuery) {
  return useQuery({
    queryKey: ["admin-links", query],
    queryFn: () => adminApi.getLinks(query),
  });
}

export function usePendingLinks(query: LinksQuery) {
  return useQuery({
    queryKey: ["pending-links", query],
    queryFn: () =>
      adminApi.getPendingLinks({
        page: query.page,
        page_size: query.page_size,
      }),
  });
}

export function useLinkDetail(id: string) {
  return useQuery({
    queryKey: ["link", id],
    queryFn: () => adminApi.getLink(id),
    enabled: !!id,
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => adminApi.createLink(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
    },
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      adminApi.updateLink(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
    },
  });
}

export function usePublishLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.publishLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
      qc.invalidateQueries({ queryKey: ["public-links"] });
    },
  });
}

export function useArchiveLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.archiveLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["public-links"] });
    },
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
      qc.invalidateQueries({ queryKey: ["public-links"] });
    },
  });
}

export function useBatchPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => adminApi.batchPublishLinks(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
      qc.invalidateQueries({ queryKey: ["public-links"] });
    },
  });
}

export function useBatchDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => adminApi.batchDeleteLinks(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
    },
  });
}

export function useReprocessLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reprocessLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
    },
  });
}

export function useReanalyzeLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reprocessLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["pending-links"] });
      qc.invalidateQueries({ queryKey: ["link"] });
    },
  });
}

export function useCreateLinkStreaming() {
  const qc = useQueryClient();

  const createStreaming = async (
    url: string,
    onEvent: (event: LinkProcessingStreamEvent) => void,
  ): Promise<void> => {
    await adminApi.createLinkStream(url, onEvent);
    qc.invalidateQueries({ queryKey: ["admin-links"] });
    qc.invalidateQueries({ queryKey: ["pending-links"] });
  };

  return { createStreaming };
}
