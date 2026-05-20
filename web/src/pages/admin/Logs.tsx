import { useState } from "react";
import { useActivityLogs } from "../../hooks/useActivityLogs";
import {
  PageHeader,
  EmptyStates,
  ActivityFeedItem,
  Pagination,
  Pill,
  AdminPageShell,
} from "../../components";
import { formatDate } from "../../utils/date";

export default function Logs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActivityLogs({ page, page_size: 20 });

  return (
    <AdminPageShell>
      <PageHeader title="活动日志" />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          <div>
            {data?.items.length === 0 && <EmptyStates.NoLogs />}
            {data?.items.map((log) => (
              <ActivityFeedItem
                key={log.id}
                action={log.action}
                resource={log.resource}
                status={log.status}
                timestamp={formatDate(log.created_at)}
                meta={
                  <>
                    {log.duration ? (
                      <Pill size="sm">{`${log.duration}ms`}</Pill>
                    ) : null}
                    {log.ip ? <Pill size="sm">{log.ip}</Pill> : null}
                  </>
                }
              />
            ))}
          </div>

          {data && data.pagination.total_pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              maxVisible={10}
              size="sm"
              className="mt-6"
            />
          )}
        </>
      )}
    </AdminPageShell>
  );
}
