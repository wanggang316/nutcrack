import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, publicApi } from "../utils/api";
import type { Category } from "@nutcrack/shared";

export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: () => publicApi.getCategories(),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminApi.getCategories(),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; icon?: string }) =>
      adminApi.createCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      sort_order?: number;
    }) => adminApi.updateCategory(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
    },
  });
}
