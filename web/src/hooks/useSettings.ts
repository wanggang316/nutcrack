import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../utils/api";
import type { AiSettings } from "@nutcrack/shared";

export function useAiSettings() {
  return useQuery({
    queryKey: ["ai-settings"],
    queryFn: () => adminApi.getAiSettings(),
  });
}

export function useUpdateAiSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<AiSettings>) => adminApi.updateAiSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
    },
  });
}
