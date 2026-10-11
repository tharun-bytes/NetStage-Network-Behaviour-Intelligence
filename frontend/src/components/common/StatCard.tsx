import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: "cyan" | "green" | "purple" | "amber" | "red";
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = "cyan",
  highlight = false,
}) => {
  const badgeStyles = {
    cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-800/60",
    green: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
    purple: "bg-purple-950/80 text-purple-300 border-purple-800/60",
    amber: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    red: "bg-rose-950/80 text-rose-300 border-rose-800/60",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#111827] border ${
        highlight ? "border-cyan-500/50 shadow-lg shadow-cyan-950/30" : "border-slate-800/80"
      } p-5 transition-all duration-200 hover:border-slate-700`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
            {badgeText && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyles[badgeType]}`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-slate-800/70 p-2.5 text-cyan-400 border border-slate-700/50">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
