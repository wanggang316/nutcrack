import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 flex items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-base-content/50">{subtitle}</p>
        )}
      </div>
      {actions || action ? (
        <div className="flex gap-2">{actions || action}</div>
      ) : null}
    </div>
  );
}
