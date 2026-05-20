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
    <div className={`text-center py-16 ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center text-base-content/20">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-base-content/50">{title}</p>
      {description && (
        <p className="text-sm text-base-content/35 mt-1.5 max-w-xs mx-auto leading-relaxed">
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
