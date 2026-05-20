interface LogoProps {
  variant?: "default" | "small" | "large";
  className?: string;
  showText?: boolean;
}

export default function Logo({
  variant = "default",
  className = "",
  showText = true,
}: LogoProps) {
  const sizes = {
    small: { width: 20, height: 25, textClass: "text-base" },
    default: { width: 24, height: 30, textClass: "text-xl" },
    large: { width: 32, height: 40, textClass: "text-2xl" },
  };

  const { width, height, textClass } = sizes[variant];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 72 91"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M29.4414 83.043L47.1582 70.541L65.5947 83.0674L69.5 85.7217V17.5H25.5V85.8242L29.4414 83.043Z"
          stroke="#007ACC"
          strokeWidth="5"
        />
        <path
          d="M6.44141 68.043L24.1592 55.541L32.6611 61.3174L42.5947 68.0674L46.5 70.7217V2.5H2.5V70.8242L6.44141 68.043Z"
          stroke="#007ACC"
          strokeWidth="5"
        />
      </svg>
      {showText && (
        <span className={`text-primary font-playfair font-bold ${textClass}`}>
          Nutcrack
        </span>
      )}
    </div>
  );
}
