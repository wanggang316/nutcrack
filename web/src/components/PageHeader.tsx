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
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-base-content/50 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions || action ? (
        <div className="flex gap-2">{actions || action}</div>
      ) : null}
    </div>
  );
}
