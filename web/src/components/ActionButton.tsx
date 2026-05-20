import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ActionTone = "primary" | "neutral" | "danger";

const toneConfig: Record<
  ActionTone,
  {
    className: string;
    style: CSSProperties;
  }
> = {
  primary: {
    className: "text-primary hover:text-primary-focus",
    style: {
      "--action-bg": "color-mix(in srgb, currentColor 10%, transparent)",
      "--action-bg-hover": "color-mix(in srgb, currentColor 22%, transparent)",
    } as CSSProperties,
  },
  neutral: {
    className: "text-base-content/70 hover:text-base-content",
    style: {
      "--action-bg": "color-mix(in srgb, currentColor 10%, transparent)",
      "--action-bg-hover": "color-mix(in srgb, currentColor 22%, transparent)",
    } as CSSProperties,
  },
  danger: {
    className: "text-error/80 hover:text-error",
    style: {
      "--action-bg": "color-mix(in srgb, currentColor 10%, transparent)",
      "--action-bg-hover": "color-mix(in srgb, currentColor 22%, transparent)",
    } as CSSProperties,
  },
};

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  tone?: ActionTone;
  loading?: boolean;
}

export default function ActionButton({
  icon,
  tone = "neutral",
  loading = false,
  className = "",
  children,
  style,
  disabled,
  type = "button",
  ...props
}: ActionButtonProps) {
  const config = toneConfig[tone];

  return (
    <button
      type={type}
      className={`action-button inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 bg-[var(--action-bg)] hover:bg-[var(--action-bg-hover)] ${config.className} ${className}`}
      style={{ ...config.style, ...style }}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className="action-button-content">
        {loading ? (
          <span className="action-button-spinner" aria-hidden="true" />
        ) : icon ? (
          <span className="action-button-icon">{icon}</span>
        ) : null}
        <span className="action-button-label">{children}</span>
      </span>
    </button>
  );
}
