import type { ReactNode } from "react";

interface MonthSectionProps {
  month: string;
  count: number;
  children: ReactNode;
}

export default function MonthSection({
  month,
  count,
  children,
}: MonthSectionProps) {
  return (
    <div className="mb-10">
      <MonthHeader month={month} count={count} />
      <div>{children}</div>
    </div>
  );
}

export function MonthHeader({
  month,
  count,
}: {
  month: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-widest shrink-0">
        {month}
      </h2>
      <span className="text-xs text-base-content/30">{count}</span>
      <div className="flex-1 border-t border-base-200" />
    </div>
  );
}
