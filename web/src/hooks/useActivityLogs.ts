import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../utils/api";
import type { ActivityLogsResponse } from "@nutcrack/shared";

export function useActivityLogs(query: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ["activity-logs", query],
    queryFn: () => adminApi.getActivityLogs(query),
  });
}
