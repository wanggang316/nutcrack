interface LogoProps {
  variant?: "default" | "small" | "large";
  className?: string;
  showText?: boolean;
}

const SIZES = {
  small: { px: 22, textClass: "text-base" },
  default: { px: 28, textClass: "text-lg" },
  large: { px: 64, textClass: "text-2xl" },
} as const;

/**
 * 栖枝 Perch bird mark (design v3, logo 4). Below 64px the simplified
 * "mark" cut is used (one spot, larger eye, tight viewBox); at 64px and up
 * the full illustration. Each has a light and a dark-theme variant.
 */
export function BirdMark({ size = 28 }: { size?: number }) {
  const full = size >= 64;
  const light = full ? "/bird.svg" : "/bird-mark.svg";
  const dark = full ? "/bird-dark.svg" : "/bird-mark-dark.svg";
  const common = {
    width: size,
    height: size,
    alt: "",
    "aria-hidden": true,
    loading: "eager",
    decoding: "async",
    style: { width: size, height: size },
  } as const;
  return (
    <>
      <img src={light} className="shrink-0 dark:hidden" {...common} />
      <img src={dark} className="hidden shrink-0 dark:block" {...common} />
    </>
  );
}

export default function Logo({
  variant = "default",
  className = "",
  showText = true,
}: LogoProps) {
  const { px, textClass } = SIZES[variant];
  const stacked = variant === "large";

  return (
    <div
      className={`flex items-center ${stacked ? "flex-col gap-3" : "gap-2"} ${className}`}
    >
      <BirdMark size={px} />
      {showText ? (
        <span
          className={`font-display font-semibold tracking-tight text-nc-text ${textClass}`}
        >
          Nutcrack
        </span>
      ) : (
        <span className="sr-only">Nutcrack</span>
      )}
    </div>
  );
}
