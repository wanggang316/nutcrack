import type {
  LinkStatus,
  ProcessingStatus,
  ActivityStatus,
  TokenStatus,
} from "@nutcrack/shared";
import type { CSSProperties } from "react";
import Pill from "./Pill";

const linkStatusConfig: Record<
  LinkStatus,
  { label: string; toneClass: string; style: CSSProperties }
> = {
  pending: {
    label: "待处理",
    toneClass: "text-[#8A6A00]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  published: {
    label: "已发布",
    toneClass: "text-[#42624E]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  archived: {
    label: "已归档",
    toneClass: "text-base-content/55",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 9%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 10%, transparent)",
    },
  },
  deleted: {
    label: "已删除",
    toneClass: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
};

const processingStatusConfig: Record<
  ProcessingStatus,
  { label: string; toneClass: string; style: CSSProperties }
> = {
  queued: {
    label: "排队中",
    toneClass: "text-base-content/50",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 9%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 10%, transparent)",
    },
  },
  fetching: {
    label: "抓取中",
    toneClass: "text-[#C99300]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  analyzing: {
    label: "分析中",
    toneClass: "text-[#8A6A00]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  completed: {
    label: "已完成",
    toneClass: "text-primary/85",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  failed: {
    label: "失败",
    toneClass: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
};

const activityStatusConfig: Record<
  ActivityStatus,
  { label: string; toneClass: string; style: CSSProperties }
> = {
  success: {
    label: "成功",
    toneClass: "text-[#42624E]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  failed: {
    label: "失败",
    toneClass: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
  pending: {
    label: "待处理",
    toneClass: "text-[#8A6A00]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
};

const tokenStatusConfig: Record<
  TokenStatus,
  { label: string; toneClass: string; style: CSSProperties }
> = {
  active: {
    label: "启用",
    toneClass: "text-[#42624E]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  disabled: {
    label: "禁用",
    toneClass: "text-[#8A6A00]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  expired: {
    label: "过期",
    toneClass: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
};

export interface StatusBadgeProps {
  status: LinkStatus | ProcessingStatus | ActivityStatus | TokenStatus;
  type?: "link" | "processing" | "activity" | "token";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatusBadge({
  status,
  type = "link",
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  let config: { label: string; toneClass: string; style: CSSProperties };

  switch (type) {
    case "processing":
      config = processingStatusConfig[status as ProcessingStatus];
      break;
    case "activity":
      config = activityStatusConfig[status as ActivityStatus];
      break;
    case "token":
      config = tokenStatusConfig[status as TokenStatus];
      break;
    default:
      config = linkStatusConfig[status as LinkStatus];
  }

  return (
    <Pill
      size={size}
      className={className}
      toneClassName={config.toneClass}
      style={config.style}
    >
      {config.label}
    </Pill>
  );
}

export function LinkStatusBadge(props: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge {...props} type="link" />;
}

export function ProcessingStatusBadge(props: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge {...props} type="processing" />;
}

export function ActivityStatusBadge(props: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge {...props} type="activity" />;
}

export function TokenStatusBadge(props: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge {...props} type="token" />;
}

export function getLinkStatusLabel(status: LinkStatus): string {
  return linkStatusConfig[status].label;
}

export function getProcessingStatusLabel(status: ProcessingStatus): string {
  return processingStatusConfig[status].label;
}

export function getActivityStatusLabel(status: ActivityStatus): string {
  return activityStatusConfig[status].label;
}

export function getTokenStatusLabel(status: TokenStatus): string {
  return tokenStatusConfig[status].label;
}
