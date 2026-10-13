import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/** Flips `data-theme` on <html> (initial value is set in index.html). */
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`grid h-9 w-9 place-items-center rounded-lg border border-nc-border text-nc-muted transition-colors hover:text-nc-text ${className}`}
      onClick={() => {
        try {
          localStorage.setItem("nc-theme", next);
        } catch {
          /* storage unavailable: theme still applies for this visit */
        }
        setTheme(next);
      }}
      aria-label={next === "dark" ? "切换到暗色模式" : "切换到亮色模式"}
      title={next === "dark" ? "暗色模式" : "亮色模式"}
    >
      {theme === "dark" ? (
        <SunIcon className="h-[18px] w-[18px]" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
