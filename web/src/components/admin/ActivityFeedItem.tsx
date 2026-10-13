import type { ReactNode } from "react";
import Pill from "../Pill";

type ActivityStatus = "success" | "failed" | "pending";

function ActivityPill({ status }: { status: ActivityStatus }) {
  const config =
    status === "success"
      ? {
          toneClassName: "text-nc-tag-3-text",
          style: {
            backgroundColor: "var(--nc-tag-3-bg)",
            borderColor: "var(--nc-border)",
          },
          label: "成功",
        }
      : status === "failed"
        ? {
            toneClassName: "text-nc-tag-1-text",
            style: {
              backgroundColor: "var(--nc-tag-1-bg)",
              borderColor: "var(--nc-border)",
            },
            label: "失败",
          }
        : {
            toneClassName: "text-nc-tag-2-text",
            style: {
              backgroundColor: "var(--nc-tag-2-bg)",
              borderColor: "var(--nc-border)",
            },
            label: "待处理",
          };

  return (
    <Pill size="sm" toneClassName={config.toneClassName} style={config.style}>
      {config.label}
    </Pill>
  );
}

export interface ActivityFeedItemProps {
  action: string;
  resource?: string | null;
  status: ActivityStatus;
  timestamp: string;
  meta?: ReactNode;
}

export default function ActivityFeedItem({
  action,
  resource,
  status,
  timestamp,
  meta,
}: ActivityFeedItemProps) {
  return (
    <div className="border-b border-nc-border px-4 py-3 text-sm transition-colors duration-200 last:border-b-0 hover:bg-primary/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <span className="shrink-0 text-nc-muted">{action}</span>
          {resource ? (
            <span className="min-w-0 flex-1 truncate text-nc-muted">
              {resource}
            </span>
          ) : (
            <span className="flex-1 sm:hidden" />
          )}
          <div className="sm:hidden">
            <ActivityPill status={status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-nc-muted sm:ml-auto sm:shrink-0">
          <span>{timestamp}</span>
          {meta}
        </div>
        <div className="hidden sm:block">
          <ActivityPill status={status} />
        </div>
      </div>
    </div>
  );
}
