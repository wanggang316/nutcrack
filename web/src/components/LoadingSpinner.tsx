import { type ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
  };

  const baseClass = "loading loading-spinner";
  const spinner = (
    <>
      <span className={`${baseClass} ${sizeClasses[size]} ${className}`} />
      {text && (
        <span className="ml-2 text-sm text-base-content/70">{text}</span>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center">{spinner}</div>;
}

export function CenteredLoading({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center p-8">{children}</div>;
}
