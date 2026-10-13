import { useDashboard } from "../../hooks/useDashboard";
import {
  PageHeader,
  CenteredLoading,
  ActivityFeedItem,
  AdminPageShell,
} from "../../components";
import {
  LinkIcon,
  ClockIcon,
  CalendarDaysIcon,
  FolderIcon,
  TagIcon,
  PlusIcon,
  Cog6ToothIcon,
  Bars3BottomLeftIcon,
  QueueListIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";
import { formatDate } from "../../utils/date";

const statusItems = [
  {
    key: "total_links",
    label: "链接总数",
    icon: LinkIcon,
    iconColor: "var(--nc-tag-4-text)",
    baseBackground: "var(--nc-tag-4-bg)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
  {
    key: "pending_links",
    label: "待处理",
    icon: ClockIcon,
    iconColor: "var(--nc-tag-4-text)",
    baseBackground: "var(--nc-tag-4-bg)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
  {
    key: "this_week_count",
    label: "本周新增",
    icon: CalendarDaysIcon,
    iconColor: "var(--nc-tag-3-text)",
    baseBackground: "var(--nc-tag-3-bg)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
  {
    key: "this_month_count",
    label: "本月新增",
    icon: CalendarDaysIcon,
    iconColor: "var(--nc-on-primary-soft)",
    baseBackground: "var(--nc-primary-soft)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
  {
    key: "category_count",
    label: "分类",
    icon: FolderIcon,
    iconColor: "var(--nc-tag-2-text)",
    baseBackground: "var(--nc-tag-2-bg)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
  {
    key: "tag_count",
    label: "标签",
    icon: TagIcon,
    iconColor: "var(--nc-tag-1-text)",
    baseBackground: "var(--nc-tag-1-bg)",
    hoverBackground: "var(--nc-raised)",
    borderColor: "var(--nc-border)",
    hoverBorderColor: "var(--nc-border-strong)",
  },
] as const;

const gettingStartedSteps = [
  {
    step: "01",
    title: "配置 AI",
    description: "填入 API Key 和模型，Nutcrack 将自动分析每个链接。",
    href: "/admin/settings/ai",
    icon: Cog6ToothIcon,
  },
  {
    step: "02",
    title: "添加第一个链接",
    description: "粘贴网址后，系统会抓取内容并生成摘要。",
    href: "/admin/add",
    icon: PlusIcon,
  },
  {
    step: "03",
    title: "确认并发布",
    description: "在待处理列表中审核后发布到公开页。",
    href: "/admin/pending",
    icon: ArrowTopRightOnSquareIcon,
  },
] as const;

export default function Overview() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <CenteredLoading>
        <span className="loading loading-spinner loading-lg" />
      </CenteredLoading>
    );
  }

  const isEmpty = !data || data.total_links === 0;

  return (
    <AdminPageShell>
      <div className="space-y-8">
        <PageHeader title="工作台" />

        <section>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {statusItems.map((item) => (
              <div
                key={item.key}
                className="group rounded-lg border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-24px_color-mix(in_srgb,var(--nc-scrim)_18%,transparent)] motion-reduce:transform-none"
                style={
                  {
                    backgroundColor: item.baseBackground,
                    borderColor: item.borderColor,
                  } as CSSProperties
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.hoverBackground;
                  e.currentTarget.style.borderColor = item.hoverBorderColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.baseBackground;
                  e.currentTarget.style.borderColor = item.borderColor;
                }}
              >
                <div className="flex items-center gap-1">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center"
                    style={{ color: item.iconColor }}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 text-sm font-normal leading-none tracking-normal text-nc-muted">
                    {item.label}
                  </div>
                </div>
                <div className="mt-4 text-3xl font-semibold leading-none tabular-nums text-base-content">
                  {data?.[item.key] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </section>

        {isEmpty ? (
          <section className="rounded-xl border border-nc-border bg-base-100 px-5 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
              <Bars3BottomLeftIcon className="h-4 w-4 text-primary" />
              开始使用
            </div>

            <div className="mt-4 space-y-1">
              {gettingStartedSteps.map((item) => (
                <a
                  key={item.step}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-base-200/70"
                >
                  <span className="w-10 shrink-0 text-center text-3xl font-bold leading-none tabular-nums text-nc-muted transition-colors group-hover:text-primary">
                    {item.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-base-content transition-colors group-hover:text-primary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-nc-muted">
                      {item.description}
                    </p>
                  </div>
                  <item.icon className="h-4 w-4 shrink-0 text-nc-muted transition-colors group-hover:text-primary" />
                </a>
              ))}
            </div>
          </section>
        ) : (
          <section className="pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
              <QueueListIcon className="h-4 w-4 text-primary" />
              最近活动
            </div>

            <div className="mt-4">
              {data?.recent_activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-nc-border px-4 py-8 text-center text-sm text-nc-muted">
                  暂无活动记录
                </div>
              ) : (
                data?.recent_activities.map((log) => (
                  <ActivityFeedItem
                    key={log.id}
                    action={log.action}
                    resource={log.resource}
                    status={log.status}
                    timestamp={formatDate(log.created_at)}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}
