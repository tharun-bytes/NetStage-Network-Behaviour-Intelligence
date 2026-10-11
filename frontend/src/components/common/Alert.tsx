import React from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

interface AlertProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  onDismiss,
}) => {
  const configs = {
    info: {
      icon: Info,
      wrapper: "bg-cyan-950/40 border-cyan-800/60 text-cyan-200",
      iconColor: "text-cyan-400",
    },
    warning: {
      icon: AlertTriangle,
      wrapper: "bg-amber-950/40 border-amber-800/60 text-amber-200",
      iconColor: "text-amber-400",
    },
    error: {
      icon: XCircle,
      wrapper: "bg-rose-950/40 border-rose-800/60 text-rose-200",
      iconColor: "text-rose-400",
    },
    success: {
      icon: CheckCircle,
      wrapper: "bg-emerald-950/40 border-emerald-800/60 text-emerald-200",
      iconColor: "text-emerald-400",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`relative flex items-start gap-3 rounded-lg border p-4 text-sm ${config.wrapper}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1">
        {title && <h5 className="font-semibold leading-none tracking-tight mb-1 text-white">{title}</h5>}
        <div className="leading-relaxed opacity-90">{message}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
