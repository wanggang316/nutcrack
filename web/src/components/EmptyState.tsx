interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "暂无内容",
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`py-16 text-center ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600 [&>svg]:h-7 [&>svg]:w-7">
          {icon}
        </div>
      )}
      <p className="font-display text-lg text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/45">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const EmptyStates = {
  NoLinks: () => (
    <EmptyState
      title="还没有已发布的链接"
      description="添加链接后，经 AI 分析和人工确认，即可在此展示"
      action={
        <a href="/admin/add" className="btn btn-primary btn-sm rounded-lg">
          添加第一个链接
        </a>
      }
    />
  ),

  NoPendingLinks: () => (
    <EmptyState
      title="没有待处理的链接"
      description="所有链接已处理完毕，或者还没有添加任何链接"
      action={
        <a href="/admin/add" className="btn btn-sm btn-ghost rounded-lg">
          添加链接
        </a>
      }
    />
  ),

  NoData: () => <EmptyState title="暂无数据" />,

  NoLogs: () => (
    <EmptyState title="暂无日志" description="操作记录将在这里显示" />
  ),

  NoTokens: () => (
    <EmptyState
      title="还没有 API Token"
      description="创建 Token 后，可通过 CLI 或外部工具向 Nutcrack 添加链接"
      action={
        <a
          href="/admin/settings/token"
          className="btn btn-sm btn-ghost rounded-lg"
        >
          创建 Token
        </a>
      }
    />
  ),
};
