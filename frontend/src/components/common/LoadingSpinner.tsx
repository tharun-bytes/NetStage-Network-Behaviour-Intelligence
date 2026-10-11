import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Processing network telemetry...",
  size = "md",
}) => {
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
      <Loader2 className={`animate-spin text-cyan-400 ${iconSizes[size]}`} />
      {message && <p className="mt-3 text-xs tracking-wider font-mono text-slate-400">{message}</p>}
    </div>
  );
};
