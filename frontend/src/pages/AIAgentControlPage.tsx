import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Filter,
  Play,
  RotateCw,
  Search,
  ShieldAlert,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { AgentStepStatus, InvestigationDetail } from "../types";

export const AIAgentControlPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { profile, notify } = useApp();
  const [investigation, setInvestigation] = useState<InvestigationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [maxRecords, setMaxRecords] = useState<number>(25);
  const [targetCategory, setTargetCategory] = useState<string>("all");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "dossier" | "report">("pipeline");

  // Fetch recent investigations on load
  useEffect(() => {
    loadLatestInvestigation();
  }, []);

  const loadLatestInvestigation = async () => {
    try {
      const list = await api.getInvestigations();
      if (list && list.length > 0) {
        const latest = await api.getInvestigationDetail(list[0].investigation_id);
        setInvestigation(latest);
      }
    } catch {
      // initial load silent
    }
  };

  const handleStartInvestigation = async () => {
    if (!profile) {
      notify("Please load a dataset before initiating an investigation.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.startInvestigation({
        title: customTitle.trim() || undefined,
        target_category: targetCategory === "all" ? undefined : targetCategory,
        anomaly_threshold: threshold,
        max_records_to_investigate: maxRecords,
      });
      setInvestigation(res);
      notify("Multi-Agent Forensic Investigation completed successfully.", "success");
      setActiveTab("pipeline");
    } catch (err: any) {
      notify(`Investigation failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "running":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800 animate-pulse";
      case "error":
        return "bg-rose-950/80 text-rose-400 border-rose-800";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-rose-950 text-rose-300 border-rose-700";
      case "high":
        return "bg-amber-950 text-amber-300 border-amber-700";
      case "medium":
        return "bg-yellow-950 text-yellow-300 border-yellow-700";
      default:
        return "bg-cyan-950 text-cyan-300 border-cyan-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-purple-700/60 shadow-lg shadow-purple-950/50">
              <img
                src="/assets/netsage/network-topology.jpg"
                alt="Agent Topology"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Agent Control Center</h2>
                <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-300 border border-purple-800">
                  Sequential Multi-Agent Orchestration
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Coordinated autonomous pipeline: Traffic Analyst → Investigation Agent → Reporting Agent.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate("reports")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> Investigation History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" /> Launch Investigation Pipeline
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Target Dataset: <span className="text-cyan-300">{profile ? profile.source_name : "None"}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Custom Title */}
          <div>
            <label className="block text-slate-400 mb-1">Investigation Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Incident #402 - Flood Telemetry Audit"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Target Class Filter */}
          <div>
            <label className="block text-slate-400 mb-1">Target Traffic Category</label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Traffic Classes (Unfiltered)</option>
              {profile &&
                Object.keys(profile.target_distribution || {}).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
            </select>
          </div>

          {/* Anomaly Threshold */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Anomaly Threshold</span>
              <span className="font-mono text-cyan-400">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Max Flows */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Candidate Max Flows</span>
              <span className="font-mono text-cyan-400">{maxRecords}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxRecords}
              onChange={(e) => setMaxRecords(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleStartInvestigation}
            disabled={loading || !profile}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-950/40 hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" /> Orchestrating Agents...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Run Autonomous Investigation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      {investigation ? (
        <div className="space-y-4">
          {/* Status Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab("pipeline")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  activeTab === "pipeline"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Agent Pipeline Execution
              </button>
              <button
                onClick={() => setActiveTab("dossier")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  activeTab === "dossier"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Forensic Dossier ({investigation.evidence_dossier?.candidate_flows_count || 0} Flows)
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  activeTab === "report"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Final Forensic Report
              </button>
            </div>

            <div className="flex items-center gap-3">
              {investigation.final_report_json && (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-mono border ${getRiskBadge(
                    investigation.final_report_json.risk_rating
                  )}`}
                >
                  RISK: {investigation.final_report_json.risk_rating?.toUpperCase()}
                </span>
              )}
              {investigation.final_report_json?.report_id && (
                <div className="flex items-center gap-2">
                  <a
                    href={api.getInvestigationReportDownloadUrl(
                      investigation.final_report_json.report_id,
                      "markdown"
                    )}
                    download
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Markdown
                  </a>
                  <a
                    href={api.getInvestigationReportDownloadUrl(
                      investigation.final_report_json.report_id,
                      "json"
                    )}
                    download
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                  >
                    <Download className="h-3 w-3" /> JSON
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* View 1: Pipeline Steps Execution */}
          {activeTab === "pipeline" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {investigation.steps.map((step: AgentStepStatus, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Stage {idx + 1}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono border ${getStepStatusBadge(
                        step.status
                      )}`}
                    >
                      {step.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{step.agent_name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{step.stage}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800 min-h-[70px]">
                    {step.output_summary || "Step execution pending..."}
                  </p>

                  <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Evidence Collected: {step.evidence_collected_count}</span>
                    <span>{step.completed_at ? "Finished" : "Active"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View 2: Evidence Dossier */}
          {activeTab === "dossier" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 text-xs">
                  <span className="text-slate-400">Total Flagged Flows</span>
                  <p className="text-xl font-bold font-mono text-rose-400 mt-1">
                    {investigation.evidence_dossier?.candidate_flows_count || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 text-xs">
                  <span className="text-slate-400">Analyzed Protocol Mix</span>
                  <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                    {Object.entries(
                      investigation.evidence_dossier?.protocols_analyzed || {}
                    ).map(([p, cnt]: [string, any]) => (
                      <span
                        key={p}
                        className="rounded bg-slate-900 px-2 py-0.5 text-cyan-300 border border-slate-800"
                      >
                        {p}: {cnt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 text-xs">
                  <span className="text-slate-400">Target Category Filter</span>
                  <p className="text-sm font-semibold font-mono text-cyan-300 mt-1">
                    {investigation.evidence_dossier?.target_category_focus || "Global (All)"}
                  </p>
                </div>
              </div>

              {/* Statistical Divergences */}
              {investigation.evidence_dossier?.statistical_divergences?.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-white font-mono uppercase">
                    Feature Baseline Divergence (Outliers vs Normal)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {investigation.evidence_dossier.statistical_divergences.map(
                      (div: any, dIdx: number) => (
                        <div
                          key={dIdx}
                          className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1"
                        >
                          <span className="font-mono text-slate-300 font-semibold block truncate">
                            {div.feature}
                          </span>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Outlier Mean:</span>
                            <span className="font-mono text-rose-400">{div.candidate_mean?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Baseline Mean:</span>
                            <span className="font-mono text-slate-300">{div.baseline_mean?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>Divergence Ratio:</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {div.divergence_ratio?.toFixed(1)}x
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View 3: Final Markdown Report */}
          {activeTab === "report" && (
            <div className="rounded-xl border border-slate-800 bg-[#0d121f] p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {investigation.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {investigation.investigation_id} · Generated: {investigation.created_at}
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-wrap bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 font-mono">
                {investigation.final_report_markdown || "Report generation in progress..."}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-[#111827]/50 p-12 text-center space-y-3">
          <Bot className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Investigation Run Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Configure your analysis parameters above and trigger the 3-agent pipeline to automatically correlate suspicious flows against baseline traffic.
          </p>
        </div>
      )}
    </div>
  );
};
