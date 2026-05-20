import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../utils/api";
import type { DashboardData } from "@nutcrack/shared";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });
}
