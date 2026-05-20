import type { ReactNode } from "react";

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const shellClassName =
  "min-h-[calc(100dvh-4.5rem)] overflow-hidden lg:h-[calc(100vh-0.75rem)] lg:min-h-0";

const surfaceClassName =
  "h-full min-h-0 overflow-y-auto rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]";

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
