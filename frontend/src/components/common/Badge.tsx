import React from "react";

interface BadgeProps {
  label: string;
  variant?: "normal" | "attack" | "warning" | "info" | "purple" | "slate";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant,
  size = "md",
}) => {
  // Infer variant if not explicitly provided
  let computedVariant = variant;
  if (!computedVariant) {
    const l = label.toLowerCase();
    if (l === "normal" || l === "healthy" || l === "active") {
      computedVariant = "normal";
    } else if (l.includes("dos") || l.includes("flood") || l.includes("attack") || l.includes("scan") || l.includes("poisoning") || l.includes("force")) {
      computedVariant = "attack";
    } else if (l.includes("tcp") || l.includes("udp") || l.includes("icmp")) {
      computedVariant = "info";
    } else {
      computedVariant = "slate";
    }
  }

  const styles = {
    normal: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
    attack: "bg-rose-950/70 text-rose-300 border-rose-800/60",
    warning: "bg-amber-950/70 text-amber-300 border-amber-800/60",
    info: "bg-cyan-950/70 text-cyan-300 border-cyan-800/60",
    purple: "bg-purple-950/70 text-purple-300 border-purple-800/60",
    slate: "bg-slate-800/80 text-slate-300 border-slate-700/60",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded border ${styles[computedVariant]} ${sizes[size]}`}>
      {label}
    </span>
  );
};
