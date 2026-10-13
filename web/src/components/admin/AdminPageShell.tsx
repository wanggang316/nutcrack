import type { ReactNode } from "react";

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const shellClassName =
  "min-h-[calc(100dvh-4.5rem)] overflow-hidden lg:h-[calc(100vh-0.75rem)] lg:min-h-0";

const surfaceClassName =
  "h-full min-h-0 overflow-y-auto rounded-2xl border border-nc-border bg-nc-surface p-4 shadow-[0_1px_2px_color-mix(in_srgb,var(--nc-scrim)_3%,transparent)]";

export default function AdminPageShell({
  children,
  className = "",
  contentClassName = "",
}: AdminPageShellProps) {
  return (
    <div className={`${shellClassName} ${className}`.trim()}>
      <section className={surfaceClassName}>
        <div className={contentClassName}>{children}</div>
      </section>
    </div>
  );
}
