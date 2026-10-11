import React from "react";
import {
  Download,
  FolderOpen,
  Menu,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../api/client";

interface TopbarProps {
  activeTab: string;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  collapsed,
  setCollapsed,
}) => {
  const { status, profile, loading, loadSampleDataset, refreshStatus, refreshProfile, showToast } = useApp();

  const titleMap: Record<string, string> = {
    overview: "Telemetry Overview & KPI Dashboard",
    traffic: "Traffic Explorer & Flow Analyzer",
    classification: "Multi-Class Traffic Inference Engine",
    anomaly: "Unsupervised Anomaly Scoring (Isolation Forest)",
    explainability: "Explainable AI (XAI) & Attribution",
    copilot: "AI Security Copilot (Grounded Analysis)",
    agents: "AI Agent Control Center (Multi-Agent Forensics)",
    model_lab: "Model Lab — Evaluation & Comparison",
    reports: "Forensic Reports & Investigation History",
    data: "Data Management & UCI RT-IoT2022 Schema",
    settings: "Settings, Model Cards & System Attribution",
  };

  const handleDownloadReport = () => {
    const url = api.getReportDownloadUrl("txt");
    window.open(url, "_blank");
    showToast("Downloaded analytical summary report", "info");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#0d121f]/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">
            {titleMap[activeTab] || "Network Intelligence"}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>NetSage</span>
            <span>/</span>
            <span className="text-cyan-400 capitalize">{activeTab.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator pills */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Backend Active
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">
            {profile ? `${profile.rows_count.toLocaleString()} flows` : "No dataset"}
          </span>
        </div>

        {/* Quick action: Load Sample Fixture if no dataset */}
        {!profile && (
          <button
            onClick={() => loadSampleDataset()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 transition-colors shadow-sm shadow-cyan-900/30 disabled:opacity-50"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Load RT-IoT2022 Demo
          </button>
        )}

        {/* Quick action: Download text report */}
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Export Analysis Report"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export Report</span>
        </button>

        {/* Reload telemetry */}
        <button
          onClick={async () => {
            await refreshStatus();
            await refreshProfile();
            showToast("System telemetry refreshed", "info");
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
