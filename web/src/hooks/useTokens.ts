import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../utils/api";

export function useTokens() {
  return useQuery({
    queryKey: ["tokens"],
    queryFn: () => adminApi.getTokens(),
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => adminApi.createToken(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

export function useDeleteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

export function useDisableToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.disableToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

export function useEnableToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.enableToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}
