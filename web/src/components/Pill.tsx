import type { CSSProperties, ReactNode } from "react";

export interface PillProps {
  children: ReactNode;
  className?: string;
  toneClassName?: string;
  size?: "sm" | "md" | "lg";
  style?: CSSProperties;
}

export default function Pill({
  children,
  className = "",
  toneClassName = "",
  size = "sm",
  style,
}: PillProps) {
  const sizeClass =
    size === "sm"
      ? "h-6 min-h-6 px-2 text-[11px]"
      : size === "lg"
        ? "h-8 min-h-8 px-3 text-sm"
        : "h-7 min-h-7 px-2.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-[0.01em] ${sizeClass} ${toneClassName} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
