interface LogoProps {
  variant?: "default" | "small" | "large";
  className?: string;
  showText?: boolean;
}

const SIZES = {
  small: { px: 22, textClass: "text-base" },
  default: { px: 28, textClass: "text-lg" },
  large: { px: 36, textClass: "text-xl" },
} as const;

export default function Logo({
  variant = "default",
  className = "",
  showText = true,
}: LogoProps) {
  const { px, textClass } = SIZES[variant];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        width={px}
        height={px}
        alt="Nutcrack"
        loading="eager"
        decoding="async"
        className="shrink-0"
        style={{ width: px, height: px }}
      />
      {showText && (
        <span
          className={`font-display font-semibold tracking-tight text-ink ${textClass}`}
        >
          Nutcrack
        </span>
      )}
    </div>
  );
}
